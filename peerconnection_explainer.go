// Package explainer provides APIs to make debugging and learning WebRTC easier
package explainer

import "github.com/pion/explainer/internal/sdp"

// PeerConnectionExplainer mocks the PeerConnection API and returns analysis and suggestions
type PeerConnectionExplainer interface {
	// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetLocalDescription(sessionDescription SessionDescription)

	// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetRemoteDescription(sessionDescription SessionDescription)

	// Explain returns the result of the current PeerConnectionExplainer.
	Explain() Result
}

// NewPeerConnectionExplainer returns a new PeerConnectionExplainer
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
	result.init()

	if pe.localDescription.Type == "" || pe.localDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnLocalDescriptionUnset)
	}
	if pe.remoteDescription.Type == "" || pe.remoteDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnRemoteDescriptionUnset)
	}

	if len(result.Warnings) == 2 {
		return // No SessionDescriptions we can check
	}

	if pe.localDescription.Type == pe.remoteDescription.Type {
		result.Errors = append(result.Errors, errLocalAndRemoteSameType)
	}

	parsed := &sdp.SessionDescription{}

	if pe.localDescription.SDP != "" {
		if err := parsed.Unmarshal(pe.localDescription.SDP); err != nil {
			result.Errors = append(result.Errors, err.Error())
		}
	}

	if pe.remoteDescription.SDP != "" {
		if err := parsed.Unmarshal(pe.remoteDescription.SDP); err != nil {
			result.Errors = append(result.Errors, err.Error())
		}
	}

	return result
}
