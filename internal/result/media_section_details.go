// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package result

import "github.com/pion/explainer/pkg/output"

// MediaSectionDetails contains the details of
// a single MediaSection
//go:generate json-ice --type=MediaSectionDetails
type MediaSectionDetails struct {
	// ID is commonly referred to as MID
	ID output.Message `json:"id"`

	// Audio or Video
	Type output.Message `json:"type"`

	// Transeiver Direction. Can be sendrecv, sendonly, recvonly or disabled
	Direction output.Message `json:"direction"`

	MediaFormats []MediaFormatDetails `json:"mediaFormats"`
}

// MarshalJSON returns the JSON encoding of this object
func (m *MediaSectionDetails) MarshalJSON() ([]byte, error) {
	return MarshalMediaSectionDetailsAsJSON(m)
}
