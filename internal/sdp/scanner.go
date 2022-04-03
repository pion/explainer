package sdp

import (
	"bufio"

	"github.com/pion/explainer/pkg/output"
)

type sdpScanner struct {
	scanner     *bufio.Scanner
	currentLine int
}

func (s *sdpScanner) messageForLine(message string) output.Message {
	return output.NewMessage(
		message,
		[]output.Source{{Line: s.currentLine}},
	)
}

func (s *sdpScanner) messageForError(err error) output.Message {
	if err == nil {
		return output.Message{}
	}
	return s.messageForLine(err.Error())
}

func (s *sdpScanner) nextLine() (key, value string, scanStatus bool, message output.Message) {
	s.currentLine++
	if scanStatus = s.scanner.Scan(); !scanStatus {
		return key, value, scanStatus, s.messageForError(s.scanner.Err())
	}

	if len(s.scanner.Text()) < 3 {
		return key, value, scanStatus, s.messageForLine(errShortLine)
	} else if s.scanner.Text()[1] != '=' {
		return key, value, scanStatus, s.messageForLine(errInvalidLine)
	}

	return string(s.scanner.Text()[0]), s.scanner.Text()[2:], scanStatus, output.Message{}
}

type attributeStatus struct {
	line          int
	value         string
	allowMultiple bool
}

// Detect if the current attribute is ok to be read (detect out of order errors)
// or if it has already been set
func (s *sdpScanner) attributeValid(statuses []*attributeStatus, attribute string) output.Message {
	attrFound := false
	for _, v := range statuses {
		if attrFound && v.line != 0 {
			return s.messageForLine("Attribute " + attribute + " was found, but later attribute " + v.value + " has already been set")
		}

		if v.value == attribute {
			if v.line != 0 && !v.allowMultiple {
				return s.messageForLine("Attribute " + attribute + " was attempted to be set twice: " + v.value)
			}
			attrFound = true
			v.line = s.currentLine
		}
	}
	return output.Message{}
}
