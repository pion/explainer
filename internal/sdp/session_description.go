// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

// Package sdp pravides a rfc8866 parser
package sdp

import "strings"

// ValueWithLine contains a value and the line it was found in the source.
type ValueWithLine struct {
	Value string
	Line  int
}

// SessionDescription is a a well-defined format for conveying sufficient
// information to discover and participate in a multimedia session.
type SessionDescription struct {
	// ProtocolVersion gives the version of the Session Description Protocol
	// https://tools.ietf.org/html/rfc4566#section-5.1
	ProtocolVersion int

	// Origin gives the originator of the session in the form of
	// o=<username> <sess-id> <sess-version> <nettype> <addrtype> <unicast-address>
	// https://tools.ietf.org/html/rfc4566#section-5.2
	Origin ValueWithLine

	// SessionName is the textual session name. There MUST be one and only one
	// only one "s=" field per session description
	// https://tools.ietf.org/html/rfc4566#section-5.3
	SessionName ValueWithLine

	// SessionInformation field provides textual information about the session.  There
	// MUST be at most one session-level SessionInformation field per session description,
	// and at most one SessionInformation field per media
	// https://tools.ietf.org/html/rfc4566#section-5.4
	SessionInformation ValueWithLine

	// URI is a pointer to additional information about the
	// session.  This field is OPTIONAL, but if it is present it MUST be
	// specified before the first media field.  No more than one URI field
	// is allowed per session description.
	// https://tools.ietf.org/html/rfc4566#section-5.5
	URI ValueWithLine

	// EmailAddress specifies the email for the person responsible for the conference
	// https://tools.ietf.org/html/rfc4566#section-5.6
	EmailAddress ValueWithLine

	// PhoneNumber specifies the phone number for the person responsible for the conference
	// https://tools.ietf.org/html/rfc4566#section-5.6
	PhoneNumber ValueWithLine

	// ConnectionData a session description MUST contain either at least one ConnectionData field in
	// each media description or a single ConnectionData field at the session level.
	// https://tools.ietf.org/html/rfc4566#section-5.7
	ConnectionData ValueWithLine

	// Bandwidth field denotes the proposed bandwidth to be used by the
	// session or media
	// b=<bwtype>:<bandwidth>
	// https://tools.ietf.org/html/rfc4566#section-5.8
	Bandwidth []ValueWithLine

	// Timing lines specify the start and stop times for a session.
	// t=<start-time> <stop-time>
	// https://tools.ietf.org/html/rfc4566#section-5.9
	Timing []ValueWithLine

	// RepeatTimes specify repeat times for a session
	// r=<repeat interval> <active duration> <offsets from start-time>
	// https://tools.ietf.org/html/rfc4566#section-5.10
	RepeatTimes []ValueWithLine

	// TimeZones schedule a repeated session that spans a change from daylight
	// z=<adjustment time> <offset> <adjustment time> <offset>
	// https://tools.ietf.org/html/rfc4566#section-5.11
	TimeZones []ValueWithLine

	// EncryptionKeys if for when the SessionDescription is transported over a secure and trusted channel,
	// the Session Description Protocol MAY be used to convey encryption keys
	// https://tools.ietf.org/html/rfc4566#section-5.11
	EncryptionKeys []ValueWithLine

	// Attributes are the primary means for extending SDP.  Attributes may
	// be defined to be used as "session-level" attributes, "media-level"
	// attributes, or both.
	// https://tools.ietf.org/html/rfc4566#section-5.12
	Attributes []ValueWithLine

	// MediaDescriptions A session description may contain a number of media descriptions.
	// Each media description starts with an "m=" field and is terminated by
	// either the next "m=" field or by the end of the session description.
	// https://tools.ietf.org/html/rfc4566#section-5.13
	MediaDescriptions []*MediaDescription
}

// Reset cleans the SessionDescription, and sets all fields back to their default values.
func (s *SessionDescription) Reset() {
	s.ProtocolVersion = 0
	s.Origin = ValueWithLine{}
	s.SessionName = ValueWithLine{}
	s.SessionInformation = ValueWithLine{}
	s.URI = ValueWithLine{}
	s.EmailAddress = ValueWithLine{}
	s.PhoneNumber = ValueWithLine{}
	s.ConnectionData = ValueWithLine{}
	s.Bandwidth = nil
	s.Timing = nil
	s.RepeatTimes = nil
	s.TimeZones = nil
	s.EncryptionKeys = nil
	s.Attributes = nil
	s.MediaDescriptions = nil
}

// ScanForAttribute searches for attributes with a given prefix.
func (s *SessionDescription) ScanForAttribute(prefix string, _, _ bool) (rtrn []ValueWithLine) {
	for _, a := range s.Attributes {
		if strings.HasPrefix(a.Value, prefix) {
			rtrn = append(rtrn, a)
		}
	}

	for _, m := range s.MediaDescriptions {
		for _, a := range m.Attributes {
			if strings.HasPrefix(a.Value, prefix) {
				rtrn = append(rtrn, a)
			}
		}
	}

	return
}
