// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
