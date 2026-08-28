// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

/** A pointer into the document that defines a field or attribute. */
export type SpecRef = { label: string; href: string };

/** One of the values an argument is allowed — or commonly known — to take. */
export type ValueDoc = { value: string; description: string };

export type ArgDoc = {
	/** Placeholder name, matching a `<name>` in the owning `syntax` template. */
	name: string;
	description?: string;
	/** Documented values, matched case-insensitively against the token in the editor. */
	values?: ValueDoc[];
	/** Absorbs the rest of the line, spaces included, for free text such as a session name. */
	greedy?: boolean;
};

/** Where a line or attribute is allowed to appear in a session description. */
export type Level = 'session' | 'media' | 'both';

/** Everything the details panel knows about one kind of SDP line. */
export type Details = {
	title: string;
	/** Grammar for the line, in the notation described in `grammar.ts`. */
	syntax: string;
	description: string;
	args: ArgDoc[];
	details?: string;
	specs?: SpecRef[];
	level?: Level;
};

/**
 * One matched span of a line: either a grammar literal or a bound argument.
 * Offsets are relative to the line, not to the description, so the same line
 * text parses to the same fields wherever it appears — which is what lets the
 * parser cache a line and reuse it across edits.
 */
export type SDPField = {
	text: string;
	/** Offset of the first character, from the start of the line. */
	start: number;
	/** Offset just past the last character, from the start of the line. */
	end: number;
	/** Index into the owning `Details.args`, or null for literals and unmatched tokens. */
	argIndex: number | null;
	/** Literals are grammar keywords ("typ", "candidate"); values are bound arguments. */
	kind: 'key' | 'value';
};

/** One rendered slice of a line; the parts of a line concatenate back to `content`. */
export type SDPPart = {
	text: string;
	kind: 'plain' | 'type' | 'key' | 'value';
	fieldIndex?: number;
};

export type SDPLine = {
	content: string;
	/** Absolute offset of the line's first character in the source text. */
	start: number;
	/** Absolute offset just past the line's last character in the source text. */
	end: number;
	/** The single character before the "=", when the line has the shape "x=value". */
	type?: string;
	/** Attribute name for "a=" lines, e.g. "candidate". */
	attribute?: string;
	details?: Details;
	fields: SDPField[];
	parts: SDPPart[];
	/** Zero-based index of the enclosing media description, or null at session level. */
	section: number | null;
	/** Media type of the enclosing media description, e.g. "video". */
	sectionMedia?: string;
};

/** A caret or pointer position resolved onto a line and, when inside one, a field. */
export type SDPLocation = { lineIndex: number; fieldIndex: number | null };

/** Whole-description measurements the editor's chrome is laid out from. */
export type SDPOutline = {
	/** Media section index → the run of lines it spans, for the gutter marker. */
	sections: Map<number, { first: number; count: number }>;
	/** Length of the longest line, which sets how far the editor scrolls sideways. */
	columns: number;
};
