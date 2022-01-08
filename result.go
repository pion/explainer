package explainer

// PeerDetails contains the details published by a single peer. This is what
// a single peer Offered or Answered
type PeerDetails struct {
}

// SessionDetails is the combination of the Offer/Answer and what the actual state
// of the WebRTC session is.
type SessionDetails struct {
}

// Result is the current status of the PeerConnectionExplainer
type Result struct {
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`

	LocalDetails  PeerDetails `json:"localDetails"`
	RemoteDetails PeerDetails `json:"remoteDetails"`

	SessionDetails SessionDetails `json:"sessionDetails"`
}

func (r *Result) init() {
	r.Warnings = make([]string, 0)
	r.Errors = make([]string, 0)
	r.Suggestions = make([]string, 0)
}

//nolint golint
var (
	errLocalAndRemoteSameType = "local and remote description are the same type"

	warnLocalDescriptionUnset  = "local description has not been set, full analysis not available"
	warnRemoteDescriptionUnset = "remote description has not been set, full analysis not available"
)
