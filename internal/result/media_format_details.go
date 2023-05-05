// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

package result

import "github.com/pion/explainer/pkg/output"

// MediaFormatDetails contains the details of
// a single MediaFormat
type MediaFormatDetails struct {
	PayloadType output.Message `json:"payloadType"`

	FormatSpecificParamaters output.Message `json:"formatSpecificParamaters"`
}
