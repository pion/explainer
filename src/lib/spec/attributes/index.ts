// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
//
// SPDX-License-Identifier: MIT

import type { Details } from '../../types';
import { ice } from './ice';
import { rtp } from './rtp';
import { security } from './security';
import { session } from './session';
import { streams } from './streams';

/**
 * Every "a=" attribute the explainer documents, keyed by the name before the
 * colon. The IANA registry holds hundreds more; anything missing falls back to
 * the generic attribute entry in spec/fields.ts.
 */
export const attributes: Record<string, Details> = {
	...ice,
	...security,
	...rtp,
	...streams,
	...session
};
