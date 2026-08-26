// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';

/**
 * How the media is keyed. WebRTC uses DTLS-SRTP — "a=fingerprint" binds the
 * DTLS certificate to the description, "a=setup" decides who dials — while SIP
 * deployments may still key SRTP from "a=crypto" in the description itself.
 */
export const security: Record<string, Details> = {
	fingerprint: {
		title: 'Certificate Fingerprint',
		syntax: 'fingerprint:<hash-function> <fingerprint>',
		level: 'both',
		specs: [
			{ label: 'RFC 8122 §5', href: 'https://datatracker.ietf.org/doc/html/rfc8122#section-5' },
			{ label: 'RFC 8842 — DTLS-SDP', href: 'https://datatracker.ietf.org/doc/html/rfc8842' }
		],
		description:
			"A hash of the certificate this endpoint will present during the DTLS handshake. It is the hinge of WebRTC's security model: DTLS itself uses self-signed certificates, so the fingerprint carried in the — separately authenticated — session description is what makes the handshake meaningful.",
		args: [
			{
				name: 'hash-function',
				description: 'The hash algorithm, from the IANA "Hash Function Textual Names" registry.',
				values: [
					{
						value: 'sha-256',
						description: 'The universal choice, and the one **RECOMMENDED** by RFC 8122.'
					},
					{
						value: 'sha-384',
						description: 'Permitted, and occasionally used by endpoints with stricter policy.'
					},
					{ value: 'sha-512', description: 'Permitted.' },
					{
						value: 'sha-1',
						description:
							'Legacy. **MUST NOT** be used for new work — its collision resistance is broken.'
					},
					{ value: 'md5', description: 'Legacy and forbidden.' },
					{ value: 'md2', description: 'Legacy and forbidden.' }
				]
			},
			{
				name: 'fingerprint',
				description:
					'The hash itself, as uppercase hex octets joined by colons — 32 of them for SHA-256.'
			}
		],
		details: `Once the DTLS handshake completes, the endpoint hashes the certificate the peer actually presented and compares it with this value. A mismatch means the media is going somewhere other than the peer that signed the description, and the connection **MUST** be torn down.

A session-level fingerprint covers every media description; a media-level one overrides it for that media only, which is what allows different DTLS transports in a description that is not fully bundled.`
	},
	setup: {
		title: 'DTLS Setup Role',
		syntax: 'setup:<role>',
		level: 'both',
		specs: [
			{ label: 'RFC 4145 §4', href: 'https://datatracker.ietf.org/doc/html/rfc4145#section-4' }
		],
		description:
			'Which endpoint starts the DTLS handshake. Someone has to be the client and someone the server; both peers dialling, or both listening, deadlocks the connection.',
		args: [
			{
				name: 'role',
				description: 'The role this endpoint takes.',
				values: [
					{
						value: 'active',
						description: 'This endpoint initiates the handshake — it is the DTLS client.'
					},
					{
						value: 'passive',
						description: 'This endpoint waits for the handshake — it is the DTLS server.'
					},
					{
						value: 'actpass',
						description:
							'This endpoint will take either role and lets the answerer choose. An offer **SHOULD** use this; an answer **MUST NOT**.'
					},
					{
						value: 'holdconn',
						description:
							'Do not establish the connection for the time being. Used to put a stream on hold without tearing the description down.'
					}
				]
			}
		],
		details: `The usual exchange is \`actpass\` in the offer and \`active\` in the answer, which makes the answerer the DTLS client. That is deliberate: the answerer already knows the offerer's fingerprint and candidates, so it can start the handshake the moment ICE finds a working pair, saving a round trip.

The DTLS role also decides SRTP key derivation — client and server take different halves of the exported keying material — so it is not merely a matter of who speaks first.`
	},
	'tls-id': {
		title: 'TLS Identifier',
		syntax: 'tls-id:<identifier>',
		level: 'both',
		specs: [
			{ label: 'RFC 8842 §5', href: 'https://datatracker.ietf.org/doc/html/rfc8842#section-5' }
		],
		description:
			'A unique identifier for the DTLS association. It tells a peer whether a renegotiation intends to keep the existing DTLS connection or to replace it.',
		args: [
			{
				name: 'identifier',
				description:
					'At least 120 bits of randomness. An unchanged value across an offer/answer means "reuse the association"; a new value means the DTLS handshake **MUST** be redone.'
			}
		]
	},
	crypto: {
		title: 'SRTP Security Description',
		syntax: 'crypto:<tag> <crypto-suite> <key-params> [<session-params>]...',
		level: 'media',
		specs: [{ label: 'RFC 4568', href: 'https://datatracker.ietf.org/doc/html/rfc4568' }],
		description:
			'SDP Security Descriptions — SRTP keys carried in the description itself, rather than negotiated by DTLS. Used by SIP over TLS; **not permitted in WebRTC**, which requires DTLS-SRTP.',
		args: [
			{
				name: 'tag',
				description:
					'A number identifying this option. The answerer echoes the tag of the suite it accepted.'
			},
			{
				name: 'crypto-suite',
				description: 'The cipher and authentication transform.',
				values: [
					{
						value: 'AES_CM_128_HMAC_SHA1_80',
						description: 'AES counter mode with an 80-bit authentication tag. The default suite.'
					},
					{
						value: 'AES_CM_128_HMAC_SHA1_32',
						description:
							'The same cipher with a 32-bit tag, trading integrity strength for header overhead on low-bitrate audio.'
					},
					{
						value: 'AES_256_CM_HMAC_SHA1_80',
						description:
							'A 256-bit key with an 80-bit tag ([RFC 6188](https://datatracker.ietf.org/doc/html/rfc6188)).'
					},
					{
						value: 'AEAD_AES_128_GCM',
						description:
							'Authenticated encryption with AES-GCM ([RFC 7714](https://datatracker.ietf.org/doc/html/rfc7714)).'
					}
				]
			},
			{
				name: 'key-params',
				description:
					'The keying material, `inline:<base64 key and salt>[|lifetime][|MKI:length]`. This is the reason the attribute is unsafe over an untrusted signalling path — anyone who can read the description can decrypt the media.'
			},
			{
				name: 'session-params',
				description: 'Optional transform parameters, such as `UNENCRYPTED_SRTCP` or `KDR=<rate>`.'
			}
		]
	},
	identity: {
		title: 'Identity Assertion',
		syntax: 'identity:<assertion-value> [<extension>]...',
		level: 'session',
		specs: [
			{ label: 'RFC 8827 §5.6', href: 'https://datatracker.ietf.org/doc/html/rfc8827#section-5.6' }
		],
		description:
			'A signed assertion from an identity provider binding a real-world identity to the "a=fingerprint" in this description.',
		args: [
			{
				name: 'assertion-value',
				description: 'The base64-encoded assertion returned by the identity provider.'
			},
			{
				name: 'extension',
				description: 'An extension attribute, currently only `algorithm` and `provider`.'
			}
		],
		details: `The fingerprint proves that the media comes from whoever wrote the description. It does not say who that is — the signalling server could have substituted its own. An identity assertion closes that gap: the browser verifies it against the identity provider directly, so a compromised signalling server cannot impersonate a user without also compromising their IdP.`
	},
	cryptex: {
		title: 'Cryptex',
		syntax: 'cryptex',
		level: 'both',
		specs: [{ label: 'RFC 9335', href: 'https://datatracker.ietf.org/doc/html/rfc9335' }],
		description:
			'A property attribute offering *completely encrypted* RTP header extensions and CSRCs. Both peers must list it for it to take effect.',
		args: [],
		details: `Plain SRTP encrypts the payload but leaves the header extensions in the clear, so anything carried there — audio levels, mid and rid identifiers, the CSRC list naming who is speaking in a conference — is visible to every relay on the path. That is a real leak: audio-level extensions alone are enough to reconstruct who spoke when.

Cryptex reuses the SRTP keys and adds no round trips; it only changes which bytes are covered.`
	}
};
