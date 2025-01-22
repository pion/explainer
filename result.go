// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package explainer

import (
	"github.com/pion/explainer/internal/result"
	"github.com/pion/explainer/pkg/output"
)

// PeerDetails contains the details published by a single peer. This is what
// a single peer Offered or Answered.
type PeerDetails = result.PeerDetails

// SessionDetails is the combination of the Offer/Answer and what the actual state
// of the WebRTC session is.
type SessionDetails = result.SessionDetails

// Result is the current status of the PeerConnectionExplainer.
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

func setSourcesType(messages []output.Message, sourceType output.SourceType) {
	for _, m := range messages {
		if len(m.Sources) == 0 {
			m.Sources = []output.Source{{}}
		}
		for _, s := range m.Sources {
			s.Type = sourceType
		}
	}
}

// nolint golint
var (
	errLocalAndRemoteSameType = "local and remote description are the same type"

	warnLocalDescriptionUnset  = "local description has not been set, full analysis not available"
	warnRemoteDescriptionUnset = "remote description has not been set, full analysis not available"
)
