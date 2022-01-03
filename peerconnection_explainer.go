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
	localDescription, remoteDescription SessionDescription
}

// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *peerConnectionExplainer) SetLocalDescription(sessionDescription SessionDescription) {
	pe.localDescription = sessionDescription
}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
func (pe *peerConnectionExplainer) SetRemoteDescription(sessionDescription SessionDescription) {
	pe.remoteDescription = sessionDescription
}

// Explain returns the result of the current PeerConnectionExplainer.
func (pe *peerConnectionExplainer) Explain() (result Result) {
	result.Warnings = make([]string, 0)
	result.Errors = make([]string, 0)
	result.Suggestions = make([]string, 0)

	if pe.localDescription.Type == "" || pe.localDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnLocalDescriptionUnset)
	}
	if pe.remoteDescription.Type == "" || pe.remoteDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnRemoteDescriptionUnset)
	}

	if len(result.Warnings) == 2 {
		return // No SessionDescriptions we can check
	}

	return
}
