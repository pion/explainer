// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';

const rfc8866 = (section: string) => ({
	label: `RFC 8866 §${section}`,
	href: `https://www.rfc-editor.org/rfc/rfc8866.html#section-${section}`
});

/**
 * The descriptive attributes RFC 8866 defines for its original purpose —
 * announcing multicast sessions in a directory — plus the RTSP attributes that
 * appear in streaming descriptions. None of them affect the transport.
 */
export const session: Record<string, Details> = {
	cat: {
		title: 'Category',
		syntax: 'cat:<category>',
		level: 'session',
		specs: [rfc8866('6.1')],
		description:
			'A dotted hierarchy of tokens categorising the session, so a receiver can filter a directory of announcements without parsing every description.',
		args: [
			{
				name: 'category',
				description:
					'For example `talk.ietf.mmusic`. Superseded in practice by out-of-band metadata.'
			}
		]
	},
	keywds: {
		title: 'Keywords',
		syntax: 'keywds:<keywords>',
		level: 'session',
		specs: [rfc8866('6.2')],
		description: 'Free-text keywords for the same directory-filtering purpose as "a=cat".',
		args: [
			{
				name: 'keywords',
				greedy: true,
				description: 'Interpreted in the character set given by "a=charset".'
			}
		]
	},
	tool: {
		title: 'Tool',
		syntax: 'tool:<name and version>',
		level: 'session',
		specs: [rfc8866('6.3')],
		description: 'The name and version of the software that generated this session description.',
		args: [
			{
				name: 'name and version',
				greedy: true,
				description:
					'Purely informational — but invaluable when debugging, because most interoperability failures come down to a known quirk of a particular stack and version.'
			}
		]
	},
	type: {
		title: 'Conference Type',
		syntax: 'type:<conference type>',
		level: 'session',
		specs: [rfc8866('6.9')],
		description:
			'The kind of conference, which suggests default directions and floor control to the receiving tool.',
		args: [
			{
				name: 'conference type',
				description: 'The conference type.',
				values: [
					{ value: 'broadcast', description: 'One-to-many. Recipients default to receive-only.' },
					{ value: 'meeting', description: 'A many-to-many meeting with no formal floor control.' },
					{ value: 'moderated', description: 'Floor control is exercised by a moderator.' },
					{ value: 'test', description: 'A test session; recipients should not send.' },
					{ value: 'H332', description: 'A loosely coupled ITU H.332 conference.' }
				]
			}
		]
	},
	charset: {
		title: 'Character Set',
		syntax: 'charset:<character set>',
		level: 'session',
		specs: [rfc8866('6.10')],
		description:
			'The character set used by the "s=", "i=", "u=", "e=", "p=" and "a=keywds" lines of this description.',
		args: [
			{
				name: 'character set',
				description:
					'An IANA charset name. When absent — and it should be — the fields are ISO 10646 in UTF-8. This attribute exists only for descriptions predating that default.'
			}
		]
	},
	sdplang: {
		title: 'SDP Language',
		syntax: 'sdplang:<language tag>',
		level: 'both',
		specs: [rfc8866('6.11')],
		description:
			'The language of the *description itself* — of its "s=" and "i=" text, not of the media.',
		args: [
			{
				name: 'language tag',
				description:
					'A [BCP 47](https://www.rfc-editor.org/info/bcp47) tag such as `en` or `pt-BR`.'
			}
		]
	},
	lang: {
		title: 'Media Language',
		syntax: 'lang:<language tag>',
		level: 'both',
		specs: [rfc8866('6.12')],
		description:
			'The language of the *media* — what is actually spoken or captioned. A session may repeat it once per media description to offer several audio languages.',
		args: [
			{
				name: 'language tag',
				description:
					'A [BCP 47](https://www.rfc-editor.org/info/bcp47) tag such as `en` or `pt-BR`.'
			}
		]
	},
	label: {
		title: 'Label',
		syntax: 'label:<label>',
		level: 'media',
		specs: [{ label: 'RFC 4574', href: 'https://datatracker.ietf.org/doc/html/rfc4574' }],
		description:
			'An opaque pointer from this media description to a description of it held elsewhere — typically a conference roster carried in XML.',
		args: [
			{
				name: 'label',
				greedy: true,
				description: 'Meaningful only to the application that issued it.'
			}
		]
	},
	content: {
		title: 'Content',
		syntax: 'content:<content type> [<content type>]...',
		level: 'media',
		specs: [{ label: 'RFC 4796', href: 'https://datatracker.ietf.org/doc/html/rfc4796' }],
		description:
			'What the media depicts, so a client with two video streams can tell the camera from the slides.',
		args: [
			{
				name: 'content type',
				description: 'The content modifier.',
				values: [
					{ value: 'slides', description: 'Presentation material.' },
					{ value: 'speaker', description: 'The current speaker.' },
					{
						value: 'main',
						description: 'The main stream — what a single-stream client should display.'
					},
					{ value: 'sl', description: 'Sign language.' },
					{ value: 'alt', description: 'An alternative to the main stream.' }
				]
			}
		]
	},
	control: {
		title: 'Control URI',
		syntax: 'control:<uri>',
		level: 'both',
		specs: [
			{
				label: 'RFC 7826 Appendix D.1.1',
				href: 'https://datatracker.ietf.org/doc/html/rfc7826#appendix-D.1.1'
			}
		],
		description:
			'An RTSP attribute giving the URI that controls this stream — the target of SETUP, PLAY and TEARDOWN.',
		args: [
			{
				name: 'uri',
				greedy: true,
				description:
					'Absolute, or relative to the session base URI. A session-level `control:*` means the whole presentation is controlled as one.'
			}
		]
	},
	range: {
		title: 'Range',
		syntax: 'range:<ranges-specifier>',
		level: 'both',
		specs: [
			{
				label: 'RFC 7826 Appendix D.1.6',
				href: 'https://datatracker.ietf.org/doc/html/rfc7826#appendix-D.1.6'
			}
		],
		description: 'An RTSP attribute stating the time range over which the stream is available.',
		args: [
			{
				name: 'ranges-specifier',
				greedy: true,
				description:
					'`npt=0-` marks a live stream with no fixed end; `npt=0-133.2` a recording of known length. Also expressible in SMPTE timecode or absolute UTC.'
			}
		]
	}
};
