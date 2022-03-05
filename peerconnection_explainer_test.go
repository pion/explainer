//go:build !js && !wasm
// +build !js,!wasm

package explainer

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_InputHeuristics(t *testing.T) {
	t.Run("base64", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetRemoteDescription(`eyJ0eXBlIjogIm9mZmVyIiwgInNkcCI6ICJGb29iYXIifQ==`)
		pe.SetLocalDescription(`eyJ0eXBlIjogIm9mZmVyIiwgInNkcCI6ICJGb29iYXIifQ==`)

		require.Equal(t, pe.Explain().Errors[0].Message, errLocalAndRemoteSameType)
	})

	t.Run("SDP", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetRemoteDescription("v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0")
		pe.SetLocalDescription("v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0")

		explained := pe.Explain()

		require.NotEqual(t, 0, len(explained.Errors))
		require.Equal(t, 0, len(explained.Warnings))
		require.Equal(t, 0, len(explained.Suggestions))
	})
}

func Test_Missing_Description(t *testing.T) {
	t.Run("Local", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetRemoteDescription(`A`)
		for _, w := range pe.Explain().Warnings {
			require.NotEqual(t, w.Message, warnRemoteDescriptionUnset)
		}
	})

	t.Run("Remote", func(t *testing.T) {
		pe := NewPeerConnectionExplainer()

		pe.SetLocalDescription(`B`)
		for _, w := range pe.Explain().Warnings {
			require.NotEqual(t, w.Message, warnLocalDescriptionUnset)
		}
	})
}

func Test_Conflicting_Type(t *testing.T) {
	pe := NewPeerConnectionExplainer()

	pe.SetRemoteDescription(`{"type": "offer", "sdp": "Foobar"}`)
	pe.SetLocalDescription(`{"type": "offer", "sdp": "Foobar"}`)

	require.Equal(t, pe.Explain().Errors[0].Message, errLocalAndRemoteSameType)
}

func Test_Unescape(t *testing.T) {
	require.Equal(t, generateSessionDescription(`{"type": "offer", "sdp": "Foo\r\nBar"}`).SDP, "Foo\nBar")
}
