// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package result

import (
	"testing"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
	"github.com/stretchr/testify/require"
)

type testRun struct {
	name        string
	sdp         *sdp.SessionDescription
	peerDetails PeerDetails
	messages    []output.Message
}

func runPeerDetailsTest(t *testing.T, tests []testRun) {
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			p := PeerDetails{}
			messages := p.Populate(test.sdp, 0)

			require.Equal(t, p, test.peerDetails)
			require.Subset(t, messages, test.messages)
		})
	}
}

// nolint
func TestPeerDetailsICE(t *testing.T) {
	runPeerDetailsTest(t, []testRun{
		{
			"No ICE Values",
			&sdp.SessionDescription{},
			PeerDetails{},
			[]output.Message{
				{Message: errNoIceUserFragment},
				{Message: errNoIcePassword},
			},
		},
		{
			"Single ICE Value",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeIceUsernameFragment + "ABCD", Line: 5},
					{Value: attributeIcePassword + "ABCDEFGHIJKLMNOPQRSTUV", Line: 7},
				},
			},
			PeerDetails{
				IceUsernameFragment: output.Message{
					Message: "ABCD",
					Sources: []output.Source{
						{Line: 5},
					},
				},
				IcePassword: output.Message{
					Message: "ABCDEFGHIJKLMNOPQRSTUV",
					Sources: []output.Source{
						{Line: 7},
					},
				},
			},
			[]output.Message{},
		},
		{
			"Duplicate non-conflicting ICE Value",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeIceUsernameFragment + "ABCD", Line: 5},
					{Value: attributeIceUsernameFragment + "ABCD", Line: 6},
					{Value: attributeIcePassword + "ABCDEFGHIJKLMNOPQRSTUV", Line: 7},
					{Value: attributeIcePassword + "ABCDEFGHIJKLMNOPQRSTUV", Line: 8},
				},
			},
			PeerDetails{
				IceUsernameFragment: output.Message{
					Message: "ABCD",
					Sources: []output.Source{
						{Line: 5},
						{Line: 6},
					},
				},
				IcePassword: output.Message{
					Message: "ABCDEFGHIJKLMNOPQRSTUV",
					Sources: []output.Source{
						{Line: 7},
						{Line: 8},
					},
				},
			},
			[]output.Message{},
		},
		{
			"Duplicate conflicting ICE Value",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeIceUsernameFragment + "foo", Line: 5},
					{Value: attributeIceUsernameFragment + "bar", Line: 6},
					{Value: attributeIcePassword + "foo", Line: 7},
					{Value: attributeIcePassword + "bar", Line: 8},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errConflictingIceUserFragment,
					Sources: []output.Source{
						{Line: 5},
						{Line: 6},
					},
				},
				{
					Message: errConflictingIcePassword,
					Sources: []output.Source{
						{Line: 7},
						{Line: 8},
					},
				},
			},
		},
		{
			"Invalid Characters",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeIceUsernameFragment + "foo!", Line: 5},
					{Value: attributeIcePassword + "bar-", Line: 8},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errInvalidIceUserFragment,
					Sources: []output.Source{
						{Line: 5},
					},
				},
				{
					Message: errInvalidIcePassword,
					Sources: []output.Source{
						{Line: 8},
					},
				},
			},
		},
		{
			"Length Min",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeIceUsernameFragment + "foo", Line: 5},
					{Value: attributeIcePassword + "bar", Line: 8},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errShortIceUserFragment,
					Sources: []output.Source{
						{Line: 5},
					},
				},
				{
					Message: errShortIcePassword,
					Sources: []output.Source{
						{Line: 8},
					},
				},
			},
		},
	})
}

func TestPeerDetailsCertificateFingerprint(t *testing.T) {
	runPeerDetailsTest(t, []testRun{
		{
			"No Fingerprint",
			&sdp.SessionDescription{},
			PeerDetails{},
			[]output.Message{
				{Message: errNoCertificateFingerprint},
			},
		},
		{
			"Conflicting Fingerprint",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeCertificateFingerprint + "foo", Line: 5},
					{Value: attributeCertificateFingerprint + "bar", Line: 6},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errConflictingCertificateFingerprints,
					Sources: []output.Source{
						{Line: 5},
						{Line: 6},
					},
				},
			},
		},
		{
			"Two value, second not a split",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeCertificateFingerprint + "invalid in:va:li:d", Line: 5},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errInvalidHexCertificateFingerprint,
					Sources: []output.Source{
						{Line: 5},
					},
				},
			},
		},
		{
			"Two value, second not a hex",
			&sdp.SessionDescription{
				Attributes: []sdp.ValueWithLine{
					{Value: attributeCertificateFingerprint + "invalid in:va:li:dd", Line: 5},
				},
			},
			PeerDetails{},
			[]output.Message{
				{
					Message: errInvalidHexCertificateFingerprint,
					Sources: []output.Source{
						{Line: 5},
					},
				},
			},
		},
	})
}
