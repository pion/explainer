package peerconnection_explainer

// Result is the current status of the PeerConnectionExplainer
type Result struct {
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
}

var (
	errLocalAndRemoteSameType = "local and remote description are the same type"
)

var (
	warnLocalDescriptionUnset  = "local description has not been set, full analysis not available"
	warnRemoteDescriptionUnset = "remote description has not been set, full analysis not available"
)
