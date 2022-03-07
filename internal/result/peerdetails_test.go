package result

import (
	"testing"

	"github.com/pion/explainer/internal/sdp"
	"github.com/pion/explainer/pkg/output"
	"github.com/stretchr/testify/require"
)

func TestPeerDetailsICE(t *testing.T) {
	for _, test := range []struct {
		name        string
		sdp         *sdp.SessionDescription
		peerDetails PeerDetails
		messages    []output.Message
	}{
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
	} {
		test := test
		t.Run(test.name, func(t *testing.T) {
			p := PeerDetails{}
			messages := p.Populate(test.sdp)

			require.Equal(t, p, test.peerDetails)
			require.Equal(t, messages, test.messages)
		})
	}
}
