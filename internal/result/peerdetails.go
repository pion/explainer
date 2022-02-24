package result

import (
	"strings"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
)

// PeerDetails contains the details published by a single peer. This is what
// a single peer Offered or Answered
//go:generate json-ice --type=PeerDetails
type PeerDetails struct {
	IceUsernameFragment output.Message `json:"iceUsernameFragment"`
	IcePassword         output.Message `json:"icePassword"`
}

const (
	attributeIceUsernameFragment = "ice-ufrag:"
	attributeIcePassword         = "ice-pwd:"
)

func allValuesEqual(vals []sdp.ValueWithLine) bool {
	val := ""
	for _, v := range vals {
		if val == "" {
			val = v.Value
		} else if v.Value != val {
			return false
		}
	}
	return true
}

func sdpLinesToSources(values []sdp.ValueWithLine) (outputs []output.Source) {
	for _, v := range values {
		outputs = append(outputs, output.Source{Line: v.Line})
	}
	return
}

// Populate takes a SessionDescription and populates the PeerDetails
func (p *PeerDetails) Populate(s *sdp.SessionDescription) []output.Message {
	msgs := []output.Message{}

	iceUfrags := s.ScanForAttribute(attributeIceUsernameFragment, true, true)
	switch {
	case len(iceUfrags) == 0:
		msgs = append(msgs, output.Message{Message: errNoIceUserFragment})
	case !allValuesEqual(iceUfrags):
		msgs = append(msgs, output.Message{Message: errConflictingIceUserFragment, Sources: sdpLinesToSources(iceUfrags)})
	default:
		p.IceUsernameFragment = output.Message{
			Message: strings.TrimPrefix(iceUfrags[0].Value, attributeIceUsernameFragment),
			Sources: sdpLinesToSources(iceUfrags),
		}
	}

	icePasswords := s.ScanForAttribute(attributeIcePassword, true, true)
	switch {
	case len(icePasswords) == 0:
		msgs = append(msgs, output.Message{Message: errNoIcePassword})
	case !allValuesEqual(iceUfrags):
		msgs = append(msgs, output.Message{Message: errConflictingIcePassward, Sources: sdpLinesToSources(iceUfrags)})
	default:
		p.IcePassword = output.Message{
			Message: strings.TrimPrefix(icePasswords[0].Value, attributeIcePassword),
			Sources: sdpLinesToSources(icePasswords),
		}
	}

	return msgs
}

// MarshalJSON returns the JSON encoding of this object
func (p *PeerDetails) MarshalJSON() ([]byte, error) {
	return MarshalPeerDetailsAsJSON(p)
}
