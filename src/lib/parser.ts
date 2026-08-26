// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import { grammarFor, matchTemplate, type Token } from './grammar';
import { attributeName, lookup } from './spec';
import type { SDPField, SDPLine, SDPLocation, SDPPart } from './types';

const LINE_BREAK = /\r\n|\r|\n/g;
const TOKEN = /\S+/g;

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
		lines.push(parseLine(sdp.slice(lineStart, match.index), lineStart));
		lineStart = match.index + match[0].length;
	}
	lines.push(parseLine(sdp.slice(lineStart), lineStart));

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

const tokenize = (value: string, valueStart: number): Token[] => {
	const tokens: Token[] = [];
	let token: RegExpExecArray | null;

	TOKEN.lastIndex = 0;
	while ((token = TOKEN.exec(value)) !== null) {
		tokens.push({ text: token[0], start: valueStart + token.index });
	}

	return tokens;
};

const parseLine = (content: string, start: number): SDPLine => {
	const line: SDPLine = {
		content,
		start,
		end: start + content.length,
		fields: [],
		parts: [],
		section: null
	};

	// An SDP line is "<single-character type>=<value>"; anything else is free text.
	const indent = content.length - content.trimStart().length;
	if (content[indent + 1] !== '=') {
		if (content) line.parts.push({ text: content, kind: 'plain' });
		return line;
	}

	line.type = content[indent];

	const valueStart = start + indent + 2;
	const value = content.slice(indent + 2);
	const tokens = tokenize(value, valueStart);

	if (line.type === 'a' && tokens.length) line.attribute = attributeName(tokens[0].text);

	line.details = lookup(line.type, tokens[0]?.text ?? '');
	line.fields = bindFields(line, tokens, content, start);
	line.parts = buildParts(line, indent);

	return line;
};

/** Runs the line's grammar over its tokens and resolves each match to an argument. */
const bindFields = (line: SDPLine, tokens: Token[], content: string, start: number): SDPField[] => {
	const fields: SDPField[] = [];

	let consumed = 0;

	if (line.details) {
		const grammar = grammarFor(line.details);
		const result = matchTemplate(grammar, tokens, content, start);

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
const buildParts = (line: SDPLine, indent: number): SDPPart[] => {
	const { content, start, type } = line;
	const parts: SDPPart[] = [];

	if (indent) parts.push({ text: content.slice(0, indent), kind: 'plain' });
	parts.push({ text: type as string, kind: 'type' });

	let cursor = start + indent + 1;

	line.fields.forEach((field, fieldIndex) => {
		if (field.start > cursor) {
			parts.push({ text: content.slice(cursor - start, field.start - start), kind: 'plain' });
		}

		parts.push({ text: field.text, kind: field.kind, fieldIndex });
		cursor = field.end;
	});

	if (cursor < line.end) parts.push({ text: content.slice(cursor - start), kind: 'plain' });

	return parts;
};

/** Maps a caret offset in the source text onto the line and field it sits in. */
export const locate = (lines: SDPLine[], pos: number): SDPLocation | null => {
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (pos > line.end) continue;

		for (let j = 0; j < line.fields.length; j++) {
			const field = line.fields[j];
			if (pos >= field.start && pos <= field.end) return { lineIndex: i, fieldIndex: j };
		}

		return { lineIndex: i, fieldIndex: null };
	}

	return lines.length ? { lineIndex: lines.length - 1, fieldIndex: null } : null;
};
