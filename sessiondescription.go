package peerconnection_explainer

type SessionDescription struct {
	Type string `json:"type"`
	SDP  string `json:"sdp"`
}
