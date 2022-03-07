// Package result contains the structured data returned to callers
package result

var (
	errNoIceUserFragment          = "No ICE Username Fragment Found"
	errConflictingIceUserFragment = "Conflicting ICE Username Fragments Found"
	errInvalidIceUserFragment     = "ICE User Fragment Found, but is invalid value"
	errShortIceUserFragment       = "ICE User Fragment Found, but is not long enough"

	errNoIcePassword          = "No ICE Password Found"
	errConflictingIcePassword = "Conflicting ICE Password Found"
	errInvalidIcePassword     = "ICE Password Found, but is invalid value"
	errShortIcePassword       = "ICE Password Found, but is not long enough"
)
