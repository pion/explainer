// +build !js,!wasm

package explainer

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_Missing_Description(t *testing.T) {
	t.Run("Local", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetRemoteDescription(SessionDescription{Type: "Offer", SDP: "Foobar"})
		results := pe.Explain()

		require.Equal(t, results.Warnings[0], warnLocalDescriptionUnset)
	})

	t.Run("Remote", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetLocalDescription(SessionDescription{Type: "Offer", SDP: "Foobar"})
		results := pe.Explain()

		require.Equal(t, results.Warnings[0], warnRemoteDescriptionUnset)
	})
}

func Test_Conflicting_Type(t *testing.T) {
	pe := NewPeerConnectionExplainer()

	pe.SetRemoteDescription(SessionDescription{Type: "Offer", SDP: "Foobar"})
	pe.SetLocalDescription(SessionDescription{Type: "Offer", SDP: "Foobar"})

	results := pe.Explain()

	require.Equal(t, results.Errors[0], errLocalAndRemoteSameType)
}
