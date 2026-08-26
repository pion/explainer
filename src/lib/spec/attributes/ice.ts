// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';

const rfc8839 = (section: string) => ({
	label: `RFC 8839 §${section}`,
	href: `https://www.rfc-editor.org/rfc/rfc8839.html#section-${section}`
});

/**
 * ICE ([RFC 8445](https://datatracker.ietf.org/doc/html/rfc8445)) and its SDP
 * encoding ([RFC 8839](https://datatracker.ietf.org/doc/html/rfc8839)): the
 * attributes that carry transport addresses and the credentials that
 * connectivity checks are authenticated with.
 */
export const ice: Record<string, Details> = {
	candidate: {
		title: 'ICE Candidate',
		syntax:
			'candidate:<foundation> <component-id> <transport> <priority> <connection-address> <port> typ <cand-type> [raddr <rel-addr>] [rport <rel-port>] [<extension> <extension value>]...',
		level: 'media',
		specs: [
			rfc8839('5.1'),
			{ label: 'RFC 8445 — ICE', href: 'https://datatracker.ietf.org/doc/html/rfc8445' }
		],
		description:
			'One transport address this endpoint might be reachable at. Each peer gathers a set of candidates, sends them in — or after — its session description, and ICE pairs them up and probes every pair with STUN until it finds one that works.',
		args: [
			{
				name: 'foundation',
				description:
					'An opaque token that is identical for candidates of the same type, from the same base address, over the same protocol, and obtained from the same STUN or TURN server. Candidate pairs whose foundations match are redundant, so ICE only needs to freeze and probe one of them — this is what makes frozen-candidate pacing work.'
			},
			{
				name: 'component-id',
				description: 'Which component of the media stream this candidate is for.',
				values: [
					{
						value: '1',
						description: 'RTP. The only component present once "a=rtcp-mux" is in force.'
					},
					{
						value: '2',
						description: 'RTCP, when it is carried on its own port rather than multiplexed.'
					}
				]
			},
			{
				name: 'transport',
				description: 'The transport protocol the candidate speaks.',
				values: [
					{ value: 'udp', description: 'UDP. The default, and the only one required by ICE.' },
					{
						value: 'tcp',
						description:
							'TCP ([RFC 6544](https://datatracker.ietf.org/doc/html/rfc6544)), used to escape networks that block UDP. Carries a `tcptype` extension.'
					}
				]
			},
			{
				name: 'priority',
				description:
					'A positive integer up to 2³¹−1, higher being preferred. It is computed as `(2²⁴ × type preference) + (2⁸ × local preference) + (256 − component ID)`, so candidate type dominates the ordering, the local preference breaks ties between interfaces, and RTP outranks RTCP. Both peers compute pair priorities from these numbers and check pairs in the same order.'
			},
			{
				name: 'connection-address',
				description:
					'The IP address of the candidate — an IPv4 or IPv6 literal, or an `.local` mDNS name used to keep private addresses out of the description.'
			},
			{ name: 'port', description: 'The port of the candidate.' },
			{
				name: 'cand-type',
				description: 'How the candidate was obtained, which determines its type preference.',
				values: [
					{
						value: 'host',
						description:
							'An address on a local interface. Type preference 126 — the cheapest path, taken whenever both peers are on the same network.'
					},
					{
						value: 'srflx',
						description:
							'Server reflexive: the public mapping of a host candidate as seen by a STUN server. Type preference 100. This is the candidate that gets a peer through most NATs.'
					},
					{
						value: 'prflx',
						description:
							'Peer reflexive: a mapping discovered mid-check, when an incoming connectivity check arrives from an address neither peer had gathered. Type preference 110. It is never signalled in an offer — it can only be learned during checks.'
					},
					{
						value: 'relay',
						description:
							"An address allocated on a TURN server, which forwards media on the endpoint's behalf. Type preference 0 — always last, because every packet costs the relay bandwidth, but it works when nothing else does."
					}
				]
			},
			{
				name: 'rel-addr',
				description:
					'The related address: the base the candidate was derived from — the host address behind an `srflx` mapping, or the mapped address of a `relay`. Present for diagnostics only; ICE ignores it, and endpoints often set it to 0.0.0.0 to avoid revealing the private address.'
			},
			{ name: 'rel-port', description: 'The port that goes with <rel-addr>.' },
			{
				name: 'extension',
				description: 'The name of a candidate extension attribute. Unknown names are ignored.',
				values: [
					{
						value: 'tcptype',
						description:
							'For TCP candidates: `active` dials out, `passive` listens, `so` attempts a simultaneous open ([RFC 6544](https://datatracker.ietf.org/doc/html/rfc6544)).'
					},
					{
						value: 'generation',
						description:
							'A Google extension numbering ICE restarts, so stale candidates from a previous generation can be discarded.'
					},
					{
						value: 'ufrag',
						description:
							'The "a=ice-ufrag" this candidate belongs to. It ties a trickled candidate to the right ICE generation when an ICE restart is in flight.'
					},
					{
						value: 'network-id',
						description:
							'A Google extension identifying the local interface the candidate came from.'
					},
					{
						value: 'network-cost',
						description:
							'A Google extension hinting at how expensive the interface is — low for Ethernet and Wi-Fi, high for cellular — so a peer can avoid metered links.'
					}
				]
			},
			{ name: 'extension value', description: 'The value of the preceding extension attribute.' }
		],
		details: `Candidates may be sent inside the session description or *trickled* afterwards, one at a time, as they are gathered ([RFC 8838](https://datatracker.ietf.org/doc/html/rfc8838)). Trickling is what lets a call start ringing before STUN and TURN have finished answering — the offer goes out immediately with whatever is known, and the rest follows.

A full candidate line reads as one sentence: \`candidate:1 1 udp 2130706431 192.168.1.1 53165 typ host\` is *component 1 of this media, reachable over UDP at 192.168.1.1:53165, a local interface address, priority 2130706431*.`
	},
	'end-of-candidates': {
		title: 'End of Candidates',
		syntax: 'end-of-candidates',
		level: 'both',
		specs: [
			{ label: 'RFC 8838 §10', href: 'https://datatracker.ietf.org/doc/html/rfc8838#section-10' }
		],
		description:
			'A property attribute stating that the endpoint has finished gathering candidates for this generation and will send no more.',
		args: [],
		details: `Without it, a peer that has failed to connect cannot tell a lost cause from a candidate still on its way, and has to fall back on a timeout. With it, ICE can move to the *failed* state immediately once every pair it knows about has been checked.`
	},
	'ice-ufrag': {
		title: 'ICE Username Fragment',
		syntax: 'ice-ufrag:<ufrag>',
		level: 'both',
		specs: [rfc8839('5.4')],
		description:
			'The local half of the ICE credentials. Connectivity checks carry a STUN USERNAME of `<remote ufrag>:<local ufrag>`, so each peer can recognise checks meant for it.',
		args: [
			{
				name: 'ufrag',
				description:
					'At least 24 bits of randomness, 4–256 characters. It must be unique among the sessions an endpoint has in flight, because it is what demultiplexes arriving STUN checks.'
			}
		],
		details: `Changing the ufrag and password is an **ICE restart**: it invalidates every existing candidate pair and starts connectivity checks over. That is how a call recovers when a device moves between networks.`
	},
	'ice-pwd': {
		title: 'ICE Password',
		syntax: 'ice-pwd:<password>',
		level: 'both',
		specs: [rfc8839('5.4')],
		description:
			'The shared secret that STUN connectivity checks for this media are authenticated with, using the short-term credential mechanism.',
		args: [
			{
				name: 'password',
				description:
					'At least 128 bits of randomness, 22–256 characters. It keys the MESSAGE-INTEGRITY attribute of every check, which is what stops an off-path attacker from forging a candidate pair into the *succeeded* state.'
			}
		],
		details: `Because the password travels in the session description in the clear, the signalling channel itself has to be confidential — ICE assumes the description was delivered over something like TLS.`
	},
	'ice-options': {
		title: 'ICE Options',
		syntax: 'ice-options:<option> [<option>]...',
		level: 'both',
		specs: [rfc8839('5.6')],
		description:
			'A space-separated list of ICE extensions the endpoint supports. Options both peers list are in force; options only one peer lists are ignored.',
		args: [
			{
				name: 'option',
				description: 'An ICE option token.',
				values: [
					{
						value: 'trickle',
						description:
							'The endpoint can send and receive candidates after the description ([RFC 8838](https://datatracker.ietf.org/doc/html/rfc8838)). Required before a peer may treat an incomplete candidate list as normal rather than as failure.'
					},
					{
						value: 'ice2',
						description:
							'The endpoint implements ICE as revised by [RFC 8445](https://datatracker.ietf.org/doc/html/rfc8445), rather than the original RFC 5245 aggressive-nomination behaviour.'
					},
					{
						value: 'renomination',
						description:
							'A Google extension letting the controlling agent nominate a better pair after one has already been selected, so a call can migrate to a cheaper path mid-session.'
					},
					{
						value: 'rtp+ecn',
						description:
							'Explicit congestion notification is negotiated over ICE ([RFC 6679](https://datatracker.ietf.org/doc/html/rfc6679)).'
					}
				]
			}
		]
	},
	'ice-lite': {
		title: 'ICE Lite',
		syntax: 'ice-lite',
		level: 'session',
		specs: [rfc8839('5.7')],
		description:
			'The endpoint implements only the lite variant of ICE: it gathers host candidates, answers connectivity checks, and never sends any of its own.',
		args: [],
		details: `Lite implementations are for endpoints with a public address and no NAT to traverse — SFUs, gateways, conference bridges. The full implementation on the other side always takes the controlling role and does all the probing.

If both peers are lite, there is nothing to check; the single candidate pair is simply used.`
	},
	'ice-pacing': {
		title: 'ICE Pacing',
		syntax: 'ice-pacing:<pacing-value>',
		level: 'session',
		specs: [rfc8839('5.5')],
		description:
			"The interval, in milliseconds, this endpoint will leave between the STUN transactions it sends. The larger of the two peers' values applies.",
		args: [
			{
				name: 'pacing-value',
				description:
					'Defaults to 50 ms. Pacing exists because a peer with many candidates would otherwise emit a burst of checks large enough to congest the very path it is measuring.'
			}
		]
	},
	'ice-mismatch': {
		title: 'ICE Mismatch',
		syntax: 'ice-mismatch',
		level: 'media',
		specs: [rfc8839('5.8')],
		description:
			'Sent in an answer to report that the default destination in the offer\'s "c=" and "m=" lines did not match any of the candidates that accompanied it.',
		args: [],
		details: `It is the symptom of a signalling intermediary — an ALG or a B2BUA — having rewritten the address in the description without understanding the candidate attributes. ICE is abandoned for that media description rather than run against addresses that are known to be inconsistent.`
	},
	'remote-candidates': {
		title: 'Remote Candidates',
		syntax:
			'remote-candidates:<component-id> <connection-address> <port> [<component-id> <connection-address> <port>]...',
		level: 'media',
		specs: [rfc8839('5.2')],
		description:
			'Included by the controlling agent in a subsequent offer to state which remote candidate it selected for each component, so the answerer does not have to infer it.',
		args: [
			{ name: 'component-id', description: 'The component the selected candidate belongs to.' },
			{
				name: 'connection-address',
				description: 'The address of the remote candidate that was selected.'
			},
			{ name: 'port', description: 'The port of the remote candidate that was selected.' }
		],
		details: `This only appears in the regular-nomination flow of a full ICE agent doing an updated offer. WebRTC endpoints do not use it.`
	}
};
