// Package explainer provides APIs to make debugging and learning WebRTC easier
package explainer

import (
	"encoding/base64"

	jlexer "github.com/CosmWasm/tinyjson/jlexer"
	"github.com/pion/explainer/internal/sdp"
)

// PeerConnectionExplainer mocks the PeerConnection API and returns analysis and suggestions
type PeerConnectionExplainer interface {
	// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetLocalDescription(input string)

	// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
	SetRemoteDescription(input string)

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
	r := jlexer.Lexer{Data: []byte(input)}
	tinyjsonEa60cfe6DecodeGithubComPionPeerconnectionExplainer(&r, &s)
	if r.Error() == nil {
		return s
	}

	return sessionDescription{SDP: input}
}

// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
// The input can be a SessionDescriptionInit or just a SDP. The value can be base64 encoded
func (pe *peerConnectionExplainer) SetLocalDescription(input string) {
	pe.localDescription = generateSessionDescription(input)
}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
// The input can be a SessionDescriptionInit or just a SDP. The value can be base64 encoded
func (pe *peerConnectionExplainer) SetRemoteDescription(input string) {
	pe.remoteDescription = generateSessionDescription(input)
}

// Explain returns the result of the current PeerConnectionExplainer.
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
