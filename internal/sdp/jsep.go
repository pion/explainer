// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package sdp

// Constants for SDP attributes used in JSEP.
const (
	AttrKeyIdentity        = "identity"
	AttrKeyGroup           = "group"
	AttrKeySsrc            = "ssrc"
	AttrKeySsrcGroup       = "ssrc-group"
	AttrKeyMsidSemantic    = "msid-semantic"
	AttrKeyConnectionSetup = "setup"
	AttrKeyMID             = "mid"
	AttrKeyICELite         = "ice-lite"
	AttrKeyRtcpMux         = "rtcp-mux"
	AttrKeyRtcpRsize       = "rtcp-rsize"
)

// Constants for semantic tokens used in JSEP.
const (
	SemanticTokenLipSynchronization     = "LS"
	SemanticTokenFlowIdentification     = "FID"
	SemanticTokenForwardErrorCorrection = "FEC"
	SemanticTokenWebRTCMediaStreams     = "WMS"
)
