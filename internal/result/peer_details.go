// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package result

import (
	"strings"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
)

// PeerDetails contains the details published by a single peer. This is what
// a single peer Offered or Answered.
type PeerDetails struct {
	IceUsernameFragment output.Message `json:"iceUsernameFragment"`
	IcePassword         output.Message `json:"icePassword"`

	CertificateFingeprint output.Message `json:"certificateFingerprint"`

	MediaSections []MediaSectionDetails `json:"mediaSections"`
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

// Populate takes a SessionDescription and populates the PeerDetails.
//
//nolint:cyclop
func (p *PeerDetails) Populate(descr *sdp.SessionDescription, sourceType output.SourceType) []output.Message {
	msgs := []output.Message{}

	{
		iceUfrags := descr.ScanForAttribute(attributeIceUsernameFragment, true, true)
		trimmedValue := ""
		if len(iceUfrags) != 0 {
			trimmedValue = strings.TrimPrefix(iceUfrags[0].Value, attributeIceUsernameFragment)
		}

		switch {
		case trimmedValue == "":
			msgs = append(msgs, output.Message{Message: errNoIceUserFragment})
		case !allValuesEqual(iceUfrags):
			msgs = append(msgs, output.Message{
				Message: errConflictingIceUserFragment, Sources: sdpLinesToSources(iceUfrags, sourceType),
			})
		case !isValidIceCharString(trimmedValue):
			msgs = append(msgs, output.Message{
				Message: errInvalidIceUserFragment, Sources: sdpLinesToSources(iceUfrags, sourceType),
			})
		case len(trimmedValue) < attributeIceUsernameFragmentMinLength:
			msgs = append(msgs, output.Message{
				Message: errShortIceUserFragment, Sources: sdpLinesToSources(iceUfrags, sourceType),
			})
		default:
			p.IceUsernameFragment = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(iceUfrags, sourceType),
			}
		}
	}

	{
		icePasswords := descr.ScanForAttribute(attributeIcePassword, true, true)
		trimmedValue := ""
		if len(icePasswords) != 0 {
			trimmedValue = strings.TrimPrefix(icePasswords[0].Value, attributeIcePassword)
		}

		switch {
		case trimmedValue == "":
			msgs = append(msgs, output.Message{Message: errNoIcePassword})
		case !allValuesEqual(icePasswords):
			msgs = append(msgs, output.Message{
				Message: errConflictingIcePassword, Sources: sdpLinesToSources(icePasswords, sourceType),
			})
		case !isValidIceCharString(trimmedValue):
			msgs = append(msgs, output.Message{
				Message: errInvalidIcePassword, Sources: sdpLinesToSources(icePasswords, sourceType),
			})
		case len(trimmedValue) < attributeIcePasswordMinLength:
			msgs = append(msgs, output.Message{
				Message: errShortIcePassword, Sources: sdpLinesToSources(icePasswords, sourceType),
			})
		default:
			p.IcePassword = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(icePasswords, sourceType),
			}
		}
	}

	{
		fingerprints := descr.ScanForAttribute(attributeCertificateFingerprint, true, true)
		trimmedValue := ""
		if len(fingerprints) != 0 {
			trimmedValue = strings.TrimPrefix(fingerprints[0].Value, attributeCertificateFingerprint)
		}

		if trimmedValue == "" {
			msgs = append(msgs, output.Message{Message: errNoCertificateFingerprint})
		} else if !allValuesEqual(fingerprints) {
			msgs = append(
				msgs,
				output.Message{
					Message: errConflictingCertificateFingerprints,
					Sources: sdpLinesToSources(fingerprints, sourceType),
				},
			)
		} else if err := isValidCertificateFingerprint(trimmedValue); err != "" {
			msgs = append(msgs, output.Message{Message: err, Sources: sdpLinesToSources(fingerprints, sourceType)})
		} else {
			p.CertificateFingeprint = output.Message{
				Message: trimmedValue,
				Sources: sdpLinesToSources(fingerprints, sourceType),
			}
		}
	}

	return msgs
}
