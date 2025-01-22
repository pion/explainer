// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

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
func (s *SessionDescription) Unmarshal(raw string) output.Message { //nolint:cyclop
	s.Reset()
	scanner := &sdpScanner{bufio.NewScanner(strings.NewReader(raw)), -1}
	var err error

	// v=
	key, value, scanStatus, msg := scanner.nextLine()
	if msg.Message != "" {
		return msg
	} else if !scanStatus {
		return scanner.messageForLine(errEarlyEndVersion)
	} else if key != "v" {
		return scanner.messageForLine(errProtocolVersionNotFound)
	} else if s.ProtocolVersion, err = strconv.Atoi(value); err != nil {
		return scanner.messageForLine(errInvalidProtocolVersion)
	}

	// o=
	key, value, scanStatus, msg = scanner.nextLine()
	switch {
	case msg.Message != "":
		return msg
	case !scanStatus:
		return scanner.messageForLine(errEarlyEndOriginator)
	case key != "o":
		return scanner.messageForLine(errOriginatorNotFound)
	}
	s.Origin = ValueWithLine{value, scanner.currentLine}

	// s=
	key, value, scanStatus, msg = scanner.nextLine()
	switch {
	case err != nil:
	case msg.Message != "":
		return msg
	case !scanStatus:
		return scanner.messageForLine(errEarlyEndSessionName)
	case key != "s":
		return scanner.messageForLine(errSessionNameNotFound)
	}
	s.SessionName = ValueWithLine{value, scanner.currentLine}

	return s.unmarshalOptionalAttributes(scanner)
}

func (s *SessionDescription) unmarshalOptionalAttributes(scanner *sdpScanner) output.Message { //nolint:cyclop
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
			s.SessionInformation = ValueWithLine{value, scanner.currentLine}
		case "u":
			s.URI = ValueWithLine{value, scanner.currentLine}
		case "e":
			s.EmailAddress = ValueWithLine{value, scanner.currentLine}
		case "p":
			s.PhoneNumber = ValueWithLine{value, scanner.currentLine}
		case "c":
			s.ConnectionData = ValueWithLine{value, scanner.currentLine}
		case "b":
			s.Bandwidth = append(s.Bandwidth, ValueWithLine{value, scanner.currentLine})
		case "t":
			s.Timing = append(s.Timing, ValueWithLine{value, scanner.currentLine})
		case "r":
			s.RepeatTimes = append(s.RepeatTimes, ValueWithLine{value, scanner.currentLine})
		case "z":
			s.TimeZones = append(s.TimeZones, ValueWithLine{value, scanner.currentLine})
		case "k":
			s.EncryptionKeys = append(s.EncryptionKeys, ValueWithLine{value, scanner.currentLine})
		case "a":
			s.Attributes = append(s.Attributes, ValueWithLine{value, scanner.currentLine})
		case "m":
			return s.unmarshalMedias(scanner, value)
		default:
			return scanner.messageForLine(errInvalidSessionAttribute + key)
		}
	}
}

//nolint:cyclop
func (s *SessionDescription) unmarshalMedias(scanner *sdpScanner, firstMediaName string) output.Message {
	currentMedia := &MediaDescription{MediaName: ValueWithLine{firstMediaName, scanner.currentLine}}
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
			currentMedia = &MediaDescription{MediaName: ValueWithLine{value, scanner.currentLine}}
		case "i":
			currentMedia.MediaInformation = ValueWithLine{value, scanner.currentLine}
		case "c":
			currentMedia.ConnectionData = ValueWithLine{value, scanner.currentLine}
		case "b":
			currentMedia.Bandwidth = append(currentMedia.Bandwidth, ValueWithLine{value, scanner.currentLine})
		case "k":
			currentMedia.EncryptionKeys = append(currentMedia.EncryptionKeys, ValueWithLine{value, scanner.currentLine})
		case "a":
			currentMedia.Attributes = append(currentMedia.Attributes, ValueWithLine{value, scanner.currentLine})
		default:
			return scanner.messageForLine("Invalid media attribute: " + key)
		}
	}
}
