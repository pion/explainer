// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from './types';

/**
 * Field grammars are authored the way the RFCs write them:
 *
 *     candidate:<foundation> <component-id> typ <cand-type> [<extension> <value>]...
 *
 * `<name>` is a placeholder bound to the `ArgDoc` of the same name, bare text is
 * a literal that has to appear verbatim, `[...]` marks something optional, and a
 * trailing `...` repeats whatever it follows. Whitespace separates tokens, so
 * anything written without a space — `candidate:<foundation>`, `<port>/<count>` —
 * describes the inside of a single token and is split on the literals between
 * the placeholders.
 *
 * One template therefore drives three things at once: the syntax line shown in
 * the details panel, which token in the editor belongs to which documented
 * argument, and the sub-token splits that let `opus/48000/2` highlight in three
 * pieces.
 */

type Atom = { text: string; placeholder: boolean; optional: boolean };

type Node =
	| { kind: 'slot'; atoms: Atom[]; optional: boolean; repeat: boolean }
	| { kind: 'group'; nodes: Node[]; optional: boolean; repeat: boolean };

export type Token = { text: string; start: number };

/** A span of the source bound to a placeholder (`name`) or matched literally. */
export type Match = { text: string; start: number; end: number; name: string | null };

export type MatchResult = {
	matches: Match[];
	/** How many tokens the template accounted for; the rest are surplus. */
	consumed: number;
};

/** Splits one whitespace-delimited chunk of a template into its atoms. */
const parseAtoms = (text: string): Atom[] => {
	const atoms: Atom[] = [];
	let optional = false;
	let literal = '';

	const flush = () => {
		if (literal) atoms.push({ text: literal, placeholder: false, optional });
		literal = '';
	};

	for (let i = 0; i < text.length; ) {
		const char = text[i];

		if (char === '[' || char === ']') {
			flush();
			optional = char === '[';
			i++;
		} else if (char === '<' && text.includes('>', i)) {
			const close = text.indexOf('>', i);
			flush();
			atoms.push({ text: text.slice(i + 1, close), placeholder: true, optional });
			i = close + 1;
		} else {
			literal += char;
			i++;
		}
	}

	flush();

	return atoms;
};

// Chunks are whitespace-separated, except that a placeholder is atomic: names
// like <encoding name> and <format specific parameters> read far better than
// the hyphenated alternatives, and the space inside them is not a separator.
const CHUNK = /(?:<[^>]*>|\S)+/g;

const parseTemplate = (syntax: string): Node[] => {
	const nodes: Node[] = [];

	// Groups only ever nest one level deep in practice, so a single pending list
	// is enough to collect the slots between a "[" and its "]".
	let group: Node[] | null = null;

	for (const chunk of syntax.match(CHUNK) ?? []) {
		let text = chunk;
		let closes = false;

		// A "[" the chunk does not close itself opens a group spanning later chunks;
		// a "[...]" contained in one chunk is just an optional run of atoms.
		if (group === null && text.startsWith('[') && !text.includes(']', 1)) {
			group = [];
			text = text.slice(1);
		} else if (group !== null && text.includes(']')) {
			text = text.replace(']', '');
			closes = true;
		}

		let repeat = false;
		if (text.endsWith('...')) {
			repeat = true;
			text = text.slice(0, -3);
		}

		if (text) {
			const atoms = parseAtoms(text);
			(group ?? nodes).push({
				kind: 'slot',
				atoms,
				optional: atoms.every((atom) => atom.optional),
				// A "..." on the closing chunk repeats the group, not this last slot.
				repeat: repeat && !closes
			});
		}

		if (closes && group) {
			nodes.push({ kind: 'group', nodes: group, optional: true, repeat });
			group = null;
		}
	}

	return nodes;
};

/** Compiled template plus the name→index lookup its matches are resolved through. */
export type Grammar = {
	nodes: Node[];
	argIndexOf: (name: string) => number | null;
	isGreedy: (name: string) => boolean;
};

const cache = new WeakMap<Details, Grammar>();

export const grammarFor = (details: Details): Grammar => {
	let grammar = cache.get(details);
	if (grammar) return grammar;

	const indices = new Map(details.args.map((arg, index) => [arg.name, index]));

	grammar = {
		nodes: parseTemplate(details.syntax),
		argIndexOf: (name) => indices.get(name) ?? null,
		isGreedy: (name) => Boolean(details.args[indices.get(name) ?? -1]?.greedy)
	};

	cache.set(details, grammar);

	return grammar;
};

/**
 * Matches one token against a slot, splitting it on the literals that sit
 * between the slot's placeholders. Returns null when the token does not fit,
 * which lets optional slots and repeats back out cleanly.
 *
 * `spill` reports that the slot also claimed `after`, the token following it.
 * That happens when a token ends on the separator its value was supposed to
 * follow — "a=msid-semantic: WMS", where the space is decoration rather than a
 * field boundary. Real descriptions are written both ways.
 */
const matchAtoms = (
	atoms: Atom[],
	token: Token,
	after: Token | undefined
): { matches: Match[]; spill: boolean } | null => {
	const { text, start } = token;
	const matches: Match[] = [];
	let spill = false;
	let pos = 0;

	for (let i = 0; i < atoms.length; i++) {
		const atom = atoms[i];

		if (!atom.placeholder) {
			if (!text.startsWith(atom.text, pos)) {
				// An optional literal that is absent ends the slot; the token has to be
				// spent by then, or this simply is not the slot the token belongs to.
				return atom.optional && pos === text.length ? { matches, spill } : null;
			}

			matches.push({
				text: atom.text,
				start: start + pos,
				end: start + pos + atom.text.length,
				name: null
			});
			pos += atom.text.length;
			continue;
		}

		// A placeholder runs up to the next literal, or to the end of the token.
		const next = atoms[i + 1];
		let end = text.length;

		if (next && !next.placeholder) {
			const at = text.indexOf(next.text, pos);
			if (at >= 0) end = at;
			else if (!next.optional) return null;
		}

		if (end > pos) {
			matches.push({
				text: text.slice(pos, end),
				start: start + pos,
				end: start + end,
				name: atom.text
			});
		} else if (atom.optional) {
			// Nothing there, and nothing required it to be.
		} else if (after && atoms.slice(i + 1).every((rest) => rest.optional)) {
			// The token ran out on the separator: the value is the next token along.
			matches.push({
				text: after.text,
				start: after.start,
				end: after.start + after.text.length,
				name: atom.text
			});
			spill = true;

			return { matches, spill };
		} else {
			return null;
		}

		pos = end;
	}

	return pos === text.length ? { matches, spill } : null;
};

/**
 * Walks a compiled template over a line's tokens. Matching is deliberately
 * forgiving — a line being typed is malformed most of the time — so it binds
 * what it can and reports where it gave up rather than failing outright.
 */
export const matchTemplate = (
	grammar: Grammar,
	tokens: Token[],
	source: string,
	sourceStart: number
): MatchResult => {
	// A greedy argument runs to the end of the last token rather than the end of
	// the line, so trailing whitespace never lands inside a highlighted field.
	const last = tokens[tokens.length - 1];
	const lineEnd = last ? last.start + last.text.length : 0;

	const matches: Match[] = [];
	let consumed = 0;

	const once = (node: Node): boolean => {
		const mark = { consumed, length: matches.length };

		if (node.kind === 'group') {
			for (const child of node.nodes) {
				if (run(child)) continue;
				consumed = mark.consumed;
				matches.length = mark.length;
				return false;
			}

			return true;
		}

		if (consumed >= tokens.length) return false;

		const bound = matchAtoms(node.atoms, tokens[consumed], tokens[consumed + 1]);
		if (!bound) return false;

		matches.push(...bound.matches);
		consumed += bound.spill ? 2 : 1;

		// A greedy argument swallows the remainder of the line, spaces included, so
		// free text such as a session name stays one field instead of one per word.
		const tail = bound.matches[bound.matches.length - 1];
		if (tail?.name && grammar.isGreedy(tail.name) && consumed < tokens.length) {
			tail.end = lineEnd;
			tail.text = source.slice(tail.start - sourceStart, lineEnd - sourceStart);
			consumed = tokens.length;
		}

		return true;
	};

	const run = (node: Node): boolean => {
		if (!node.repeat) return once(node) || node.optional;

		let matched = false;
		while (consumed < tokens.length) {
			const before = consumed;
			if (!once(node)) break;
			matched = true;
			// A group of nothing but optional slots would otherwise spin forever.
			if (consumed === before) break;
		}

		return matched || node.optional;
	};

	for (const node of grammar.nodes) if (!run(node)) break;

	return { matches, consumed };
};

/**
 * Splits a template back into the pieces the details panel renders, so the
 * syntax line can highlight the placeholder the caret is currently inside.
 * Literal text — brackets, "...", separators — is passed through as authored.
 */
export const syntaxParts = (details: Details): { text: string; argIndex: number | null }[] => {
	const { argIndexOf } = grammarFor(details);
	const parts: { text: string; argIndex: number | null }[] = [];
	const placeholder = /<([^>]+)>/g;

	let cursor = 0;
	let found: RegExpExecArray | null;

	while ((found = placeholder.exec(details.syntax)) !== null) {
		if (found.index > cursor) {
			parts.push({ text: details.syntax.slice(cursor, found.index), argIndex: null });
		}

		parts.push({ text: found[0], argIndex: argIndexOf(found[1]) });
		cursor = found.index + found[0].length;
	}

	if (cursor < details.syntax.length) {
		parts.push({ text: details.syntax.slice(cursor), argIndex: null });
	}

	return parts;
};
