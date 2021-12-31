package peerconnection_explainer

// Result is the current status of the PeerConnectionExplainer
type Result struct {
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
}
