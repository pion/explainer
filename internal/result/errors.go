// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

// Package result contains the structured data returned to callers
package result

//nolint:gochecknoglobals
var (
	errNoIceUserFragment          = "No ICE Username Fragment Found"
	errConflictingIceUserFragment = "Conflicting ICE Username Fragments Found"
	errInvalidIceUserFragment     = "ICE User Fragment Found, but is invalid value"
	errShortIceUserFragment       = "ICE User Fragment Found, but is not long enough"

	errNoIcePassword          = "No ICE Password Found"
	errConflictingIcePassword = "Conflicting ICE Password Found"
	errInvalidIcePassword     = "ICE Password Found, but is invalid value"
	errShortIcePassword       = "ICE Password Found, but is not long enough"

	errNoCertificateFingerprint               = "No Certificate Fingerprint Found"
	errConflictingCertificateFingerprints     = "Conflicting Certificate Fingerprints Found"
	errMissingSeperatorCertificateFingerprint = "Certificate Fingerprint was found, but did not contain two values separated by a space"
	errInvalidHexCertificateFingerprint       = "Certificate Fingerprint was found, but did not contain a valid hex value for certificate"
)
