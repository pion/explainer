// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

// Package output contains structure that are returned by Explainers
package output

import "bytes"

// Message contains a string description and the sources that caused it to be generated.
type Message struct {
	Message string   `json:"message"`
	Sources []Source `json:"source"`
}

// NewMessage creates a Message and handles nil Sources.
func NewMessage(message string, sources []Source) Message {
	if sources == nil {
		sources = make([]Source, 0)
	}

	return Message{message, sources}
}

// Source is the file that caused this message to be generated.
type Source struct {
	Type SourceType `json:"type"`
	Line int        `json:"line"`
}

// SourceType communicates if the source is from the local or remote description.
type SourceType int

func (s SourceType) String() string {
	switch s {
	case SourceTypeLocal:
		return "local"
	case SourceTypeRemote:
		return "remote"
	default:
		return ""
	}
}

// MarshalJSON marshals the enum as a quoted json string.
func (s SourceType) MarshalJSON() ([]byte, error) {
	buffer := bytes.NewBufferString(`"`)
	buffer.WriteString(s.String())
	buffer.WriteString(`"`)

	return buffer.Bytes(), nil
}

// Constants.
const (
	SourceTypeLocal SourceType = iota + 1
	SourceTypeRemote
)
