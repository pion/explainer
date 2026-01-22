// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package sdp

import (
	"testing"

	"github.com/pion/explainer/pkg/output"
	"github.com/stretchr/testify/require"
)

// Assert that we have v, o, s.
func Test_GlobalValues(t *testing.T) {
	descr := SessionDescription{}

	t.Run("v", func(t *testing.T) {
		// No value
		require.Equal(t, descr.Unmarshal(""), output.NewMessage(errEarlyEndVersion, []output.Source{{Line: 0}}))

		// Wrong key
		require.Equal(t, descr.Unmarshal("a=b"), output.NewMessage(errProtocolVersionNotFound, []output.Source{{Line: 0}}))

		// Invalid value
		require.Equal(t, descr.Unmarshal("v=b"), output.NewMessage(errInvalidProtocolVersion, []output.Source{{Line: 0}}))
	})

	t.Run("o", func(t *testing.T) {
		// No value
		require.Equal(t, descr.Unmarshal("v=2\r\n"), output.NewMessage(errEarlyEndOriginator, []output.Source{{Line: 1}}))

		// Wrong key
		require.Equal(t, descr.Unmarshal("v=2\r\na=b"), output.NewMessage(errOriginatorNotFound, []output.Source{{Line: 1}}))
	})

	t.Run("s", func(t *testing.T) {
		// No value
		require.Equal(t, descr.Unmarshal("v=2\r\no=o"), output.NewMessage(errEarlyEndSessionName, []output.Source{{Line: 2}}))

		// Wrong key
		require.Equal(t,
			descr.Unmarshal("v=2\r\no=o\r\na=b"),
			output.NewMessage(errSessionNameNotFound, []output.Source{{Line: 2}}),
		)
	})
}

func Test_LineParsing(t *testing.T) {
	s := SessionDescription{}

	require.Equal(t, s.Unmarshal("a="), output.NewMessage(errShortLine, []output.Source{{Line: 0}}))
	require.Equal(t, s.Unmarshal("a!b"), output.NewMessage(errInvalidLine, []output.Source{{Line: 0}}))
}
