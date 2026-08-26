// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../types';

const rfc8866 = (section: string) => ({
	label: `RFC 8866 §${section}`,
	href: `https://www.rfc-editor.org/rfc/rfc8866.html#section-${section}`
});

const NETTYPE = [
	{ value: 'IN', description: 'The Internet. The only network type defined by SDP itself.' }
];

const ADDRTYPE = [
	{ value: 'IP4', description: 'An IPv4 address, or a host name that resolves to one.' },
	{ value: 'IP6', description: 'An IPv6 address, or a host name that resolves to one.' }
];

/**
 * The line types of RFC 8866, in the order a session description presents them:
 * `v o s i u e p c b t r z k a` at session level, then one `m` block per media
 * description carrying its own `i c b k a` lines.
 */
export const fields: Record<string, Details> = {
	v: {
		title: 'Protocol Version',
		syntax: '<version>',
		level: 'session',
		specs: [rfc8866('5.1')],
		description:
			'The "v=" line (version-field) gives the version of the Session Description Protocol, currently only 0.',
		args: [
			{
				name: 'version',
				description:
					'The version of the Session Description Protocol. There is no minor version number.',
				values: [
					{ value: '0', description: 'The only version ever defined, by RFC 4566 and RFC 8866.' }
				]
			}
		],
		details: `The "v=" line **MUST** be the very first line of a session description. Parsers use it as the marker that what follows is SDP at all, which is why RFC 8866 kept the value fixed rather than bumping it when the specification was revised.`
	},
	o: {
		title: 'Origin',
		syntax: '<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>',
		level: 'session',
		specs: [rfc8866('5.2')],
		description:
			'The "o=" line (origin-field) gives the originator of the session plus a session identifier and version number.',
		details: `In general, the "o=" line serves as a globally unique identifier for this version of the session description, and the subfields excepting the version, taken together identify the session irrespective of any modifications.

For privacy reasons, it is sometimes desirable to obfuscate the username and IP address of the session originator. If this is a concern, an arbitrary <username> and private <unicast-address> **MAY** be chosen to populate the "o=" line, provided that these are selected in a manner that does not affect the global uniqueness of the field.

WebRTC endpoints follow [RFC 9429](https://datatracker.ietf.org/doc/html/rfc9429#section-5.2.1) instead of the RFC 8866 advice: the username is "-", the address is the wildcard 0.0.0.0, and <sess-id> is a cryptographically random 63-bit number. Nothing about the offerer's host leaks into the offer, and the identifier is still unique. Pion's \`NewJSEPSessionDescription\` builds exactly that.`,
		args: [
			{
				name: 'username',
				description:
					'The user\'s login on the originating host, or "-" if the originating host does not support the concept of user IDs. The <username> **MUST NOT** contain spaces.'
			},
			{
				name: 'sess-id',
				description:
					'A numeric string such that the tuple of <username>, <sess-id>, <nettype>, <addrtype>, and <unicast-address> forms a globally unique identifier for the session. The method of allocation is up to the creating tool, but a timestamp in NTP format — seconds since January 1, 1900 UTC — is recommended.'
			},
			{
				name: 'sess-version',
				description:
					'A version number for this session description. Its usage is up to the creating tool, so long as <sess-version> is increased when a modification is made to the session description. In an offer/answer exchange this is how a peer tells a renegotiation from a retransmission.'
			},
			{ name: 'nettype', description: 'The type of network.', values: NETTYPE },
			{ name: 'addrtype', description: 'The type of the address that follows.', values: ADDRTYPE },
			{
				name: 'unicast-address',
				description:
					'An address of the machine from which the session was created. A fully qualified domain name is the form that **SHOULD** be given unless it is unavailable, in which case a globally unique address **MAY** be substituted. IPv6 addresses are written as specified in [Section 4](https://www.rfc-editor.org/rfc/rfc5952#section-4) of [RFC 5952](https://datatracker.ietf.org/doc/html/rfc5952).'
			}
		]
	},
	s: {
		title: 'Session Name',
		syntax: '<session name>',
		level: 'session',
		specs: [rfc8866('5.3')],
		description:
			'The "s=" line (session-name-field) is the textual session name. There **MUST** be one and only one "s=" line per session description, and it **MUST NOT** be empty.',
		args: [
			{
				name: 'session name',
				greedy: true,
				description:
					'The name of the session. If a session has no meaningful name, then "s= " or "s=-" — a single space or dash — is **RECOMMENDED**.'
			}
		],
		details: `If a session-level "a=charset:" attribute is present, it specifies the character set used in the "s=" line. Otherwise the line **MUST** contain ISO 10646 characters in UTF-8 encoding.`
	},
	i: {
		title: 'Session Information',
		syntax: '<session information>',
		level: 'both',
		specs: [rfc8866('5.4')],
		description:
			'The "i=" line (information-field) provides textual information about the session. There can be at most one session-level "i=" line, and at most one "i=" line in each media description.',
		args: [
			{
				name: 'session information',
				greedy: true,
				description: 'Free-form human-readable information about the session or media stream.'
			}
		],
		details: `In media descriptions, "i=" lines are primarily intended for labeling media streams. As such, they are most likely to be useful when a single session has more than one distinct media stream of the same media type — two whiteboards, say, one for slides and one for questions.

The "i=" line is intended to be read by people. It is not suitable for parsing by automata.`
	},
	u: {
		title: 'URI',
		syntax: '<uri>',
		level: 'session',
		specs: [rfc8866('5.5')],
		description:
			'The "u=" line (uri-field) provides a URI ([RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986)) pointing at additional human-readable information about the session. This line is **OPTIONAL** and no more than one is allowed per session description.',
		args: [
			{
				name: 'uri',
				greedy: true,
				description: 'A URI pointing to more information about the session.'
			}
		]
	},
	e: {
		title: 'Email Address',
		syntax: '<email-address>',
		level: 'session',
		specs: [rfc8866('5.6')],
		description:
			'The **OPTIONAL** "e=" line (email-field) gives contact information for the person responsible for the session. Any number may appear.',
		args: [
			{
				name: 'email-address',
				greedy: true,
				description:
					'An email address, optionally followed by the contact name in parentheses — `j.doe@example.com (Jane Doe)` — or written in the RFC 5322 form `Jane Doe <j.doe@example.com>`.'
			}
		]
	},
	p: {
		title: 'Phone Number',
		syntax: '<phone-number>',
		level: 'session',
		specs: [rfc8866('5.6')],
		description:
			'The **OPTIONAL** "p=" line (phone-field) gives a contact phone number for the person responsible for the session.',
		args: [
			{
				name: 'phone-number',
				greedy: true,
				description:
					'A phone number, **SHOULD** be given in the international format `+1 617 555 6011`, optionally followed by a contact name in parentheses.'
			}
		]
	},
	c: {
		title: 'Connection Information',
		syntax: '<nettype> <addrtype> <connection-address>[/<ttl>][/<number of addresses>]',
		level: 'both',
		specs: [rfc8866('5.7')],
		description:
			'The "c=" line (connection-field) contains information necessary to establish a network connection.',
		args: [
			{ name: 'nettype', description: 'The network type.', values: NETTYPE },
			{
				name: 'addrtype',
				description:
					'The address type. This allows SDP to be used for sessions that are not IP based.',
				values: ADDRTYPE
			},
			{
				name: 'connection-address',
				description:
					'The connection address — a unicast address, a multicast group, or the wildcard 0.0.0.0 used by WebRTC when ICE will supply the real addresses.'
			},
			{
				name: 'ttl',
				description:
					'For IPv4 multicast only, and then **REQUIRED**: the time to live of the multicast packets, 0–255. It bounds how far the stream propagates.'
			},
			{
				name: 'number of addresses',
				description:
					'A count of consecutive multicast addresses starting at <connection-address>, used to carry layered encodings on separate groups.'
			}
		],
		details: `A session description **MUST** contain either at least one "c=" line in each media description or a single "c=" line at the session level. It **MAY** contain both, in which case the media-level values override the session-level settings for that media description.

In WebRTC the "c=" line is vestigial: the address is always the wildcard \`IN IP4 0.0.0.0\` because the real transport addresses arrive as "a=candidate" attributes and are chosen by ICE, not by SDP.`
	},
	b: {
		title: 'Bandwidth Information',
		syntax: '<bwtype>:<bandwidth>',
		level: 'both',
		specs: [rfc8866('5.8')],
		description:
			'The **OPTIONAL** "b=" line (bandwidth-field) denotes the proposed bandwidth to be used by the session or media description.',
		args: [
			{
				name: 'bwtype',
				description: 'An alphanumeric modifier giving the meaning of the <bandwidth> number.',
				values: [
					{
						value: 'AS',
						description:
							'Application Specific. The largest bandwidth a single media stream should use, as the application understands it. This is the one WebRTC uses.'
					},
					{
						value: 'CT',
						description:
							'Conference Total. A limit on the combined bandwidth of all sites in a multi-site conference.'
					},
					{
						value: 'TIAS',
						description:
							'Transport Independent Application Specific ([RFC 3890](https://datatracker.ietf.org/doc/html/rfc3890)), which excludes transport overhead and so is unambiguous across IPv4 and IPv6.'
					},
					{
						value: 'RS',
						description:
							'RTCP bandwidth reserved for active data senders ([RFC 3556](https://datatracker.ietf.org/doc/html/rfc3556)), in bits per second.'
					},
					{
						value: 'RR',
						description:
							'RTCP bandwidth reserved for other participants ([RFC 3556](https://datatracker.ietf.org/doc/html/rfc3556)), in bits per second.'
					}
				]
			},
			{
				name: 'bandwidth',
				description:
					'The value, in kilobits per second for "AS" and "CT" and in bits per second for "TIAS", "RS" and "RR". Experimental types are prefixed "X-".'
			}
		]
	},
	t: {
		title: 'Time Active',
		syntax: '<start-time> <stop-time>',
		level: 'session',
		specs: [rfc8866('5.9')],
		description:
			'A "t=" line (time-field) begins a time description that specifies the start and stop times for a session.',
		args: [
			{
				name: 'start-time',
				description:
					'The start time, as a decimal NTP timestamp — seconds since January 1, 1900 UTC. Zero means the session is not bounded at the start.'
			},
			{
				name: 'stop-time',
				description:
					'The stop time. If it is zero the session is unbounded; if both times are zero the session is permanent. A non-zero stop time **MUST** be later than the start time.'
			}
		],
		details: `Multiple time descriptions **MAY** be used if a session is active at multiple irregularly spaced times; each additional time description specifies additional periods for which the session will be active.

WebRTC sessions are always \`t=0 0\` — permanent — because their lifetime is governed by the peer connection, not by a schedule.`
	},
	r: {
		title: 'Repeat Times',
		syntax: '<repeat interval> <active duration> <offsets from start-time>...',
		level: 'session',
		specs: [rfc8866('5.10')],
		description:
			'An "r=" line (repeat-field) specifies repeat times for a session. To express complex schedules, multiple repeat-fields may follow one "t=" line.',
		args: [
			{
				name: 'repeat interval',
				description:
					'How often the session repeats, as seconds or with a unit suffix: `d` days, `h` hours, `m` minutes, `s` seconds. `7d` is a weekly session.'
			},
			{ name: 'active duration', description: 'How long the session lasts on each repeat.' },
			{
				name: 'offsets from start-time',
				description:
					'One or more offsets from <start-time> at which the session begins within each interval. `0 25h` places the session at the start of the period and again 25 hours later.'
			}
		]
	},
	z: {
		title: 'Time Zone Adjustment',
		syntax: '<adjustment time> <offset> [<adjustment time> <offset>]...',
		level: 'session',
		specs: [rfc8866('5.11')],
		description:
			'A "z=" line (zone-field) is an optional modifier to the repeat-fields it immediately follows. It does not apply to any other fields.',
		args: [
			{
				name: 'adjustment time',
				description: 'The NTP time at which a daylight-saving or similar clock shift takes effect.'
			},
			{
				name: 'offset',
				description:
					'The offset applied from that moment on, relative to the time the session was first scheduled — typically `-1h` or `0`.'
			}
		],
		details: `Repeat times are stated in wall-clock terms, so a weekly session would drift by an hour when a region changes to summer time. The "z=" line lets a schedule stay anchored to the local clock without republishing it.`
	},
	k: {
		title: 'Encryption Key',
		syntax: '<method>[:<encryption key>]',
		level: 'both',
		specs: [rfc8866('5.12')],
		description:
			'The "k=" line (key-field) conveyed an encryption key in the session description. It is **OBSOLETE**: RFC 8866 removed it, and it **MUST NOT** be used. Parsers still accept it because older descriptions carry it.',
		args: [
			{
				name: 'method',
				description: 'How the key is obtained.',
				values: [
					{
						value: 'clear',
						description:
							'The key follows in the clear — untrustworthy over any transport that is not itself secure.'
					},
					{
						value: 'base64',
						description: 'The key follows, base64 encoded. Encoding, not protection.'
					},
					{
						value: 'uri',
						description:
							'A URI from which the key can be fetched, with the fetch authenticated separately.'
					},
					{ value: 'prompt', description: 'No key is carried; the user is asked for one.' }
				]
			},
			{
				name: 'encryption key',
				greedy: true,
				description: 'The key material or URI, per <method>.'
			}
		],
		details: `Modern media security negotiates keys out of band of the description itself — DTLS-SRTP ("a=fingerprint" plus "a=setup") for WebRTC, or SDP Security Descriptions ("a=crypto", [RFC 4568](https://datatracker.ietf.org/doc/html/rfc4568)) for SIP deployments.`
	},
	a: {
		title: 'Attribute',
		syntax: '<attribute-name>[:<attribute-value>]',
		level: 'both',
		specs: [
			rfc8866('5.13'),
			{
				label: 'IANA SDP registry',
				href: 'https://www.iana.org/assignments/sdp-parameters/sdp-parameters.xhtml'
			}
		],
		description:
			'Attributes are the primary means for extending SDP. An attribute with no value is a *property attribute* — a flag, such as "a=rtcp-mux". An attribute with a value is a *value attribute*, such as "a=mid:0".',
		args: [
			{
				name: 'attribute-name',
				description:
					"The registered name of the attribute. This one is not in the explainer's catalogue; the IANA registry is the full list."
			},
			{
				name: 'attribute-value',
				greedy: true,
				description:
					"The value, whose shape is defined entirely by the attribute's own specification."
			}
		],
		details: `An attribute before the first "m=" line is session-level and applies to the whole description; an attribute inside a media description is media-level and applies to that media only, overriding the session-level value where both exist.

Receivers **MUST** ignore attributes they do not understand. That single rule is what has let SDP absorb ICE, DTLS-SRTP, BUNDLE and simulcast without ever changing "v=0".`
	},
	m: {
		title: 'Media Description',
		syntax: '<media> <port>[/<number of ports>] <proto> <fmt>...',
		level: 'media',
		specs: [rfc8866('5.14')],
		description:
			'A session description may contain a number of media descriptions. Each starts with an "m=" line (media-field) and is terminated by either the next "m=" line or the end of the session description.',
		args: [
			{
				name: 'media',
				description: 'The media type.',
				values: [
					{ value: 'audio', description: 'An audio stream.' },
					{ value: 'video', description: 'A video stream.' },
					{
						value: 'text',
						description:
							'Real-time text, as used for accessibility ([RFC 4103](https://datatracker.ietf.org/doc/html/rfc4103)).'
					},
					{
						value: 'application',
						description: 'Application data. In WebRTC this is the SCTP data channel section.'
					},
					{ value: 'message', description: 'A message-oriented stream, such as MSRP.' }
				]
			},
			{
				name: 'port',
				description:
					'The transport port the media stream is sent to. Its meaning depends on the network in the relevant "c=" line and on <proto>. A port of **0** rejects or disables the media description — that is how an answerer declines a stream, and how a peer removes one on renegotiation.'
			},
			{
				name: 'number of ports',
				description:
					'A count of consecutive ports, used by hierarchically encoded streams. Rarely seen, and not used in WebRTC.'
			},
			{
				name: 'proto',
				description: 'The transport protocol stack, written as "/"-separated layers.',
				values: [
					{
						value: 'UDP/TLS/RTP/SAVPF',
						description:
							'SRTP keyed by DTLS with RTCP feedback — the WebRTC media profile ([RFC 5764](https://datatracker.ietf.org/doc/html/rfc5764)).'
					},
					{
						value: 'TCP/DTLS/RTP/SAVPF',
						description: 'The same profile tunnelled over TCP, for ICE-TCP candidates.'
					},
					{
						value: 'UDP/DTLS/SCTP',
						description:
							'SCTP over DTLS — the WebRTC data channel transport ([RFC 8841](https://datatracker.ietf.org/doc/html/rfc8841)).'
					},
					{
						value: 'RTP/AVP',
						description:
							'Plain RTP under the audio/video profile ([RFC 3551](https://datatracker.ietf.org/doc/html/rfc3551)). No encryption.'
					},
					{
						value: 'RTP/AVPF',
						description:
							'RTP with the extended feedback profile ([RFC 4585](https://datatracker.ietf.org/doc/html/rfc4585)), enabling NACK and PLI.'
					},
					{
						value: 'RTP/SAVP',
						description:
							'SRTP ([RFC 3711](https://datatracker.ietf.org/doc/html/rfc3711)), typically keyed by "a=crypto".'
					},
					{
						value: 'RTP/SAVPF',
						description: 'SRTP with the feedback profile, keyed by "a=crypto" rather than DTLS.'
					}
				]
			},
			{
				name: 'fmt',
				description:
					'A media format. For RTP profiles each is an RTP payload type number, listed in the offerer\'s order of preference and described by an "a=rtpmap" line. For "UDP/DTLS/SCTP" the single format is the literal `webrtc-datachannel`.'
			}
		],
		details: `Read \`m=audio 9 UDP/TLS/RTP/SAVPF 111 63\` as: an audio stream, on a placeholder port, carried as SRTP over DTLS over UDP with RTCP feedback, offering payload types 111 and 63 in that order of preference.

The port is 9 — the discard port — whenever ICE is in use. It is a deliberately useless value: the real candidate addresses appear as "a=candidate" attributes, and a peer that ignored them would send to a black hole rather than somewhere harmful. A bundled media description that is not the BUNDLE tag may instead carry the port of the tag it shares a transport with.`
	}
};
