// Package output contains structure that are returned by Explainers
package output

// Message contains a string description and the sources that caused it to be generated
type Message struct {
	Message string   `json:"message"`
	Sources []Source `json:"source"`
}

// Source is the file that caused this message to be generated
type Source struct {
	Type string `json:"type"`
	Line int    `json:"line"`
}
