// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';

const direction = (name: string, summary: string, detail: string): Details => ({
	title: `Direction — ${name}`,
	syntax: name,
	level: 'both',
	specs: [
		{
			label: 'RFC 8866 §6.7',
			href: 'https://www.rfc-editor.org/rfc/rfc8866.html#section-6.7'
		}
	],
	description: summary,
	args: [],
	details: `${detail}

Exactly one direction attribute applies to a media description. When none is written, "sendrecv" is implied. A media-level attribute overrides the session-level one.

Directions are stated from the point of view of whoever wrote the description, so they invert across an offer/answer exchange: an offer of "sendonly" is answered with "recvonly". This is also how hold works — an endpoint puts a call on hold by moving from "sendrecv" to "sendonly", and resumes by moving back.`
});

/**
 * Identity and grouping: which transport a media description shares, which
 * MediaStreamTrack it corresponds to, which SSRCs carry it, and — for simulcast
 * — which of several encodings of the same source it is.
 */
export const streams: Record<string, Details> = {
	mid: {
		title: 'Media Identification Tag',
		syntax: 'mid:<identification-tag>',
		level: 'media',
		specs: [
			{ label: 'RFC 5888 §4', href: 'https://datatracker.ietf.org/doc/html/rfc5888#section-4' }
		],
		description:
			'A short identifier for this media description, referenced by "a=group" lines and carried in RTP by the `sdes:mid` header extension.',
		args: [
			{
				name: 'identification-tag',
				description:
					'Unique within the session description. Usually "0", "1", "2" — or in the WebRTC API, whatever `RTCRtpTransceiver.mid` reports.'
			}
		],
		details: `The mid is the stable name of a media description across renegotiations. Media descriptions may never be deleted or reordered — a removed stream leaves behind an "m=" line with port 0 — so position cannot identify anything, and the mid is what an answer, a "a=group:BUNDLE" line, or an SFU's routing table actually keys on.`
	},
	group: {
		title: 'Media Grouping',
		syntax: 'group:<semantics> [<identification-tag>]...',
		level: 'session',
		specs: [{ label: 'RFC 5888', href: 'https://datatracker.ietf.org/doc/html/rfc5888' }],
		description:
			'Ties several media descriptions together by their "a=mid" tags and states what the grouping means.',
		args: [
			{
				name: 'semantics',
				description: 'What the group signifies.',
				values: [
					{
						value: 'BUNDLE',
						description:
							'All listed media descriptions share one transport — one set of ICE candidates, one DTLS handshake, one port ([RFC 9143](https://datatracker.ietf.org/doc/html/rfc9143)). The first tag listed is the *BUNDLE tag*, and its transport is the one everything else moves onto.'
					},
					{
						value: 'LS',
						description:
							'Lip synchronisation: the listed media are to be played out in sync with one another.'
					},
					{
						value: 'FID',
						description:
							'Flow identification ([RFC 3388](https://datatracker.ietf.org/doc/html/rfc3388)): the listed media carry the same content over different flows.'
					},
					{
						value: 'FEC',
						description:
							'The group consists of a stream and the forward error correction that protects it.'
					},
					{
						value: 'FEC-FR',
						description:
							'The FEC framework grouping of [RFC 5956](https://datatracker.ietf.org/doc/html/rfc5956), which distinguishes source and repair flows.'
					},
					{
						value: 'DDP',
						description:
							'Decoding dependency ([RFC 5583](https://datatracker.ietf.org/doc/html/rfc5583)): the listed layers depend on one another.'
					}
				]
			},
			{
				name: 'identification-tag',
				description: 'The "a=mid" of a media description in the group, in order.'
			}
		],
		details: `\`a=group:BUNDLE 0 1 2\` is the line that makes a modern WebRTC session cheap. Without it, audio, video and the data channel each gather their own candidates and run their own DTLS handshake — three times the setup, three NAT bindings to keep alive. With it there is one transport, and the individual streams are separated by SSRC and by the mid header extension instead of by port.`
	},
	'bundle-only': {
		title: 'Bundle Only',
		syntax: 'bundle-only',
		level: 'media',
		specs: [
			{ label: 'RFC 9143 §6', href: 'https://datatracker.ietf.org/doc/html/rfc9143#section-6' }
		],
		description:
			'Marks a media description that is offered *only* as part of the BUNDLE group. It appears with a port of 0 and no candidates of its own.',
		args: [],
		details: `An offerer that has to work with peers who do not support BUNDLE would otherwise need a full transport for every media description, gathered up front and thrown away if bundling is accepted. Marking the non-tag descriptions bundle-only avoids that: they cost nothing, and an answerer that cannot bundle simply rejects them.`
	},
	msid: {
		title: 'Media Stream Identification',
		syntax: 'msid:<stream id> [<track id>]',
		level: 'media',
		specs: [{ label: 'RFC 8830', href: 'https://datatracker.ietf.org/doc/html/rfc8830' }],
		description:
			'Associates this media description with a `MediaStream` and a `MediaStreamTrack` in the WebRTC API, which is how a receiver knows that an audio and a video stream belong to the same camera and microphone.',
		args: [
			{
				name: 'stream id',
				description:
					'The `MediaStream.id` — up to 64 characters. Every media description carrying the same value surfaces on the receiver as one stream. The literal `-` means the track belongs to no stream.'
			},
			{
				name: 'track id',
				description:
					'The `MediaStreamTrack.id`. Optional; when absent the receiver invents one. Not to be confused with the mid, which names the *transceiver* rather than the track.'
			}
		],
		details: `An endpoint may repeat "a=msid" to place one track in several streams. This attribute replaced the older per-SSRC \`a=ssrc:... msid:\` form, which could not describe a track whose SSRC was not yet known — the case for every simulcast and every re-keyed stream.`
	},
	'msid-semantic': {
		title: 'Media Stream Semantics',
		syntax: 'msid-semantic:<semantic> [<identifier>]...',
		level: 'session',
		specs: [
			{ label: 'RFC 8830 §3', href: 'https://datatracker.ietf.org/doc/html/rfc8830#section-3' }
		],
		description:
			'Declares what the "a=msid" identifiers in this description mean. Written by convention with a space after the colon.',
		args: [
			{
				name: 'semantic',
				description: 'The semantic token.',
				values: [
					{
						value: 'WMS',
						description: 'WebRTC Media Stream — the identifiers name `MediaStream` objects.'
					}
				]
			},
			{ name: 'identifier', description: 'The stream identifiers covered, or `*` for all of them.' }
		]
	},
	ssrc: {
		title: 'Source Attribute',
		syntax: 'ssrc:<ssrc-id> <attribute>[:<value>]',
		level: 'media',
		specs: [
			{ label: 'RFC 5576 §4.1', href: 'https://datatracker.ietf.org/doc/html/rfc5576#section-4.1' }
		],
		description:
			'Attaches an attribute to one synchronisation source — one RTP stream, identified by the 32-bit SSRC in its packet headers.',
		args: [
			{
				name: 'ssrc-id',
				description:
					'The SSRC as an unsigned 32-bit integer, matching the field in the RTP header. Endpoints choose it at random and must be prepared to change it on a collision.'
			},
			{
				name: 'attribute',
				description: 'The source-level attribute name.',
				values: [
					{
						value: 'cname',
						description:
							'The canonical name ([RFC 3550](https://datatracker.ietf.org/doc/html/rfc3550)) — a persistent identifier for the endpoint. Streams sharing a cname come from one clock and can be synchronised, and a stream that changes SSRC after a collision is still recognisable by it.'
					},
					{
						value: 'msid',
						description:
							'The per-source form of "a=msid", giving stream and track ids for this SSRC.'
					},
					{
						value: 'mslabel',
						description:
							'The pre-standard form of the stream id. Deprecated, still emitted for compatibility.'
					},
					{
						value: 'label',
						description:
							'The pre-standard form of the track id. Deprecated, still emitted for compatibility.'
					},
					{
						value: 'previous-ssrc',
						description:
							'The SSRC this stream used before an SSRC change, so a receiver can carry its state over.'
					},
					{
						value: 'fmtp',
						description:
							'Format parameters that apply to this source only, rather than to the payload type as a whole.'
					}
				]
			},
			{ name: 'value', greedy: true, description: "The attribute's value, if it takes one." }
		],
		details: `Pion's \`WithMediaSource\` emits the classic quartet — cname, msid, mslabel and label — for each SSRC. Two of those are deprecated and kept only because older endpoints still read them.

Signalling SSRCs ahead of time is itself on the way out. It cannot describe simulcast, where the number of streams is decided by the sender at runtime, so newer descriptions identify streams by "a=rid" and the mid/rid header extensions instead.`
	},
	'ssrc-group': {
		title: 'Source Grouping',
		syntax: 'ssrc-group:<semantics> <ssrc-id>...',
		level: 'media',
		specs: [
			{ label: 'RFC 5576 §4.2', href: 'https://datatracker.ietf.org/doc/html/rfc5576#section-4.2' }
		],
		description: 'Relates several SSRCs within one media description.',
		args: [
			{
				name: 'semantics',
				description: 'The relationship between the listed sources.',
				values: [
					{
						value: 'FID',
						description:
							'Flow identification: the same content on several flows. For retransmission the first SSRC is the original stream and the second is its `rtx` repair stream.'
					},
					{
						value: 'FEC',
						description: 'The second SSRC carries forward error correction for the first.'
					},
					{
						value: 'FEC-FR',
						description:
							'The FEC framework form of the same relationship ([RFC 5956](https://datatracker.ietf.org/doc/html/rfc5956)).'
					},
					{
						value: 'SIM',
						description:
							'Simulcast: the listed SSRCs are alternative encodings of one source, low to high. A pre-standard Google convention, superseded by "a=simulcast".'
					},
					{ value: 'LS', description: 'Lip synchronisation between the listed sources.' }
				]
			},
			{
				name: 'ssrc-id',
				description: 'A source in the group. Order is significant for FID and SIM.'
			}
		]
	},
	rid: {
		title: 'Restriction Identifier',
		syntax: 'rid:<rid-id> <direction> [<restrictions>]',
		level: 'media',
		specs: [{ label: 'RFC 8851', href: 'https://datatracker.ietf.org/doc/html/rfc8851' }],
		description:
			'Names one RTP stream within a media description and constrains it, in a codec-agnostic way, beyond what the payload type already says.',
		args: [
			{
				name: 'rid-id',
				description:
					'A short alphanumeric identifier — `q`, `h`, `f` for quarter, half and full resolution is the common convention. It travels in every packet via the `sdes:rtp-stream-id` header extension, which is what lets a relay tell the layers apart without decoding.'
			},
			{
				name: 'direction',
				description: 'Which direction the restriction applies to.',
				values: [
					{
						value: 'send',
						description: 'Constrains what this endpoint will send under this identifier.'
					},
					{
						value: 'recv',
						description: 'Constrains what this endpoint is willing to receive under it.'
					}
				]
			},
			{
				name: 'restrictions',
				greedy: true,
				description:
					'Semicolon-separated limits: `pt=` narrows the payload types this stream may use, `max-width` and `max-height` bound the resolution, `max-fps` the frame rate, `max-br` the bitrate, `max-fs` the frame size in macroblocks. `depend=` names other rids this one is layered on.'
			}
		],
		details: `Payload types can only express what a *codec* supports. A sender offering three resolutions of VP8 would need three payload types for what is really one codec configured three ways — and payload-type space is scarce. The rid moves those constraints out of the codec's own parameter space and gives each stream a name that packets can carry.`
	},
	simulcast: {
		title: 'Simulcast',
		syntax: 'simulcast:<direction> <alternatives> [<direction> <alternatives>]',
		level: 'media',
		specs: [{ label: 'RFC 8853', href: 'https://datatracker.ietf.org/doc/html/rfc8853' }],
		description:
			'Offers several independently encoded versions of the same source in one media description, so a relay can forward whichever layer each receiver can afford.',
		args: [
			{
				name: 'direction',
				description: 'Whose streams are being described.',
				values: [
					{ value: 'send', description: 'The simulcast streams this endpoint will send.' },
					{
						value: 'recv',
						description: 'The simulcast streams this endpoint is prepared to receive.'
					}
				]
			},
			{
				name: 'alternatives',
				description:
					'Semicolon-separated rid identifiers in preference order — `q;h;f` — where a comma joins alternatives that may substitute for one another and a leading `~` marks a stream as offered but initially paused.'
			}
		],
		details: `Simulcast is what lets one sender serve a heterogeneous conference. The sender encodes the same camera three times at different bitrates; the SFU forwards the largest layer each receiver's estimated bandwidth allows, and it does so by reading the rid header extension rather than by transcoding — which is the entire reason SFUs are cheap to run.

Every identifier named here **MUST** have a matching "a=rid" line in the same media description.`
	},
	sendrecv: direction(
		'sendrecv',
		'The endpoint will both send and receive this media. The default when no direction attribute is present.',
		'Both directions are active — the ordinary state of a two-way call.'
	),
	sendonly: direction(
		'sendonly',
		'The endpoint will send this media but will not receive it.',
		'Used for a one-way broadcast, or by the endpoint that has put the call on hold.'
	),
	recvonly: direction(
		'recvonly',
		'The endpoint will receive this media but will not send it.',
		'Used by a viewer in a broadcast, and by the endpoint answering a stream it has no source for.'
	),
	inactive: direction(
		'inactive',
		'No media flows in either direction, though the transport stays up.',
		'The stream is negotiated and ICE and DTLS keep running, so it can be reactivated without a new handshake. This is how both ends of a mutually held call are described.'
	),
	'sctp-port': {
		title: 'SCTP Port',
		syntax: 'sctp-port:<port>',
		level: 'media',
		specs: [
			{ label: 'RFC 8841 §5.1', href: 'https://datatracker.ietf.org/doc/html/rfc8841#section-5.1' }
		],
		description:
			'The SCTP port for a data channel media description, carried inside the DTLS association rather than on the wire.',
		args: [
			{
				name: 'port',
				description:
					'Always 5000 in WebRTC. Since SCTP runs over DTLS over the ICE transport, this is an association-internal number — no UDP port is involved, and nothing on the network path ever sees it.'
			}
		]
	},
	'max-message-size': {
		title: 'Maximum Message Size',
		syntax: 'max-message-size:<size>',
		level: 'media',
		specs: [
			{ label: 'RFC 8841 §6', href: 'https://datatracker.ietf.org/doc/html/rfc8841#section-6' }
		],
		description:
			'The largest SCTP user message, in bytes, this endpoint can receive on a data channel. Defaults to 65536 when absent; 0 means no limit.',
		args: [
			{
				name: 'size',
				description:
					'Sending a larger message than the peer advertised is a protocol error, so an application transferring files has to fragment against this value itself.'
			}
		]
	},
	sctpmap: {
		title: 'SCTP Mapping',
		syntax: 'sctpmap:<port> <app> <max-streams>',
		level: 'media',
		specs: [
			{ label: 'RFC 8841 §5', href: 'https://datatracker.ietf.org/doc/html/rfc8841#section-5' }
		],
		description:
			'The pre-standard form of the data channel description, where `webrtc-datachannel` appeared as the "m=" line format and this attribute qualified it. Superseded by "a=sctp-port"; still emitted by older endpoints.',
		args: [
			{ name: 'port', description: 'The SCTP port.' },
			{ name: 'app', description: 'The application, always `webrtc-datachannel`.' },
			{
				name: 'max-streams',
				description: 'The maximum number of SCTP streams the endpoint supports.'
			}
		]
	}
};
