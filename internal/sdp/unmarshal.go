package sdp

import (
	"bufio"
	"strconv"
	"strings"

	"github.com/pion/explainer/pkg/output"
)

// Unmarshal populates a SessionDescription from a raw string
//
// Some lines in each description are REQUIRED and some are OPTIONAL,
// but all MUST appear in exactly the order given here (the fixed order
// greatly enhances error detection and allows for a simple parser).
// OPTIONAL items are marked with a "*".
// v=  (protocol version)
// o=  (originator and session identifier)
// s=  (session name)
// i=* (session information)
// u=* (URI of description)
// e=* (email address)
// p=* (phone number)
// c=* (connection information -- not required if included in all media)
// b=* (zero or more bandwidth information lines)
// t=* (One or more time descriptions)
// r=* (One or more repeat descriptions)
// z=* (time zone adjustments)
// k=* (encryption key)
// a=* (zero or more session attribute lines)
// Zero or more media descriptions
// https://tools.ietf.org/html/rfc4566#section-5
func (s *SessionDescription) Unmarshal(raw string) output.Message {
	s.Reset()
	scanner := &sdpScanner{bufio.NewScanner(strings.NewReader(raw)), 0}
	var err error

	// v=
	key, value, scanStatus, m := scanner.nextLine()
	if m.Message != "" {
		return m
	} else if !scanStatus {
		return scanner.messageForLine(errEarlyEndVersion)
	} else if key != "v" {
		return scanner.messageForLine(errProtocolVersionNotFound)
	} else if s.ProtocolVersion, err = strconv.Atoi(value); err != nil {
		return scanner.messageForLine(errInvalidProtocolVersion)
	}

	// o=
	key, value, scanStatus, m = scanner.nextLine()
	switch {
	case m.Message != "":
		return m
	case !scanStatus:
		return scanner.messageForLine(errEarlyEndOriginator)
	case key != "o":
		return scanner.messageForLine(errOriginatorNotFound)
	}
	s.Origin = value

	// s=
	key, value, scanStatus, m = scanner.nextLine()
	switch {
	case err != nil:
	case m.Message != "":
		return m
	case !scanStatus:
		return scanner.messageForLine(errEarlyEndSessionName)
	case key != "s":
		return scanner.messageForLine(errSessionNameNotFound)
	}
	s.SessionName = value

	return s.unmarshalOptionalAttributes(scanner)
}

func (s *SessionDescription) unmarshalOptionalAttributes(scanner *sdpScanner) output.Message {
	orderedSessionAttributes := []*attributeStatus{
		{value: "v"},
		{value: "o"},
		{value: "s"},
		{value: "i"},
		{value: "u"},
		{value: "e"},
		{value: "p"},
		{value: "c"},
		{value: "b", allowMultiple: true},
		{value: "t", allowMultiple: true},
		{value: "r", allowMultiple: true},
		{value: "z", allowMultiple: true},
		{value: "k", allowMultiple: true},
		{value: "a", allowMultiple: true},
		{value: "m", allowMultiple: true},
	}

	for {
		key, value, scanStatus, m := scanner.nextLine()
		if m.Message != "" || !scanStatus {
			return m
		}

		if m = scanner.attributeValid(orderedSessionAttributes, key); m.Message != "" {
			return m
		}

		switch key {
		case "i":
			s.SessionInformation = value
		case "u":
			s.URI = value
		case "e":
			s.EmailAddress = value
		case "p":
			s.PhoneNumber = value
		case "c":
			s.ConnectionData = value
		case "b":
			s.Bandwidth = append(s.Bandwidth, value)
		case "t":
			s.Timing = append(s.Timing, value)
		case "r":
			s.RepeatTimes = append(s.RepeatTimes, value)
		case "z":
			s.TimeZones = append(s.TimeZones, value)
		case "k":
			s.EncryptionKeys = append(s.EncryptionKeys, value)
		case "a":
			s.Attributes = append(s.Attributes, value)
		case "m":
			return s.unmarshalMedias(scanner, value)
		default:
			return scanner.messageForLine(errInvalidSessionAttribute + key)
		}
	}
}

func (s *SessionDescription) unmarshalMedias(scanner *sdpScanner, firstMediaName string) output.Message {
	currentMedia := &MediaDescription{MediaName: firstMediaName}
	orderedMediaAttributes := []*attributeStatus{
		{value: "i"},
		{value: "c"},
		{value: "b", allowMultiple: true},
		{value: "k", allowMultiple: true},
		{value: "a", allowMultiple: true},
	}
	resetMediaAttributes := func() {
		for _, v := range orderedMediaAttributes {
			v.line = 0
		}
	}

	for {
		key, value, scanStatus, m := scanner.nextLine()
		if m.Message != "" || !scanStatus { // This handles EOF, finish current MediaDescription
			s.MediaDescriptions = append(s.MediaDescriptions, currentMedia)
			return m
		}

		if m = scanner.attributeValid(orderedMediaAttributes, key); m.Message != "" {
			return m
		}

		switch key {
		case "m":
			s.MediaDescriptions = append(s.MediaDescriptions, currentMedia)
			resetMediaAttributes()
			currentMedia = &MediaDescription{MediaName: value}
		case "i":
			currentMedia.MediaInformation = value
		case "c":
			currentMedia.ConnectionData = value
		case "b":
			currentMedia.Bandwidth = append(currentMedia.Bandwidth, value)
		case "k":
			currentMedia.EncryptionKeys = append(currentMedia.EncryptionKeys, value)
		case "a":
			currentMedia.Attributes = append(currentMedia.Attributes, value)
		default:
			return scanner.messageForLine("Invalid media attribute: " + key)
		}
	}
}
