// +build !js,!wasm

package explainer

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_SetOffer(t *testing.T) {
	pe := NewPeerConnectionExplainer()
	require.NotNil(t, pe)

	pe.SetLocalDescription(SessionDescription{})
}

func Test_SetAnswer(t *testing.T) {
	pe := NewPeerConnectionExplainer()
	require.NotNil(t, pe)

	pe.SetRemoteDescription(SessionDescription{})
}
