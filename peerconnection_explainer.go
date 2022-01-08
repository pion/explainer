// Package explainer provides APIs to make debugging and learning WebRTC easier
package explainer

import (
	"encoding/base64"

	"github.com/pion/explainer/internal/sdp"
)

// PeerConnectionExplainer mocks the PeerConnection API and returns analysis and suggestions
type PeerConnectionExplainer interface {
	// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetLocalDescription(input string)

	// GetLocalDescription returns the current SDP we are using from SetLocalDescription
	GetLocalDescription() string

	// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetRemoteDescription(input string)

	// GetRemoteDescription returns the current SDP we are using from SetRemoteDescription
	GetRemoteDescription() string

	// Explain returns the result of the current PeerConnectionExplainer.
	Explain() Result
}

// NewPeerConnectionExplainer returns a new PeerConnectionExplainer
func NewPeerConnectionExplainer() PeerConnectionExplainer {
	return &peerConnectionExplainer{}
}

type peerConnectionExplainer struct {
	localDescription, remoteDescription sessionDescription
}

func generateSessionDescription(input string) sessionDescription {
	if possiblyDecoded, err := base64.StdEncoding.DecodeString(input); err == nil {
		input = string(possiblyDecoded)
	}

	s := sessionDescription{}
	if s.unmarshal(input); s.Type != "" && s.SDP != "" {
		return s
	}

	return sessionDescription{SDP: input}
}

func (pe *peerConnectionExplainer) SetLocalDescription(input string) {
	pe.localDescription = generateSessionDescription(input)
}

func (pe *peerConnectionExplainer) SetRemoteDescription(input string) {
	pe.remoteDescription = generateSessionDescription(input)
}

func (pe *peerConnectionExplainer) Explain() (result Result) {
	result.init()

	if pe.localDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnLocalDescriptionUnset)
	}
	if pe.remoteDescription.SDP == "" {
		result.Warnings = append(result.Warnings, warnRemoteDescriptionUnset)
	}

	if len(result.Warnings) == 2 {
		return // No SessionDescriptions we can check
	}

	if pe.localDescription.Type != "" && pe.localDescription.Type == pe.remoteDescription.Type {
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

func (pe *peerConnectionExplainer) GetLocalDescription() string  { return pe.localDescription.SDP }
func (pe *peerConnectionExplainer) GetRemoteDescription() string { return pe.remoteDescription.SDP }
