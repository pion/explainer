// Package output contains structure that are returned by Explainers
package output

import "bytes"

// Message contains a string description and the sources that caused it to be generated
//go:generate json-ice --type=Message
type Message struct {
	Message string   `json:"message"`
	Sources []Source `json:"source"`
}

// MarshalJSON returns the JSON encoding of this object
func (m *Message) MarshalJSON() ([]byte, error) {
	return MarshalMessageAsJSON(m)
}

// NewMessage creates a Message and handles nil Sources
func NewMessage(message string, sources []Source) Message {
	if sources == nil {
		sources = make([]Source, 0)
	}

	return Message{message, sources}
}

// Source is the file that caused this message to be generated
//go:generate json-ice --type=Source
type Source struct {
	Type SourceType `json:"type"`
	Line int        `json:"line"`
}

// MarshalJSON returns the JSON encoding of this object
func (s *Source) MarshalJSON() ([]byte, error) {
	return MarshalSourceAsJSON(s)
}

// SourceType communicates if the source is from the local or remote description
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

// MarshalJSON marshals the enum as a quoted json string
func (s SourceType) MarshalJSON() ([]byte, error) {
	buffer := bytes.NewBufferString(`"`)
	buffer.WriteString(s.String())
	buffer.WriteString(`"`)
	return buffer.Bytes(), nil
}

// Constants
const (
	SourceTypeLocal SourceType = iota + 1
	SourceTypeRemote
)
