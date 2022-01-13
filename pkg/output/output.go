// Package output contains structure that are returned by Explainers
package output

// Message contains a string description and the sources that caused it to be generated
type Message struct {
	Message string   `json:"message"`
	Sources []Source `json:"source"`
}

// NewMessage creates a Message and handles nil Sources
func NewMessage(message string, sources []Source) Message {
	if sources == nil {
		sources = make([]Source, 0)
	}

	return Message{message, sources}
}

// Source is the file that caused this message to be generated
type Source struct {
	Type string `json:"type"`
	Line int    `json:"line"`
}
