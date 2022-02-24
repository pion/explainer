package result

// SessionDetails is the combination of the Offer/Answer and what the actual state
// of the WebRTC session is.
//go:generate json-ice --type=SessionDetails
type SessionDetails struct {
}

// MarshalJSON returns the JSON encoding of this object
func (s *SessionDetails) MarshalJSON() ([]byte, error) {
	return MarshalSessionDetailsAsJSON(s)
}
