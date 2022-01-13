// Package explainer provides APIs to make debugging and learning WebRTC easier
package explainer

import (
	"encoding/base64"
	"strings"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
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

func (pe *peerConnectionExplainer) String() string {
	return "PeerConnection Explainer"
}

func generateSessionDescription(input string) sessionDescription {
	if possiblyDecoded, err := base64.StdEncoding.DecodeString(input); err == nil {
		input = string(possiblyDecoded)
	}

	s := sessionDescription{}
	if s.unmarshal(input); s.Type == "" && s.SDP == "" {
		s.SDP = input
	}

	s.SDP = strings.ReplaceAll(s.SDP, "\\r\\n", "\n")
	return s
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
		result.Warnings = append(result.Warnings, output.NewMessage(warnLocalDescriptionUnset, nil))
	}
	if pe.remoteDescription.SDP == "" {
		result.Warnings = append(result.Warnings, output.NewMessage(warnRemoteDescriptionUnset, nil))
	}

	if len(result.Warnings) == 2 {
		return // No SessionDescriptions we can check
	}

	if pe.localDescription.Type != "" && pe.localDescription.Type == pe.remoteDescription.Type {
		result.Errors = append(result.Errors, output.NewMessage(errLocalAndRemoteSameType, nil))
	}

	parsed := &sdp.SessionDescription{}

	if pe.localDescription.SDP != "" {
		if m := parsed.Unmarshal(pe.localDescription.SDP); m.Message != "" {
			m.Sources[0].Type = "local"
			result.Errors = append(result.Errors, m)
		}
	}

	if pe.remoteDescription.SDP != "" {
		if m := parsed.Unmarshal(pe.localDescription.SDP); m.Message != "" {
			m.Sources[0].Type = "remote"
			result.Errors = append(result.Errors, m)
		}
	}

	return result
}

func (pe *peerConnectionExplainer) GetLocalDescription() string  { return pe.localDescription.SDP }
func (pe *peerConnectionExplainer) GetRemoteDescription() string { return pe.remoteDescription.SDP }
