package peerconnection_explainer

type PeerConnectionExplainer interface {
	// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetLocalDescription(sessionDescription SessionDescription)

	// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetRemoteDescription(sessionDescription SessionDescription)

	// Explain returns the result of the current PeerConnectionExplainer.
	Explain() Result
}

func NewPeerConnectionExplainer() PeerConnectionExplainer {
	return &peerConnectionExplainer{}
}

type peerConnectionExplainer struct {
}

// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *peerConnectionExplainer) SetLocalDescription(sessionDescription SessionDescription) {}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *peerConnectionExplainer) SetRemoteDescription(sessionDescription SessionDescription) {}

// Explain returns the result of the current PeerConnectionExplainer.
func (pe *peerConnectionExplainer) Explain() Result {
	return Result{}
}
