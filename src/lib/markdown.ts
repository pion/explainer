// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;'
};

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => ESCAPES[char]);

/**
 * Renders the small subset of Markdown used by the RFC excerpts in `constants.ts`.
 * Input is escaped first, so only the tags produced here can reach the DOM; they
 * are styled by the element rules in routes/layout.css.
 */
const inline = (text: string) =>
	escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-heading font-medium">$1</strong>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) =>
			/^https?:\/\//.test(href)
				? `<a class="underline underline-offset-2" href="${href}" target="_blank" rel="noreferrer">${label}</a>`
				: match
		);

export const markdown = (text: string) =>
	text
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.map((paragraph) => `<p class="mt-2 first:mt-0">${inline(paragraph)}</p>`)
		.join('');
