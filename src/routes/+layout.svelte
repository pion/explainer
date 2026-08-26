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

	<meta property="og:site_name" content="Pion" />
	<meta property="og:title" content="SDP Explainer" />
	<meta property="og:type" content="website" />
	<meta name="description" content="An interactive explainer for WebRTC SDP." />
	<meta property="og:description" content="An interactive explainer for WebRTC SDP." />
	<meta property="og:image" content="https://explainer.pion.ly/showcase.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="og:url" content="https://explainer.pion.ly/" />

	<!-- Served from static/ so the paths stay stable for browsers and crawlers. -->
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>
{@render children()}
