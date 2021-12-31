// +build !js,!wasm

package peerconnection_explainer //nolint golint

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_SetOffer(t *testing.T) {
	pe := New()
	require.NotNil(t, pe)

	pe.SetLocalDescription(SessionDescription{})
}

func Test_SetAnswer(t *testing.T) {
	pe := New()
	require.NotNil(t, pe)

	pe.SetRemoteDescription(SessionDescription{})
}
