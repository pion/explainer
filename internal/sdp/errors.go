// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package sdp

//nolint:gochecknoglobals
var (
	errProtocolVersionNotFound = "v (protocol version) was expected, but not found"
	errOriginatorNotFound      = "o (originator and session identifier) was expected, but not found"
	errSessionNameNotFound     = "s (session name) was expected, but not found"

	errEarlyEndVersion     = "session description ended before version could be found"
	errEarlyEndOriginator  = "session description ended before originator could be found"
	errEarlyEndSessionName = "session description ended before session name could be found"

	errInvalidProtocolVersion = "Failed to take protocol version to int"

	errShortLine   = "line is not long enough to contain both a key and value"
	errInvalidLine = "line is not a proper key value pair, second character is not `=`"

	errInvalidSessionAttribute = "invalid session attribute: "
)
