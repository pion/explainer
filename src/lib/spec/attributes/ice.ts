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
			'One transport address this endpoint might be reachable at. Each peer gathers a set of candidates, sends them in — or after — its session description, and ICE forms candidate pairs and checks them with STUN in priority order until it can nominate a working path.',
		args: [
			{
				name: 'foundation',
				description:
					'An opaque token shared by candidates of the same type whose bases have the same IP address (their ports may differ), that use the same transport protocol and, for reflexive and relayed candidates, were obtained through a STUN or TURN server at the same IP address. A shared foundation groups checks that are likely to have the same fate; it does not make candidates redundant. A candidate is redundant only when both its transport address and its base equal those of another candidate.'
			},
			{
				name: 'component-id',
				description:
					'An integer from 1 through 256 identifying which component of the data stream this candidate is for.',
				values: [
					{
						value: '1',
						description:
							'RTP for an RTP/RTCP stream. It is the only component needed when "a=rtcp-mux" is in force, although the absence of component 2 can also mean that RTCP is not used.'
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
					'A unique positive integer up to 2³¹−1, higher being preferred. ICE recommends (`SHOULD`) computing it as `(2²⁴ × type preference) + (2⁸ × local preference) + (256 − component ID)`; an agent may use another formula. With the recommended formula, candidate type dominates the ordering, local preference orders interfaces, and lower component IDs rank higher. Both peers compute pair priorities from these numbers and check pairs in the same order.'
			},
			{
				name: 'connection-address',
				description:
					"The candidate address. RFC 8839's grammar admits IPv4, IPv6, and FQDNs; however, a base-RFC agent must not generate an FQDN and must ignore one it receives unless an extension defines its handling. The `.local` mDNS names seen in WebRTC are such extension behavior, used to avoid exposing private host addresses."
			},
			{ name: 'port', description: 'The port of the candidate.' },
			{
				name: 'cand-type',
				description:
					'How the candidate was obtained. An agent assigns one type-preference value to each candidate type.',
				values: [
					{
						value: 'host',
						description:
							'An address on a local interface. The recommended type preference is 126, commonly favoring a direct path when one works.'
					},
					{
						value: 'srflx',
						description:
							'Server reflexive: the public mapping of a host candidate as seen by a STUN server. The recommended type preference is 100. This is the candidate that gets a peer through most NATs.'
					},
					{
						value: 'prflx',
						description:
							'Peer reflexive: a candidate learned during connectivity checks rather than candidate gathering. The recommended type preference is 110. It may be included in a subsequent offer if it was learned after the previous offer and before nomination.'
					},
					{
						value: 'relay',
						description:
							"An address allocated on a TURN server, which forwards media on the endpoint's behalf. The recommended type preference is 0, making it a last resort because every packet costs the relay bandwidth, but it works when nothing else does."
					}
				]
			},
			{
				name: 'rel-addr',
				description:
					'The related address: the base an `srflx` or `prflx` candidate was derived from, or the mapped address of a `relay`. Present for diagnostics only; ICE ignores it, and endpoints often set it to 0.0.0.0 to avoid revealing the private address.'
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
							'A Libwebrtc extension numbering ICE restarts, so stale candidates from a previous generation can be discarded.'
					},
					{
						value: 'ufrag',
						description:
							'The "a=ice-ufrag" this trickled candidate belongs to, used to correlate it with an ICE generation. This is not a core RFC 8839 field; RFC 8838 gives a candidate `ufrag` only as an example of how an SDP-based using protocol might perform that correlation, and libwebrtc emits it.'
					},
					{
						value: 'network-id',
						description:
							'A Libwebrtc extension identifying the local interface the candidate came from.'
					},
					{
						value: 'network-cost',
						description:
							'A Libwebrtc extension hinting at how expensive the interface is — low for Ethernet and Wi-Fi, high for cellular — so a peer can avoid metered links.'
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
			{ label: 'RFC 8840 §8', href: 'https://www.rfc-editor.org/rfc/rfc8840.html#section-8' }
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
					'At least 24 bits of randomness and 4–32 characters when sent. The grammar allows 4–256 characters so receivers can accept values up to 256. It must be unique among the sessions an endpoint has in flight, because it is what demultiplexes arriving STUN checks.'
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
			'The password this agent advertises for the peer to use when authenticating STUN connectivity checks sent toward this agent, using the short-term credential mechanism.',
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
							'The endpoint implements ICE as revised by [RFC 8445](https://datatracker.ietf.org/doc/html/rfc8445). Its absence lets a peer assume the older RFC 5245 behaviour.'
					},
					{
						value: 'renomination',
						description:
							'A Libwebrtc extension letting the controlling agent nominate a better pair after one has already been selected, so a call can migrate to a cheaper path mid-session.'
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
		specs: [rfc8839('5.3')],
		description:
			'The endpoint implements only the lite variant of ICE: it gathers host candidates, answers connectivity checks, and never sends any of its own.',
		args: [],
		details: `Lite implementations are for endpoints with a public address and no NAT to traverse — SFUs, gateways, conference bridges. The full implementation on the other side always takes the controlling role and does all the probing.

If both peers are lite, they exchange candidates but send no connectivity checks. The offerer takes the controlling role and selects a pair for each component; more than one pair can initially be possible, for example when the agents offer different address families.`
	},
	'ice-pacing': {
		title: 'ICE Pacing',
		syntax: 'ice-pacing:<pacing-value>',
		level: 'session',
		specs: [rfc8839('5.5')],
		description:
			"The desired connectivity-check pacing interval (`Ta`), in milliseconds. The larger of the two peers' values applies.",
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
		specs: [rfc8839('5.3')],
		description:
			'Sent in an answer to report that the default destination in the offer\'s "c=" and "m=" lines did not match any of the candidates that accompanied it.',
		args: [],
		details: `A signalling intermediary such as an ALG or B2BUA rewriting the default address without understanding candidate attributes is a common cause, but the attribute reports the mismatch rather than its cause. ICE is abandoned for that media description rather than run against addresses that are known to be inconsistent.`
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
		details: `A controlling full agent includes this in a completed subsequent offer after nomination. A controlling lite agent must also include it when both agents are lite. Its original purpose is to resolve the race in which an updated offer arrives before the Binding response that would add the selected pair to the controlled agent's valid list. JSEP endpoints parse the attribute but [ignore its values](https://www.rfc-editor.org/rfc/rfc9429.html#section-5.8.2).`
	}
};
