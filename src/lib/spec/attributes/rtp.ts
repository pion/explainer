// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';

const rfc8866 = (section: string) => ({
	label: `RFC 8866 §${section}`,
	href: `https://www.rfc-editor.org/rfc/rfc8866.html#section-${section}`
});

/**
 * What actually goes in the packets: the payload-type table, the codec
 * parameters that qualify it, the RTCP feedback that steers it, and the header
 * extensions that ride alongside it.
 */
export const rtp: Record<string, Details> = {
	rtpmap: {
		title: 'RTP Payload Mapping',
		syntax: 'rtpmap:<payload type> <encoding name>/<clock rate>[/<encoding parameters>]',
		level: 'media',
		specs: [rfc8866('6.6')],
		description:
			'Binds one of the payload type numbers listed in the "m=" line to an actual codec. RTP carries only a 7-bit payload type in each packet; this line is what tells the receiver that 111 means Opus.',
		args: [
			{
				name: 'payload type',
				description:
					'The number, 0–127, that appears in the RTP header. 96–127 are the dynamic range and are negotiated per session; below 96 sit the static assignments of [RFC 3551](https://datatracker.ietf.org/doc/html/rfc3551) (0 = PCMU, 8 = PCMA, 9 = G722), which need no "a=rtpmap" at all — Pion seeds those three into its codec map unconditionally.'
			},
			{
				name: 'encoding name',
				description: 'The codec, from the IANA media types registry.',
				values: [
					{
						value: 'opus',
						description:
							'The mandatory-to-implement WebRTC audio codec. Always 48000/2, even for mono sources.'
					},
					{ value: 'VP8', description: 'A mandatory-to-implement WebRTC video codec.' },
					{
						value: 'VP9',
						description:
							'Better compression than VP8, with native spatial and temporal scalability.'
					},
					{
						value: 'H264',
						description:
							'The other mandatory-to-implement video codec. Its profile is pinned by "a=fmtp".'
					},
					{
						value: 'AV1',
						description:
							'Royalty-free, higher efficiency than VP9, with dependency-descriptor based scalability.'
					},
					{
						value: 'H265',
						description: 'HEVC. Widely supported in hardware, less so in browsers.'
					},
					{
						value: 'G722',
						description:
							'Wideband ITU audio. Its clock rate is famously written as 8000 despite sampling at 16 kHz.'
					},
					{ value: 'PCMU', description: 'G.711 µ-law, payload type 0. The universal fallback.' },
					{ value: 'PCMA', description: 'G.711 A-law, payload type 8.' },
					{
						value: 'telephone-event',
						description:
							'DTMF and other tones carried as RTP events ([RFC 4733](https://datatracker.ietf.org/doc/html/rfc4733)) rather than as audio.'
					},
					{
						value: 'red',
						description:
							'Redundant coding ([RFC 2198](https://datatracker.ietf.org/doc/html/rfc2198)): earlier payloads are repeated in later packets so a single loss is recoverable.'
					},
					{
						value: 'ulpfec',
						description:
							'Uneven level protection forward error correction ([RFC 5109](https://datatracker.ietf.org/doc/html/rfc5109)).'
					},
					{
						value: 'flexfec-03',
						description: 'Flexible FEC, which can protect across both time and packet order.'
					},
					{
						value: 'rtx',
						description:
							'Retransmission ([RFC 4588](https://datatracker.ietf.org/doc/html/rfc4588)). Its "a=fmtp" carries `apt=` naming the payload type it repairs.'
					},
					{
						value: 'CN',
						description:
							'Comfort noise ([RFC 3389](https://datatracker.ietf.org/doc/html/rfc3389)), sent in place of silence.'
					}
				]
			},
			{
				name: 'clock rate',
				description:
					'The RTP timestamp clock, in Hz — 48000 for Opus, 90000 for every video codec. It is not the sample rate: it is the unit the timestamp field counts in, and getting it wrong desynchronises playout rather than corrupting the media.'
			},
			{
				name: 'encoding parameters',
				description:
					'For audio, the channel count, defaulting to 1 when absent. Opus always advertises 2 and signals real mono through the `stereo=0` fmtp parameter instead. Video codecs define no encoding parameters.'
			}
		],
		details: `Each payload type is described by up to three lines that have to be read together — "a=rtpmap" names the codec, "a=fmtp" configures it, "a=rtcp-fb" says what feedback it accepts. Pion's \`GetCodecMap\` merges exactly those three into one \`Codec\` per payload type.

Note that the same codec may appear several times under different payload types with different fmtp parameters, which is how an endpoint offers, say, two H.264 profiles at once.`
	},
	fmtp: {
		title: 'Format Parameters',
		syntax: 'fmtp:<format> <format specific parameters>',
		level: 'media',
		specs: [rfc8866('6.15')],
		description:
			"Codec-specific configuration for one payload type. SDP passes these through without interpreting them — their meaning belongs entirely to the codec's own payload format specification.",
		args: [
			{
				name: 'format',
				description: 'The payload type this configuration applies to, matching an "a=rtpmap" line.'
			},
			{
				name: 'format specific parameters',
				greedy: true,
				description:
					'Usually `name=value` pairs joined by semicolons. Common ones: `minptime` and `useinbandfec` for Opus; `stereo=1` to enable stereo; `profile-level-id` and `packetization-mode` for H.264; `apt=<pt>` on an `rtx` payload naming what it retransmits; `max-fs` and `max-fr` bounding frame size and rate; `level-asymmetry-allowed=1` permitting each direction to run a different H.264 level.'
			}
		],
		details: `Offer/answer treats these parameters as a *declaration*, not a request: each peer states what it can receive, and the other side has to encode within those limits. \`profile-level-id\` is the usual source of interoperability failure, because two endpoints that both claim H.264 may have no profile in common.`
	},
	'rtcp-fb': {
		title: 'RTCP Feedback',
		syntax: 'rtcp-fb:<payload type> <feedback type> [<feedback parameter>]...',
		level: 'media',
		specs: [
			{ label: 'RFC 4585 §4.2', href: 'https://datatracker.ietf.org/doc/html/rfc4585#section-4.2' }
		],
		description:
			'Which RTCP feedback messages the endpoint will accept for a payload type. This is the negotiation that turns RTCP from a periodic reporting channel into the fast control loop that congestion control and error recovery depend on.',
		args: [
			{
				name: 'payload type',
				description:
					'The payload type the feedback applies to, or `*` for every format in the media description.'
			},
			{
				name: 'feedback type',
				description: 'The feedback message.',
				values: [
					{
						value: 'nack',
						description:
							'Negative acknowledgement: name the sequence numbers that were lost so the sender can retransmit them.'
					},
					{
						value: 'ccm',
						description:
							'Codec control messages ([RFC 5104](https://datatracker.ietf.org/doc/html/rfc5104)). `ccm fir` requests a full intra refresh; `ccm tmmbr` asks the sender to cap its bitrate.'
					},
					{ value: 'ack', description: 'Positive acknowledgement of received packets.' },
					{
						value: 'goog-remb',
						description:
							'Receiver Estimated Maximum Bitrate — the receiver reports the bandwidth it believes is available. Superseded by transport-cc.'
					},
					{
						value: 'transport-cc',
						description:
							'Per-packet arrival times reported back to the sender, which runs the congestion controller itself. The modern default.'
					},
					{
						value: 'trr-int',
						description: 'Bounds how often regular RTCP reports may be sent, in milliseconds.'
					}
				]
			},
			{
				name: 'feedback parameter',
				description:
					'Qualifies the type. `nack pli` is a picture loss indication asking for a keyframe; bare `nack` is packet-level retransmission; `ccm fir` forces an intra frame.'
			}
		],
		details: `\`a=rtcp-fb:96 nack\` and \`a=rtcp-fb:96 nack pli\` are different requests. The first asks for individual packets back — cheap, and only useful within a round trip or two. The second asks for a whole new keyframe, which repairs any amount of loss but costs a large burst of bits, so a receiver falls back on it only when retransmission cannot catch up.`
	},
	extmap: {
		title: 'RTP Header Extension',
		syntax: 'extmap:<value>[/<direction>] <URI> [<extension attributes>]',
		level: 'both',
		specs: [
			{ label: 'RFC 8285 §8', href: 'https://datatracker.ietf.org/doc/html/rfc8285#section-8' }
		],
		description:
			'Maps a small local ID onto the URI of an RTP header extension. The URI is long and descriptive; the ID is what fits in the packet.',
		args: [
			{
				name: 'value',
				description:
					"The extension ID that appears in the RTP header, 1–14 for the one-byte header form and up to 255 for the two-byte form. 15 is reserved as a padding marker. Each peer picks its own IDs, and the offerer's choice wins."
			},
			{
				name: 'direction',
				description:
					'Restricts which direction the extension is used in, relative to the media direction.',
				values: [
					{
						value: 'sendonly',
						description: 'This endpoint will send the extension but does not want to receive it.'
					},
					{
						value: 'recvonly',
						description: 'This endpoint wants to receive the extension but will not send it.'
					},
					{
						value: 'sendrecv',
						description: 'Both directions. The default when no direction is given.'
					},
					{ value: 'inactive', description: 'Negotiated but not currently used.' }
				]
			},
			{
				name: 'URI',
				description: 'The globally unique name of the extension.',
				values: [
					{
						value: 'urn:ietf:params:rtp-hdrext:sdes:mid',
						description:
							'Carries the "a=mid" of the media description in every packet, so a bundled stream can be demultiplexed without an SSRC table.'
					},
					{
						value: 'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id',
						description:
							'Carries the "a=rid" identifier, which is how simulcast layers are told apart.'
					},
					{
						value: 'urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id',
						description: 'Names the rid that an `rtx` stream repairs.'
					},
					{
						value: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level',
						description:
							"The sender's audio level ([RFC 6464](https://datatracker.ietf.org/doc/html/rfc6464)), which lets an SFU pick the active speaker without decoding."
					},
					{
						value: 'urn:ietf:params:rtp-hdrext:toffset',
						description:
							'Transmission time offset ([RFC 5450](https://datatracker.ietf.org/doc/html/rfc5450)), used to correct jitter measurements for sender-side pacing.'
					},
					{
						value: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
						description: 'Absolute send time, for delay-based bandwidth estimation.'
					},
					{
						value: 'http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01',
						description:
							'A transport-wide packet sequence number — the counterpart of `transport-cc` feedback.'
					},
					{
						value: 'urn:3gpp:video-orientation',
						description:
							"The camera rotation, so a receiver can display a phone's video the right way up."
					}
				]
			},
			{
				name: 'extension attributes',
				greedy: true,
				description: 'Extension-specific parameters, if the extension defines any.'
			}
		],
		details: `Header extensions are how per-packet metadata reaches a relay that cannot decrypt the payload. An SFU forwarding a bundled conference reads the mid and rid extensions to route packets and the audio-level extension to choose a speaker, all without touching the media — which is exactly the visibility "a=cryptex" then takes back for the cases where it is too much.`
	},
	'extmap-allow-mixed': {
		title: 'Allow Mixed Extension Formats',
		syntax: 'extmap-allow-mixed',
		level: 'both',
		specs: [
			{ label: 'RFC 8285 §6', href: 'https://datatracker.ietf.org/doc/html/rfc8285#section-6' }
		],
		description:
			'A property attribute stating that this endpoint can receive one-byte and two-byte header extensions mixed within the same RTP stream.',
		args: [],
		details: `The one-byte form is compact but caps the extension ID at 14 and the value at 16 bytes. Without this attribute, a session that needs a single long extension has to move *every* extension to the two-byte form. With it, the sender pays for the larger header only on the packets that need it.`
	},
	ptime: {
		title: 'Packet Time',
		syntax: 'ptime:<packet time>',
		level: 'media',
		specs: [rfc8866('6.4')],
		description:
			'The duration of media in each packet, in milliseconds. A recommendation to the sender, not a constraint that can be enforced.',
		args: [
			{
				name: 'packet time',
				description:
					'Typically 20 ms for speech. Larger values amortise the 40-odd bytes of IP, UDP and RTP header across more audio and so cut overhead sharply; smaller values cut latency and make each loss cost less. It applies to the media description as a whole, not to any one payload type.'
			}
		]
	},
	maxptime: {
		title: 'Maximum Packet Time',
		syntax: 'maxptime:<maximum packet time>',
		level: 'media',
		specs: [rfc8866('6.5')],
		description:
			'The largest amount of media, in milliseconds, this endpoint is willing to receive in one packet.',
		args: [
			{
				name: 'maximum packet time',
				description:
					'Bounded in practice by the receiver\'s de-packetiser buffer. Unlike "a=ptime" this is a real limit — a sender that exceeds it risks having its packets dropped.'
			}
		]
	},
	rtcp: {
		title: 'RTCP Port',
		syntax: 'rtcp:<port> [<nettype> <addrtype> <connection-address>]',
		level: 'media',
		specs: [{ label: 'RFC 3605', href: 'https://datatracker.ietf.org/doc/html/rfc3605' }],
		description: 'An explicit address and port for RTCP, overriding the default of "RTP port + 1".',
		args: [
			{ name: 'port', description: 'The RTCP port.' },
			{
				name: 'nettype',
				description: 'The network type, when RTCP goes somewhere other than the "c=" line address.'
			},
			{ name: 'addrtype', description: 'The address type.' },
			{ name: 'connection-address', description: 'The RTCP address.' }
		],
		details: `The "port + 1" convention breaks the moment a NAT allocates ports independently, which is most of the time. This attribute predates "a=rtcp-mux" and solves the same problem less thoroughly: it still needs a second port, and so a second set of ICE candidates.`
	},
	'rtcp-mux': {
		title: 'RTCP Multiplexing',
		syntax: 'rtcp-mux',
		level: 'media',
		specs: [{ label: 'RFC 8858', href: 'https://datatracker.ietf.org/doc/html/rfc8858' }],
		description:
			'A property attribute offering to carry RTP and RTCP on a single port. Both peers must offer it for it to apply.',
		args: [],
		details: `Halving the ports halves the ICE work: one component instead of two, one set of candidates, one set of connectivity checks, one NAT binding to keep alive. Every WebRTC endpoint uses it, which is why real candidate lines almost always show \`component-id\` 1 and nothing else.

Demultiplexing is by RTP payload type: values 64–95 are reserved so that they cannot collide with the RTCP packet types that occupy the same byte position.`
	},
	'rtcp-mux-only': {
		title: 'RTCP Multiplexing Only',
		syntax: 'rtcp-mux-only',
		level: 'media',
		specs: [
			{ label: 'RFC 8858 §4', href: 'https://datatracker.ietf.org/doc/html/rfc8858#section-4' }
		],
		description:
			'States that this endpoint will *only* multiplex — it has not allocated an RTCP port and will not fall back.',
		args: [],
		details: `Plain "a=rtcp-mux" has to be offered speculatively: the offerer still gathers a second set of candidates in case the answer refuses. Declaring mux-only lets it skip that gathering entirely, at the cost of failing outright against an endpoint that cannot multiplex.`
	},
	'rtcp-rsize': {
		title: 'Reduced-Size RTCP',
		syntax: 'rtcp-rsize',
		level: 'media',
		specs: [{ label: 'RFC 5506', href: 'https://datatracker.ietf.org/doc/html/rfc5506' }],
		description:
			'A property attribute permitting RTCP packets that omit the mandatory sender or receiver report normally required at the head of every compound packet.',
		args: [],
		details: `A bare NACK or PLI is a few dozen bytes; the sender report it would otherwise have to be wrapped in is larger than the message itself. Since feedback is sent often and urgently, dropping the compound requirement makes the control loop meaningfully cheaper. It is only safe alongside "a=rtcp-mux", because middleboxes that inspect RTCP rely on the compound form.`
	},
	imageattr: {
		title: 'Image Attributes',
		syntax: 'imageattr:<payload type> <attributes>',
		level: 'media',
		specs: [{ label: 'RFC 6236', href: 'https://datatracker.ietf.org/doc/html/rfc6236' }],
		description:
			"Negotiates the video resolutions an endpoint can send and receive for a payload type, independently of the codec's own parameters.",
		args: [
			{ name: 'payload type', description: 'The payload type, or `*` for all of them.' },
			{
				name: 'attributes',
				greedy: true,
				description:
					'A `send` and/or `recv` clause, each listing resolution sets such as `[x=1280,y=720]` or ranges `[x=[480:16:1280],y=[320:16:720],par=[1.2-1.3]]`. `*` means no restriction.'
			}
		]
	},
	framerate: {
		title: 'Frame Rate',
		syntax: 'framerate:<frame rate>',
		level: 'media',
		specs: [rfc8866('6.9')],
		description: 'The maximum video frame rate, in frames per second, as a decimal number.',
		args: [
			{
				name: 'frame rate',
				description: 'A recommendation to the sender, not an enforceable limit.'
			}
		]
	},
	quality: {
		title: 'Quality',
		syntax: 'quality:<quality>',
		level: 'media',
		specs: [rfc8866('6.10')],
		description:
			'A suggestion of how much the sender may degrade quality to fit the bandwidth, 0–10.',
		args: [
			{
				name: 'quality',
				description:
					'10 is the best the codec can do, 5 the default, 0 the worst still worth transmitting. Its interpretation is entirely up to the sender, and it is essentially unused in practice.'
			}
		]
	},
	orient: {
		title: 'Orientation',
		syntax: 'orient:<orientation>',
		level: 'media',
		specs: [rfc8866('6.8')],
		description: 'For whiteboard media, how the workspace should be oriented on screen.',
		args: [
			{
				name: 'orientation',
				description: 'The orientation.',
				values: [
					{ value: 'portrait', description: 'Taller than wide.' },
					{ value: 'landscape', description: 'Wider than tall.' },
					{ value: 'seascape', description: 'Landscape, rotated the other way.' }
				]
			}
		]
	}
};
