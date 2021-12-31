package peerconnection_explainer //nolint golint

// Result is the current status of the PeerConnectionExplainer
type Result struct {
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
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
