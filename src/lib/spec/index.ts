// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../types';
import { attributes } from './attributes';
import { fields } from './fields';

export { attributes, fields };

/** The attribute name of an "a=" line: everything before the first colon. */
export const attributeName = (value: string) => {
	const colon = value.indexOf(':');
	return colon === -1 ? value : value.slice(0, colon);
};

/**
 * Picks the documentation for a line. Attributes are looked up by name so that
 * "a=candidate:..." gets the ICE candidate grammar rather than the generic
 * "a=<name>:<value>" one; everything unrecognised falls back to that generic
 * entry, which still parses and still explains what an attribute is.
 */
export const lookup = (type: string, value: string): Details | undefined => {
	if (type !== 'a') return fields[type];
	return attributes[attributeName(value)] ?? fields.a;
};

export const exampleSDP = `v=0
o=- 3546004397921447048 1596742744 IN IP4 0.0.0.0
s=-
t=0 0
a=fingerprint:sha-256 0F:74:31:25:CB:A2:13:EC:28:6F:6D:2C:61:FF:5D:C2:BC:B9:DB:3D:98:14:8D:1A:BB:EA:33:0C:A4:60:A8:8E
a=group:BUNDLE 0 1 2
a=msid-semantic:WMS *
a=ice-options:trickle ice2
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 110
c=IN IP4 0.0.0.0
b=AS:64
a=setup:actpass
a=mid:0
a=ice-ufrag:CsxzEWmoKpJyscFj
a=ice-pwd:mktpbhgREmjEwUFSIJyPINPUhgDqJlSd
a=rtcp-mux
a=rtcp-rsize
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
a=rtcp-fb:111 transport-cc
a=rtpmap:110 telephone-event/48000
a=ptime:20
a=maxptime:120
a=msid:yvKPspsHcYcwGFTw DfQnKjQQuwceLFdV
a=ssrc:350842737 cname:yvKPspsHcYcwGFTw
a=ssrc:350842737 msid:yvKPspsHcYcwGFTw DfQnKjQQuwceLFdV
a=sendrecv
a=candidate:foundation 1 udp 2130706431 192.168.1.1 53165 typ host generation 0
a=candidate:foundation 1 udp 1694498815 1.2.3.4 57336 typ srflx raddr 0.0.0.0 rport 57336 generation 0
a=candidate:foundation 1 tcp 1518280447 192.168.1.1 9 typ host tcptype active generation 0
a=end-of-candidates
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98
c=IN IP4 0.0.0.0
b=AS:2000
a=setup:actpass
a=mid:1
a=ice-ufrag:CsxzEWmoKpJyscFj
a=ice-pwd:mktpbhgREmjEwUFSIJyPINPUhgDqJlSd
a=rtcp-mux
a=rtcp-rsize
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 transport-cc
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 H264/90000
a=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=rid:q send max-width=320;max-height=180
a=rid:h send max-width=640;max-height=360
a=rid:f send max-width=1280;max-height=720
a=simulcast:send q;h;f
a=msid:XHbOTNRFnLtesHwJ JgtwEhBWNEiOnhuW
a=ssrc-group:FID 2180035812 4266442356
a=ssrc:2180035812 cname:XHbOTNRFnLtesHwJ
a=ssrc:4266442356 cname:XHbOTNRFnLtesHwJ
a=sendrecv
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=setup:actpass
a=mid:2
a=ice-ufrag:CsxzEWmoKpJyscFj
a=ice-pwd:mktpbhgREmjEwUFSIJyPINPUhgDqJlSd
a=sctp-port:5000
a=max-message-size:262144`;
