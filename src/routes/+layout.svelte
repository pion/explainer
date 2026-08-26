<!--
SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>

SPDX-License-Identifier: MIT
-->

<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>SDP Explainer - Pion</title>
	<!-- Served from static/ so the paths stay stable for browsers and crawlers. -->
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>
{@render children()}
