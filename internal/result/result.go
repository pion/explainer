// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package result

import (
	"strings"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
)

// SessionDetails is the combination of the Offer/Answer and what the actual state
// of the WebRTC session is.
type SessionDetails struct{}

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

func sdpLinesToSources(values []sdp.ValueWithLine, sourceType output.SourceType) (outputs []output.Source) {
	for _, v := range values {
		outputs = append(outputs, output.Source{Line: v.Line, Type: sourceType})
	}

	return
}

// ice-char = ALPHA / DIGIT / "+" / "/"
// https://datatracker.ietf.org/doc/html/rfc5245#section-15.1
func isValidIceCharString(iceChar string) bool { //nolint:cyclop
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
func isValidCertificateFingerprint(fingerprint string) string { //nolint:cyclop
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
