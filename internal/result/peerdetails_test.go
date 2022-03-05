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
					{Value: attributeIceUsernameFragment + "foo", Line: 5},
					{Value: attributeIcePassword + "bar", Line: 7},
				},
			},
			PeerDetails{
				IceUsernameFragment: output.Message{
					Message: "foo",
					Sources: []output.Source{
						{Line: 5},
					},
				},
				IcePassword: output.Message{
					Message: "bar",
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
					{Value: attributeIceUsernameFragment + "foo", Line: 5},
					{Value: attributeIceUsernameFragment + "foo", Line: 6},
					{Value: attributeIcePassword + "bar", Line: 7},
					{Value: attributeIcePassword + "bar", Line: 8},
				},
			},
			PeerDetails{
				IceUsernameFragment: output.Message{
					Message: "foo",
					Sources: []output.Source{
						{Line: 5},
						{Line: 6},
					},
				},
				IcePassword: output.Message{
					Message: "bar",
					Sources: []output.Source{
						{Line: 7},
						{Line: 8},
					},
				},
			},
			[]output.Message{},
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
