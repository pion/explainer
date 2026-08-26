// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'sdp-explainer-theme';

const createTheme = () => {
	let current = $state<Theme>('dark');

	return {
		get current() {
			return current;
		},

		/** Adopts whatever the bootstrap script in app.html resolved before paint. */
		hydrate() {
			current = document.documentElement.style.colorScheme === 'light' ? 'light' : 'dark';
		},

		toggle() {
			current = current === 'dark' ? 'light' : 'dark';

			// Every colour in the stylesheet is a light-dark() pair, so setting the
			// scheme on :root is the whole theme switch.
			document.documentElement.style.colorScheme = current;

			try {
				localStorage.setItem(THEME_KEY, current);
			} catch {
				// Storage blocked (private mode): the choice simply will not persist.
			}
		}
	};
};

export const theme = createTheme();
