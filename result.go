package explainer

// ResultPeerDetails contains the details published by a single peer. This is what
// a single peer Offered or Answered
type ResultPeerDetails struct {
}

// ResultSessionDetails is the combination of the Offer/Answer and what the actual state
// of the WebRTC session is.
type ResultSessionDetails struct {
}

// Result is the current status of the PeerConnectionExplainer
type Result struct {
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`

	LocalDetails  ResultPeerDetails `json:"localDetails"`
	RemoteDetails ResultPeerDetails `json:"remoteDetails"`

	SessionDetails ResultSessionDetails `json:"sessionDetails"`
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
