package explainer

import "github.com/pion/explainer/pkg/output"

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
	Errors      []output.Message `json:"errors"`
	Warnings    []output.Message `json:"warnings"`
	Suggestions []output.Message `json:"suggestions"`

	LocalDetails  PeerDetails `json:"localDetails"`
	RemoteDetails PeerDetails `json:"remoteDetails"`

	SessionDetails SessionDetails `json:"sessionDetails"`
}

func (r *Result) init() {
	r.Warnings = make([]output.Message, 0)
	r.Errors = make([]output.Message, 0)
	r.Suggestions = make([]output.Message, 0)
}

//nolint golint
var (
	errLocalAndRemoteSameType = "local and remote description are the same type"

	warnLocalDescriptionUnset  = "local description has not been set, full analysis not available"
	warnRemoteDescriptionUnset = "remote description has not been set, full analysis not available"
)
