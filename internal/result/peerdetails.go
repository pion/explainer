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

	CertificateFingeprint output.Message `json:"certificateFingerprint"`
}

const (
	// https://datatracker.ietf.org/doc/html/rfc5245#section-15.4
	attributeIceUsernameFragment          = "ice-ufrag:"
	attributeIceUsernameFragmentMinLength = 4
	attributeIcePassword                  = "ice-pwd:"
	attributeIcePasswordMinLength         = 22

	// https://datatracker.ietf.org/doc/html/rfc4572#section-5
	attributeCertificateFingerprint = "fingerprint:"
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

// ice-char = ALPHA / DIGIT / "+" / "/"
// https://datatracker.ietf.org/doc/html/rfc5245#section-15.1
func isValidIceCharString(iceChar string) bool {
	for _, c := range iceChar {
		switch {
		case c >= '0' && c <= '9':
		case c >= 'A' && c <= 'Z':
		case c >= 'a' && c <= 'z':
		case c == '+' || c == '/':
		default:
			return false
		}
	}
	return true
}

// https://datatracker.ietf.org/doc/html/rfc4572#section-5
func isValidCertificateFingerprint(fingerprint string) string {
	spaceSplit := strings.Split(fingerprint, " ")
	if len(spaceSplit) != 2 {
		return errMissingSeperatorCertificateFingerprint
	}

	for _, v := range strings.Split(spaceSplit[1], ":") {
		if len(v) != 2 {
			return errInvalidHexCertificateFingerprint
		}

		for _, c := range v {
			switch {
			case c >= '0' && c <= '9':
			case c >= 'A' && c <= 'F':
			case c >= 'a' && c <= 'f':
			default:
				return errInvalidHexCertificateFingerprint
			}
		}
	}

	return ""
}

// Populate takes a SessionDescription and populates the PeerDetails
func (p *PeerDetails) Populate(s *sdp.SessionDescription) []output.Message {
	msgs := []output.Message{}

	{
		iceUfrags := s.ScanForAttribute(attributeIceUsernameFragment, true, true)
		trimmedValue := ""
		if len(iceUfrags) != 0 {
			trimmedValue = strings.TrimPrefix(iceUfrags[0].Value, attributeIceUsernameFragment)
		}

		switch {
		case trimmedValue == "":
			msgs = append(msgs, output.Message{Message: errNoIceUserFragment})
		case !allValuesEqual(iceUfrags):
			msgs = append(msgs, output.Message{Message: errConflictingIceUserFragment, Sources: sdpLinesToSources(iceUfrags)})
		case !isValidIceCharString(trimmedValue):
			msgs = append(msgs, output.Message{Message: errInvalidIceUserFragment, Sources: sdpLinesToSources(iceUfrags)})
		case len(trimmedValue) < attributeIceUsernameFragmentMinLength:
			msgs = append(msgs, output.Message{Message: errShortIceUserFragment, Sources: sdpLinesToSources(iceUfrags)})
		default:
			p.IceUsernameFragment = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(iceUfrags),
			}
		}
	}

	{
		icePasswords := s.ScanForAttribute(attributeIcePassword, true, true)
		trimmedValue := ""
		if len(icePasswords) != 0 {
			trimmedValue = strings.TrimPrefix(icePasswords[0].Value, attributeIcePassword)
		}

		switch {
		case trimmedValue == "":
			msgs = append(msgs, output.Message{Message: errNoIcePassword})
		case !allValuesEqual(icePasswords):
			msgs = append(msgs, output.Message{Message: errConflictingIcePassword, Sources: sdpLinesToSources(icePasswords)})
		case !isValidIceCharString(trimmedValue):
			msgs = append(msgs, output.Message{Message: errInvalidIcePassword, Sources: sdpLinesToSources(icePasswords)})
		case len(trimmedValue) < attributeIcePasswordMinLength:
			msgs = append(msgs, output.Message{Message: errShortIcePassword, Sources: sdpLinesToSources(icePasswords)})
		default:
			p.IcePassword = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(icePasswords),
			}
		}
	}

	{
		fingerprints := s.ScanForAttribute(attributeCertificateFingerprint, true, true)
		trimmedValue := ""
		if len(fingerprints) != 0 {
			trimmedValue = strings.TrimPrefix(fingerprints[0].Value, attributeCertificateFingerprint)
		}

		if trimmedValue == "" {
			msgs = append(msgs, output.Message{Message: errNoCertificateFingerprint})
		} else if !allValuesEqual(fingerprints) {
			msgs = append(msgs, output.Message{Message: errConflictingCertificateFingerprints, Sources: sdpLinesToSources(fingerprints)})
		} else if err := isValidCertificateFingerprint(trimmedValue); err != "" {
			msgs = append(msgs, output.Message{Message: err, Sources: sdpLinesToSources(fingerprints)})
		} else {
			p.CertificateFingeprint = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(fingerprints),
			}
		}
	}

	return msgs
}

// MarshalJSON returns the JSON encoding of this object
func (p *PeerDetails) MarshalJSON() ([]byte, error) {
	return MarshalPeerDetailsAsJSON(p)
}
