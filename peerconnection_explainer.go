package peerconnection_explainer

type PeerConnectionExplainer struct{}

type SessionDescription struct {
	Type string `json:"type"`
	SDP  string `json:"sdp"`
}

// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *PeerConnectionExplainer) SetLocalDescription(sessionDescription SessionDescription) {}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *PeerConnectionExplainer) SetRemoteDescription(sessionDescription SessionDescription) {}

// Explain returns the result of the current PeerConnectionExplainer.
func (pe *PeerConnectionExplainer) Explain() Result {
	return Result{}
}
