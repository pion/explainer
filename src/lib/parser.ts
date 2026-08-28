// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import { grammarFor, matchTemplate, type Token } from './grammar';
import { attributeName, lookup } from './spec';
import type { Details, SDPField, SDPLine, SDPLocation, SDPOutline, SDPPart } from './types';

const LINE_BREAK = /\r\n|\r|\n/g;
const TOKEN = /\S+/g;

/** Everything about a line that is decided by its own text and nothing else. */
type LineCore = Pick<SDPLine, 'content' | 'type' | 'attribute' | 'details' | 'fields' | 'parts'>;

/**
 * Parsing a line is pure in its content, so the same text always yields the same
 * core. An edit only ever rewrites the line the caret is on, which means a
 * keystroke reparses one line and reuses every other — what stops a long
 * description from being rebuilt from scratch between two characters.
 */
const cores = new Map<string, LineCore>();

// Every intermediate state of a line being typed is cached too, so the cache is
// dropped whole once it outgrows any plausible description rather than being
// aged an entry at a time.
const CORE_LIMIT = 8192;

const coreFor = (content: string): LineCore => {
	const cached = cores.get(content);
	if (cached) return cached;

	const core = parseLine(content);

	if (cores.size >= CORE_LIMIT) cores.clear();
	cores.set(content, core);

	return core;
};

/**
 * Parses an SDP body into lines that keep their absolute character offsets in
 * the source text, so the caret position in the editor can be mapped back onto
 * a line and a field without re-deriving any lengths.
 *
 * Each line is matched against the grammar of whatever it turns out to be — the
 * "m=" media-field, the "a=candidate" attribute, and so on — which is what lets
 * a token know which documented argument it stands for.
 */
export const parseSDP = (sdp: string): SDPLine[] => {
	const lines: SDPLine[] = [];

	let lineStart = 0;
	let match: RegExpExecArray | null;

	LINE_BREAK.lastIndex = 0;
	while ((match = LINE_BREAK.exec(sdp)) !== null) {
		lines.push(place(sdp.slice(lineStart, match.index), lineStart));
		lineStart = match.index + match[0].length;
	}
	lines.push(place(sdp.slice(lineStart), lineStart));

	// Everything after an "m=" line belongs to that media description, and
	// attributes read differently there — a media-level "a=mid" names a stream,
	// a session-level "a=group" refers to those names.
	let section: number | null = null;
	let media: string | undefined;

	for (const line of lines) {
		if (line.type === 'm') {
			section = section === null ? 0 : section + 1;
			media = line.fields.find((field) => field.argIndex === 0)?.text;
		}

		line.section = section;
		line.sectionMedia = media;
	}

	return lines;
};

/** Anchors a line's cached core at the offset this document puts it at. */
const place = (content: string, start: number): SDPLine => ({
	...coreFor(content),
	start,
	end: start + content.length,
	section: null
});

/**
 * The two whole-document facts the editor's chrome needs, gathered in the one
 * pass the lines are already being walked in: the run of lines each media
 * description spans, for the gutter marker, and how wide the widest line is,
 * which is what the overlay reserves room for while most lines go unrendered.
 */
export const outlineOf = (lines: SDPLine[]): SDPOutline => {
	const sections = new Map<number, { first: number; count: number }>();
	let columns = 0;

	lines.forEach((line, i) => {
		if (line.content.length > columns) columns = line.content.length;
		if (line.section === null) return;

		const span = sections.get(line.section);
		if (!span) sections.set(line.section, { first: i, count: 1 });
		// Blank lines trailing the section say nothing about it, so the marker
		// stops at the last line that does.
		else if (line.content.trim()) span.count = i - span.first + 1;
	});

	return { sections, columns };
};

const tokenize = (value: string, valueStart: number): Token[] => {
	const tokens: Token[] = [];
	let token: RegExpExecArray | null;

	TOKEN.lastIndex = 0;
	while ((token = TOKEN.exec(value)) !== null) {
		tokens.push({ text: token[0], start: valueStart + token.index });
	}

	return tokens;
};

const parseLine = (content: string): LineCore => {
	const line: LineCore = { content, fields: [], parts: [] };

	// An SDP line is "<single-character type>=<value>"; anything else is free text.
	const indent = content.length - content.trimStart().length;
	if (content[indent + 1] !== '=') {
		if (content) line.parts.push({ text: content, kind: 'plain' });
		return line;
	}

	line.type = content[indent];

	const valueStart = indent + 2;
	const tokens = tokenize(content.slice(valueStart), valueStart);

	if (line.type === 'a' && tokens.length) line.attribute = attributeName(tokens[0].text);

	line.details = lookup(line.type, tokens[0]?.text ?? '');
	line.fields = bindFields(line.details, tokens, content);
	line.parts = buildParts(line, indent);

	return line;
};

/** Runs the line's grammar over its tokens and resolves each match to an argument. */
const bindFields = (details: Details | undefined, tokens: Token[], content: string): SDPField[] => {
	const fields: SDPField[] = [];

	let consumed = 0;

	if (details) {
		const grammar = grammarFor(details);
		const result = matchTemplate(grammar, tokens, content);

		consumed = result.consumed;

		for (const match of result.matches) {
			fields.push({
				text: match.text,
				start: match.start,
				end: match.end,
				argIndex: match.name === null ? null : grammar.argIndexOf(match.name),
				kind: match.name === null ? 'key' : 'value'
			});
		}
	}

	// Tokens the grammar could not account for — a malformed line, or one still
	// being typed — stay highlightable so the line as a whole keeps explaining
	// itself; they simply carry no argument documentation.
	for (const token of tokens.slice(consumed)) {
		fields.push({
			text: token.text,
			start: token.start,
			end: token.start + token.text.length,
			argIndex: null,
			kind: 'value'
		});
	}

	return fields;
};

/**
 * Slices the line into the spans the overlay renders. `cursor` walks the raw
 * line so every character — including the "=" and any runs of spaces between
 * fields — ends up in exactly one part. That keeps the rendered overlay
 * glyph-for-glyph aligned with the textarea underneath.
 */
const buildParts = (line: LineCore, indent: number): SDPPart[] => {
	const { content, type } = line;
	const parts: SDPPart[] = [];

	if (indent) parts.push({ text: content.slice(0, indent), kind: 'plain' });
	parts.push({ text: type as string, kind: 'type' });

	let cursor = indent + 1;

	line.fields.forEach((field, fieldIndex) => {
		if (field.start > cursor) {
			parts.push({ text: content.slice(cursor, field.start), kind: 'plain' });
		}

		parts.push({ text: field.text, kind: field.kind, fieldIndex });
		cursor = field.end;
	});

	if (cursor < content.length) parts.push({ text: content.slice(cursor), kind: 'plain' });

	return parts;
};

/** Maps a caret offset in the source text onto the line and field it sits in. */
export const locate = (lines: SDPLine[], pos: number): SDPLocation | null => {
	if (!lines.length) return null;

	// Lines are in order and cover the text end to end, so the one holding an
	// offset is a binary search rather than a walk down from the top.
	let low = 0;
	let high = lines.length - 1;

	while (low < high) {
		const mid = (low + high) >> 1;
		if (pos > lines[mid].end) low = mid + 1;
		else high = mid;
	}

	const line = lines[low];
	const offset = pos - line.start;

	for (let j = 0; j < line.fields.length; j++) {
		const field = line.fields[j];
		if (offset >= field.start && offset <= field.end) return { lineIndex: low, fieldIndex: j };
	}

	return { lineIndex: low, fieldIndex: null };
};
