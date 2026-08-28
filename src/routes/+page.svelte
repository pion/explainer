<!--
SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>

SPDX-License-Identifier: MIT
-->

<script lang="ts">
	import pionLogo from '$lib/assets/pion-logo.svg?raw';
	import { syntaxParts } from '$lib/grammar';
	import { markdown } from '$lib/markdown';
	import { locate, outlineOf, parseSDP } from '$lib/parser';
	import { exampleSDP } from '$lib/spec';
	import { theme } from '$lib/theme.svelte';
	import type { SDPLocation, SDPPart } from '$lib/types';
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';

	let editorEl = $state<HTMLTextAreaElement>();
	let ghostEl = $state<HTMLDivElement>();
	let rowsEl = $state<HTMLDivElement>();
	let viewportEl = $state<HTMLDivElement>();

	// The section marker is drawn outside the scrolling overlay, so it has to be
	// offset by hand to stay level with the lines it spans.
	let scrollTop = $state(0);

	// Row geometry, read back from the CSS both layers already share rather than
	// repeated here, so the overlay cannot drift out of step with the text.
	let lineHeight = $state(24);
	let padding = $state(0);
	let ghostHeight = $state(0);

	// Rows built above and below the visible ones, so a scroll has something to
	// show before the next render catches up.
	const OVERSCAN = 8;

	let sdpText = $state(exampleSDP);
	let caret = $state(0);
	let hover = $state<SDPLocation | null>(null);
	let pointer: { x: number; y: number } | null = null;

	// The keyboard (and clicking, which places the caret just as deliberately)
	// takes the lead as soon as it is used, so the caret does not fight a
	// pointer that is only resting somewhere over the editor. Moving the mouse
	// again hands control back to hover.
	let usingKeyboard = $state(false);

	let lines = $derived(parseSDP(sdpText));
	let outline = $derived(outlineOf(lines));

	// Wide enough for the highest line number there is. Left as a `ch` expression
	// rather than measured back in pixels, so the column the numbers sit in and
	// the edge the text starts at are the same fractional width, not two roundings
	// of it.
	let digits = $derived(String(lines.length).length);

	// The editor never wraps and every line is one row of a known height, so
	// which rows are on screen is arithmetic rather than something to measure.
	// Only those are built: a description of ten thousand lines costs the same
	// to render as one of fifty, and the spans the overlay does build are few
	// enough that re-styling them all as the pointer moves stays free.
	let firstRow = $derived(Math.max(0, Math.floor((scrollTop - padding) / lineHeight) - OVERSCAN));
	let rowCount = $derived(Math.ceil(ghostHeight / lineHeight) + OVERSCAN * 2 + 1);
	let rows = $derived(lines.slice(firstRow, firstRow + rowCount));

	// The numbers standing against those rows, one-based the way an editor counts.
	let numbers = $derived(Array.from({ length: rows.length }, (_, r) => firstRow + r + 1));
	let active = $derived((usingKeyboard ? null : hover) ?? locate(lines, caret));

	// Where the caret sits, independent of whatever the mouse is doing. This
	// stays highlighted even while hover is pointing somewhere else entirely.
	let caretLocation = $derived(locate(lines, caret));

	// The tooltip and details panel lag `active` by DEBOUNCE_MS, but only while
	// hover is what's driving it — a mouse sweeping across many tokens
	// shouldn't flicker either one. Deliberately placing the caret (clicking,
	// typing, arrow keys) updates them immediately.
	const DEBOUNCE_MS = 200;
	let debouncedActive = $state<SDPLocation | null>(null);
	let hoverDriven = $derived(!usingKeyboard && hover !== null);
	$effect(() => {
		const target = active;
		if (!hoverDriven) {
			debouncedActive = target;
			return;
		}
		const timer = setTimeout(() => (debouncedActive = target), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	});

	let activeLine = $derived(debouncedActive ? lines[debouncedActive.lineIndex] : null);
	let detail = $derived(activeLine?.details);

	let activeField = $derived(
		debouncedActive?.fieldIndex != null
			? (activeLine?.fields[debouncedActive.fieldIndex] ?? null)
			: null
	);
	let activeArgIndex = $derived(activeField?.argIndex ?? null);
	let activeArg = $derived(activeArgIndex !== null ? detail?.args[activeArgIndex] : undefined);

	// A documented value — "typ host", "setup:actpass" — is worth calling out on
	// its own, so the panel can explain the token rather than just its slot.
	let activeValue = $derived(
		activeArg?.values?.find(
			(value) => value.value.toLowerCase() === activeField?.text.toLowerCase()
		)
	);

	// The run of lines making up the media description the active line belongs to,
	// marked in the gutter so the block a line is read against is visible without
	// scanning upwards for the "m=" that opened it. Session-level lines are the
	// preamble rather than a section, so they get no marker.
	let sectionSpan = $derived.by(() => {
		const section = active ? lines[active.lineIndex]?.section : null;
		return section == null ? null : (outline.sections.get(section) ?? null);
	});

	// The line the band runs across. A blank line has nothing to mark, so it gets
	// no band even while the pointer is over it.
	let highlightRow = $derived(active && lines[active.lineIndex]?.content ? active.lineIndex : null);

	// Where this line sits, which is what decides whether "a=" lines are in scope.
	let placement = $derived(
		activeLine == null || activeLine.section === null
			? 'Session level'
			: `Media ${activeLine.section} · ${activeLine.sectionMedia ?? '?'}`
	);

	// Prefixed, so the two badges read as two facts — where the line is, and where
	// it is allowed to be — rather than as the same fact written twice.
	const LEVELS = {
		session: 'Allowed: session only',
		media: 'Allowed: media only',
		both: 'Allowed: session or media'
	};

	// SDP has no schema to validate against, so a line in the wrong half of the
	// description is silently ignored by the peer rather than rejected.
	let misplaced = $derived(
		detail?.level === 'session'
			? activeLine?.section !== null
			: detail?.level === 'media'
				? activeLine?.section === null
				: false
	);

	let syntax = $derived(detail ? syntaxParts(detail) : []);

	let tooltip = $derived(activeArg ? `<${activeArg.name}>` : detail?.title);
	// Kept in sync with the tooltip's CSS height so it can be placed before it renders.
	const TOOLTIP_HEIGHT = 26;

	let tooltipPos = $state({ x: 0, y: 0 });
	let showTooltip = $state(false);
	let focused = $state(false);

	const isActivePart = (lineIndex: number, part: SDPPart) => {
		if (active?.lineIndex !== lineIndex || part.kind === 'plain') return false;
		return part.kind === 'type'
			? active.fieldIndex === null
			: active.fieldIndex === part.fieldIndex;
	};

	const isCaretPart = (lineIndex: number, part: SDPPart) => {
		if (caretLocation?.lineIndex !== lineIndex || part.kind === 'plain') return false;
		return part.kind === 'type'
			? caretLocation.fieldIndex === null
			: caretLocation.fieldIndex === part.fieldIndex;
	};

	// Rows exist only for the slice of the document on screen, so a line's element
	// sits at its offset within that slice — and is simply absent once the line is
	// scrolled far enough out of view, which is exactly when nothing anchored to
	// it should be shown either.
	const lineElement = (lineIndex: number): Element | null =>
		rowsEl?.children[lineIndex - firstRow] ?? null;

	// Found by indexing straight into the DOM from `debouncedActive` rather than
	// querying for a marker attribute: the marker is written by the same render
	// pass that this effect can run ahead of, which left the tooltip measuring
	// last render's anchor. The span layout itself never lags — only classes do —
	// so indexing is safe the instant `debouncedActive` changes.
	const tooltipAnchorEl = (): Element | null => {
		if (!debouncedActive) return null;
		const { lineIndex, fieldIndex } = debouncedActive;

		const parts = lines[lineIndex]?.parts;
		const lineEl = lineElement(lineIndex);
		if (!parts || !lineEl) return null;

		const p = parts.findIndex(
			(part) =>
				part.kind !== 'plain' &&
				(part.kind === 'type' ? fieldIndex === null : part.fieldIndex === fieldIndex)
		);
		return p === -1 ? null : (lineEl.children[p] ?? null);
	};

	const partClass = (lineIndex: number, part: SDPPart) => {
		const highlighted = isActivePart(lineIndex, part);
		const isCaret = isCaretPart(lineIndex, part);
		return [
			part.kind === 'type' && 'text-token-type',
			part.kind === 'type' && (isCaret ? 'font-bold' : 'font-semibold'),
			part.kind === 'key' && 'text-token-key',
			part.kind === 'value' && 'text-token-value',
			(highlighted || isCaret) &&
				(part.kind === 'value' ? 'bg-token-value-wash' : 'bg-token-key-wash'),
			isCaret && part.kind !== 'type' && 'font-bold'
		];
	};

	// Extending a selection (Shift+arrow) leaves `selectionStart` pinned at the
	// fixed anchor — the end actually moving is whichever one `selectionEnd`
	// is when growing forward, `selectionStart` when growing backward. Reading
	// plain `selectionStart` while shift-selecting downward would keep tracking
	// the anchor's line instead of the one the selection is growing toward.
	const selectionFocus = (el: HTMLTextAreaElement) =>
		el.selectionDirection === 'backward' ? el.selectionStart : el.selectionEnd;

	const syncCaret = () => {
		if (editorEl) caret = selectionFocus(editorEl);
	};

	// How many lines of lookahead a keyboard-driven caret keeps between itself
	// and the edge of the viewport, so the next few lines it's heading toward
	// are already on screen rather than arriving one keystroke at a time.
	const SCROLL_MARGIN = 5;

	const applyScrollMargin = () => {
		if (!editorEl) return;

		const location = locate(lines, selectionFocus(editorEl));
		if (!location) return;

		// Capped at half the viewport, so a margin wider than the editor is
		// tall can't force the top and bottom checks to fight each other.
		const margin = Math.min(SCROLL_MARGIN * lineHeight, (editorEl.clientHeight - lineHeight) / 2);

		const caretTop = padding + location.lineIndex * lineHeight;
		const caretBottom = caretTop + lineHeight;

		const minScrollTop = caretBottom + margin - editorEl.clientHeight;
		const maxScrollTop = caretTop - margin;

		if (editorEl.scrollTop < minScrollTop) {
			editorEl.scrollTop = Math.min(minScrollTop, editorEl.scrollHeight - editorEl.clientHeight);
		} else if (editorEl.scrollTop > maxScrollTop) {
			editorEl.scrollTop = Math.max(0, maxScrollTop);
		}
	};

	/**
	 * Resolves a viewport point to a line and field. The textarea sits above the
	 * highlighted overlay and swallows pointer events, so the overlay cannot be
	 * hovered directly — its geometry is hit-tested by hand instead. Every line is
	 * the same height, which turns the vertical search into one division.
	 */
	const locatePoint = (x: number, y: number): SDPLocation | null => {
		if (!rowsEl) return null;

		// The rows begin at `firstRow` and are a fixed height, so one measurement
		// of where they start answers the vertical half outright.
		const top = rowsEl.getBoundingClientRect().top;
		const lineIndex = firstRow + Math.floor((y - top) / lineHeight);
		if (lineIndex < 0 || lineIndex >= lines.length) return null;

		const lineEl = lineElement(lineIndex);
		if (!lineEl) return null;

		// Parts are rendered one span each, so a span's position is its part's index.
		const parts = lines[lineIndex].parts;
		for (let p = 0; p < lineEl.children.length; p++) {
			const rect = lineEl.children[p].getBoundingClientRect();
			if (x < rect.left || x >= rect.right) continue;

			return { lineIndex, fieldIndex: parts[p]?.fieldIndex ?? null };
		}

		// Past the end of the line: still that line, just no particular field.
		return { lineIndex, fieldIndex: null };
	};

	const syncHover = () => {
		hover = pointer ? locatePoint(pointer.x, pointer.y) : null;
	};

	// mousemove fires several times per frame and every hit test reads layout back
	// out of the DOM, so the pointer is only recorded here and resolved once, just
	// before the frame that would show the result.
	let hoverFrame = 0;

	const onPointerMove = (event: MouseEvent) => {
		pointer = { x: event.clientX, y: event.clientY };
		usingKeyboard = false;

		if (hoverFrame) return;
		hoverFrame = requestAnimationFrame(() => {
			hoverFrame = 0;
			syncHover();
		});
	};

	const onPointerLeave = () => {
		pointer = null;
		hover = null;
	};

	// Scrolling moves the text under a stationary pointer and swaps out which rows
	// exist at all. Both the hit test and the tooltip anchor measure those rows, so
	// they have to wait for the new offset to render rather than read the old one.
	let syncPending = false;

	const syncAfterRender = () => {
		if (syncPending) return;
		syncPending = true;
		tick().then(() => {
			syncPending = false;
			syncHover();
			placeTooltip();
		});
	};

	// What the editor has to scroll through, which is everything the overlay
	// scrollbars are drawn from. Read back rather than derived, because the
	// textarea's own layout is the authority on how wide its longest line is.
	let view = $state({ top: 0, left: 0, scrollH: 0, scrollW: 0, clientH: 0, clientW: 0 });

	const readView = () => {
		if (!editorEl) return;

		view = {
			top: editorEl.scrollTop,
			left: editorEl.scrollLeft,
			scrollH: editorEl.scrollHeight,
			scrollW: editorEl.scrollWidth,
			clientH: editorEl.clientHeight,
			clientW: editorEl.clientWidth
		};
	};

	// Track lengths are measured rather than assumed, so the thumb arithmetic
	// never has to restate the thickness the stylesheet picked.
	let trackY = $state(0);
	let trackX = $state(0);

	// Shown only when there is something to scroll, and each track stops short of
	// the other so the two never meet in the corner.
	let showY = $derived(view.scrollH > view.clientH + 1);
	let showX = $derived(view.scrollW > view.clientW + 1);

	const MIN_THUMB = 24;

	const thumbFor = (offset: number, content: number, client: number, track: number) => {
		const range = content - client;
		if (range <= 1 || track <= 0) return null;

		const size = Math.max(MIN_THUMB, (client / content) * track);
		const travel = track - size;

		return { size, travel, range, pos: travel > 0 ? (offset / range) * travel : 0 };
	};

	let thumbY = $derived(thumbFor(view.top, view.scrollH, view.clientH, trackY));
	let thumbX = $derived(thumbFor(view.left, view.scrollW, view.clientW, trackX));

	const percent = (offset: number, content: number, client: number) =>
		content > client ? Math.round((offset / (content - client)) * 100) : 0;

	/**
	 * Drives the editor from its overlay scrollbar. Pressing the track jumps the
	 * thumb under the pointer and then keeps dragging from there, so a click and
	 * a drag are the same gesture. Everything else follows from the editor's own
	 * scroll event, exactly as it does for the wheel.
	 */
	const startDrag = (vertical: boolean) => (event: PointerEvent) => {
		const thumb = vertical ? thumbY : thumbX;
		const track = event.currentTarget as HTMLElement;
		if (!editorEl || !thumb) return;

		event.preventDefault();
		track.setPointerCapture(event.pointerId);

		const box = track.getBoundingClientRect();
		const along = (e: PointerEvent) => (vertical ? e.clientY - box.top : e.clientX - box.left);

		// Where on the thumb it was taken hold of; pressing the bare track centres
		// the thumb on the pointer instead.
		let grab = along(event) - thumb.pos;
		if (grab < 0 || grab > thumb.size) grab = thumb.size / 2;

		const to = (e: PointerEvent) => {
			const offset = thumb.travel > 0 ? ((along(e) - grab) / thumb.travel) * thumb.range : 0;
			if (vertical) editorEl!.scrollTop = offset;
			else editorEl!.scrollLeft = offset;
		};

		const stop = () => {
			track.removeEventListener('pointermove', to);
			track.removeEventListener('pointerup', stop);
			track.removeEventListener('pointercancel', stop);
		};

		to(event);
		track.addEventListener('pointermove', to);
		track.addEventListener('pointerup', stop);
		track.addEventListener('pointercancel', stop);
	};

	const syncScroll = () => {
		if (!ghostEl || !editorEl) return;

		// A <textarea>'s own text layout is native, not CSS boxes, so under a
		// fractional browser zoom it can round each line/character advance to a
		// slightly different device pixel than the plain overlay does. That
		// makes the two elements' total scrollable size drift apart by a little
		// more per line, invisible on a few lines but visible once there's a
		// lot to scroll through. Mapping by scroll *fraction* rather than
		// copying the raw offset keeps both ends exactly pinned regardless of
		// that drift, instead of copying an offset that means something
		// slightly different in each element.
		const vRange = editorEl.scrollHeight - editorEl.clientHeight;
		const hRange = editorEl.scrollWidth - editorEl.clientWidth;
		const ghostVRange = ghostEl.scrollHeight - ghostEl.clientHeight;
		const ghostHRange = ghostEl.scrollWidth - ghostEl.clientWidth;

		ghostEl.scrollTop = vRange > 0 ? (editorEl.scrollTop / vRange) * ghostVRange : 0;
		ghostEl.scrollLeft = hRange > 0 ? (editorEl.scrollLeft / hRange) * ghostHRange : 0;
		// The section marker is drawn against the ghost's own line coordinates,
		// so it has to follow the ghost's (corrected) offset, not the editor's.
		scrollTop = ghostEl.scrollTop;
		readView();
		syncAfterRender();
	};

	const placeTooltip = () => {
		const anchor = tooltipAnchorEl();
		if (!anchor || !viewportEl || !tooltip || !(hover || focused)) {
			showTooltip = false;
			return;
		}

		const rect = anchor.getBoundingClientRect();
		const bounds = viewportEl.getBoundingClientRect();

		// The anchor can be scrolled out of the editor viewport, and the tooltip is
		// positioned against the window, so it has to be hidden by hand.
		if (rect.bottom <= bounds.top || rect.top >= bounds.bottom) {
			showTooltip = false;
			return;
		}

		// Sit clear above the token rather than over it: the tooltip is a fixed
		// TOOLTIP_HEIGHT tall, so the gap below it is exact.
		tooltipPos = { x: Math.max(rect.left, bounds.left), y: rect.top - TOOLTIP_HEIGHT - 4 };
		showTooltip = true;
	};

	// The row height and the padding above the first row are what the visible
	// slice is counted off in, so they are taken from the rendered overlay rather
	// than restated as numbers that could fall out of step with the stylesheet.
	const measureRows = () => {
		if (!ghostEl) return;

		const style = getComputedStyle(ghostEl);
		lineHeight = parseFloat(style.lineHeight) || lineHeight;
		padding = parseFloat(style.paddingTop) || 0;
	};

	$effect(() => theme.hydrate());

	$effect(() => {
		const resetScroll = () => {
			if (editorEl) {
				editorEl.scrollTop = 0;
				editorEl.scrollLeft = 0;
				syncScroll();
			}
		};

		resetScroll();
		window.addEventListener('pageshow', resetScroll);
		return () => window.removeEventListener('pageshow', resetScroll);
	});

	// Anything that moves or resizes the editor invalidates the measured anchor,
	// and a resize can also change the metrics the rows are counted off in.
	$effect(() => {
		void ghostEl;
		measureRows();
		readView();

		const reposition = () => placeTooltip();
		const remeasure = () => {
			measureRows();
			readView();
			placeTooltip();
		};

		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', remeasure);
		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', remeasure);
			cancelAnimationFrame(hoverFrame);
		};
	});

	// Covers every way the caret can move: typing, clicking, arrow keys, undo.
	$effect(() => {
		const onSelectionChange = () => {
			if (document.activeElement === editorEl) syncCaret();
		};

		document.addEventListener('selectionchange', onSelectionChange);
		return () => document.removeEventListener('selectionchange', onSelectionChange);
	});

	$effect(() => {
		// Re-measure once the overlay has re-rendered. This tracks `debouncedActive`
		// rather than just the tooltip text, because neighbouring lines often share
		// a tooltip ("Attribute") and the anchor still has to move between them;
		// and `rows`, because the anchor's element only exists while its line is
		// one of the ones built.
		void [debouncedActive, tooltip, rows, focused];
		// Editing changes how far there is to scroll, and so the size of a thumb.
		readView();
		placeTooltip();
	});

	$effect(() => {
		if (activeArgIndex === null) return;
		document.getElementById(`details-arg-${activeArgIndex}`)?.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest'
		});
	});
</script>

<!--
	The page itself never scrolls: the editor and the details panel each scroll
	inside their own row. That also keeps scrollIntoView() on the argument list
	from shifting the editor out from under the tooltip.
-->
<main
	class="mx-auto grid h-svh w-[92%] max-w-[1700px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden"
>
	<header>
		<nav class="flex flex-wrap items-center gap-x-8 gap-y-4 py-8">
			<a class="pion-logo" href="https://pion.ly">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html pionLogo}
			</a>

			<h1 class="font-brand text-[28px] font-medium">SDP Explainer</h1>

			<a
				class="github-link"
				href="https://github.com/pion/explainer"
				target="_blank"
				aria-label="View source on GitHub"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.26 5.68.42.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
					/>
				</svg>
			</a>

			<div class="ml-auto flex items-center gap-6">
				<button
					type="button"
					class="cursor-pointer rounded-[5px] border border-hairline bg-surface p-2 text-heading transition hover:border-subtle-outline"
					aria-label="Switch to {theme.current === 'dark' ? 'light' : 'dark'} theme"
					onclick={() => theme.toggle()}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						aria-hidden="true"
					>
						{#if theme.current === 'dark'}
							<circle cx="12" cy="12" r="4.2" />
							<path
								d="M12 2.2v2.1M12 19.7v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"
							/>
						{:else}
							<path d="M20.8 13.2A8.6 8.6 0 1 1 10.8 3.2a6.7 6.7 0 0 0 10 10Z" />
						{/if}
					</svg>
				</button>
			</div>
		</nav>
	</header>

	<div
		class="grid min-h-0 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:grid-rows-[minmax(0,1fr)]"
	>
		<div
			class="sdp-frame relative overflow-hidden rounded-[5px] border border-hairline bg-surface transition-colors focus-within:border-subtle-outline"
			style="--sdp-gutter: calc({digits}ch + 2 * var(--sdp-padding));"
			bind:this={viewportEl}
		>
			<!--
				The band for the active line runs the whole width, underneath both the
				numbers and the text, so nothing between the two edges is left out of
				it. Drawn first, so everything else sits on top. The outer layer clips
				it to the editor; the inner one carries the scroll offset.
			-->
			<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
				<div style="transform: translateY({-scrollTop}px);">
					{#if highlightRow !== null}
						<div
							class="absolute inset-x-0 bg-line-highlight"
							style="top: calc(var(--sdp-padding) + {highlightRow} * var(--sdp-line-height)); height: var(--sdp-line-height);"
						></div>
					{/if}
				</div>
			</div>

			<!--
				Numbers follow the text down but not sideways, so they are moved by
				the same offset the overlay is scrolled to rather than scrolling with
				it, and only the rows on screen are built. The section marker belongs
				to this column too, standing in the room the numbers leave before the
				text; only a change of section animates.
			-->
			<div class="sdp-gutter" aria-hidden="true">
				<div style="transform: translateY({firstRow * lineHeight - scrollTop}px);">
					{#each numbers as n (n)}
						<div class={['sdp-number', caretLocation?.lineIndex === n - 1 && 'sdp-number-active']}>
							{n}
						</div>
					{/each}
				</div>

				<div class="absolute inset-0" style="transform: translateY({-scrollTop}px);">
					{#if sectionSpan}
						<div
							class="sdp-section"
							style="top: calc(var(--sdp-padding) + {sectionSpan.first} * var(--sdp-line-height)); height: calc({sectionSpan.count} * var(--sdp-line-height));"
						></div>
					{/if}
				</div>
			</div>

			<div
				inert
				class="sdp-layer pointer-events-none overflow-hidden"
				aria-hidden="true"
				bind:this={ghostEl}
				bind:clientHeight={ghostHeight}
			>
				<!--
					The spacer stands in for every line that was not built, so the overlay
					still scrolls exactly as far as the textarea does and `syncScroll`'s
					two ends stay comparable. Its width is given in `ch` — one character
					of the monospace face both layers share — which reserves the longest
					line's room without that line having to exist.
				-->
				<div
					class="w-max whitespace-normal"
					style="min-width: {outline.columns}ch; height: {lines.length * lineHeight}px;"
				>
					<div bind:this={rowsEl} style="transform: translateY({firstRow * lineHeight}px);">
						{#each rows as line, r (firstRow + r)}
							{@const i = firstRow + r}
							<!-- prettier-ignore -->
							<div class="sdp-line">{#each line.parts as part, p (p)}<span class={partClass(i, part)}>{part.text}</span>{/each}</div>
						{/each}
					</div>
				</div>
			</div>

			{#if sdpText === ''}
				<div class="sdp-layer pointer-events-none opacity-60 select-none">
					Paste your session description here...
				</div>
			{/if}

			<textarea
				id="sdp-editor"
				class="sdp-layer sdp-editor resize-none overflow-auto bg-transparent text-transparent caret-heading outline-none"
				spellcheck="false"
				autocapitalize="none"
				autocomplete="off"
				translate="no"
				wrap="off"
				aria-label="Session description"
				bind:value={sdpText}
				bind:this={editorEl}
				onscroll={syncScroll}
				onmousemove={onPointerMove}
				onmouseleave={onPointerLeave}
				oninput={() => {
					usingKeyboard = true;
					syncCaret();
					// Typing, pasting, or a newline all fire here synchronously, in the
					// same task as the browser's own bare-minimum auto-scroll — unlike
					// pure caret navigation, there's no risk of reading a stale caret,
					// so the margin correction lands before this task's own paint
					// instead of waiting for the keydown-scheduled one a frame later.
					applyScrollMargin();
				}}
				onkeydown={(event) => {
					usingKeyboard = true;
					if (
						event.key !== 'Shift' &&
						event.key !== 'Control' &&
						event.key !== 'Alt' &&
						event.key !== 'Meta'
					) {
						// Queued rather than run straight from the selectionchange event,
						// which Chrome dispatches as its own later task: by then the
						// browser has already painted its own bare-minimum auto-scroll,
						// so correcting the margin there lands a frame late and reads as
						// two scrolls. rAF still runs after this key's default action (the
						// caret move and that auto-scroll) but before the next paint, so
						// only the corrected position is ever shown. A microtask is too
						// early here — for pure caret navigation Chrome can still be
						// mid-way through moving the selection at that point.
						requestAnimationFrame(() => {
							if (document.activeElement === editorEl) applyScrollMargin();
						});
					}
				}}
				onclick={() => {
					usingKeyboard = true;
					syncCaret();
				}}
				onkeyup={syncCaret}
				onfocus={() => {
					focused = true;
					syncCaret();
				}}
				onblur={() => (focused = false)}></textarea>

			<!--
				Drawn against the frame rather than inside the editor, so the gutters
				stay exactly one padding wide on both sides whatever the platform
				would have spent on a scrollbar of its own.
			-->
			{#if showY}
				<!--
					Not a tab stop: the editor it controls is focusable and scrolls from
					the keyboard itself, so this only has to describe where it has got to.
				-->
				<div
					class="sdp-scrollbar sdp-scrollbar-y"
					style="bottom: {showX ? 'var(--sdp-scrollbar)' : '0px'};"
					bind:clientHeight={trackY}
					onpointerdown={startDrag(true)}
					role="scrollbar"
					tabindex="-1"
					aria-controls="sdp-editor"
					aria-orientation="vertical"
					aria-label="Scroll session description vertically"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percent(view.top, view.scrollH, view.clientH)}
				>
					{#if thumbY}
						<div class="sdp-thumb" style="top: {thumbY.pos}px; height: {thumbY.size}px;"></div>
					{/if}
				</div>
			{/if}

			{#if showX}
				<div
					class="sdp-scrollbar sdp-scrollbar-x"
					style="left: var(--sdp-gutter); right: {showY ? 'var(--sdp-scrollbar)' : '0px'};"
					bind:clientWidth={trackX}
					onpointerdown={startDrag(false)}
					role="scrollbar"
					tabindex="-1"
					aria-controls="sdp-editor"
					aria-orientation="horizontal"
					aria-label="Scroll session description horizontally"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percent(view.left, view.scrollW, view.clientW)}
				>
					{#if thumbX}
						<div class="sdp-thumb" style="left: {thumbX.pos}px; width: {thumbX.size}px;"></div>
					{/if}
				</div>
			{/if}
		</div>

		<aside class="min-h-0 overflow-y-auto lg:pr-2">
			{#if detail}
				<h2 class="text-[26px]">{detail.title}</h2>

				<div class="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
					<span class="badge">{placement}</span>
					{#if detail.level}
						<span class={['badge', misplaced && 'badge-warn']}>{LEVELS[detail.level]}</span>
					{/if}
				</div>

				<div
					class="my-3 rounded-[5px] border border-hairline bg-background px-2 py-1 font-mono text-[15px] break-words text-heading"
				>
					<span class="text-token-type">{activeLine?.type}</span
					>=<!--
					-->{#each syntax as part, i (i)}<span
							class={[
								part.argIndex === null ? 'text-token-key' : 'text-token-value',
								part.argIndex !== null &&
									part.argIndex === activeArgIndex &&
									'rounded-xs bg-token-value-wash'
							]}>{part.text}</span
						>{/each}
				</div>

				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html markdown(detail.description)}

				{#if detail.args.length}
					<h3 class="mt-6 text-[22px]">Arguments</h3>
					<ul class="mt-1 flex flex-col gap-1">
						{#each detail.args as arg, i (i)}
							<li
								class={[
									'rounded-[5px] px-2 py-1 transition-colors',
									activeArgIndex === i && 'bg-active-wash'
								]}
								id="details-arg-{i}"
							>
								<code class="text-heading">&lt;{arg.name}&gt;</code>
								{#if arg.description}
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									<span class="[&_p]:inline">{@html markdown(arg.description)}</span>
								{/if}

								<!-- Value lists are long; only the argument in play earns the space. -->
								{#if arg.values && activeArgIndex === i}
									<ul class="mt-2 flex flex-col gap-1.5 text-[16px]">
										{#each arg.values as value (value.value)}
											<li
												class={[
													'border-l-2 pl-2',
													value === activeValue
														? 'border-token-value text-heading'
														: 'border-hairline'
												]}
											>
												<code class="text-heading">{value.value}</code>
												<!-- eslint-disable-next-line svelte/no-at-html-tags -->
												<span class="[&_p]:inline">{@html markdown(value.description)}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				{#if detail.details}
					<hr class="my-5" />
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html markdown(detail.details)}
				{/if}

				{#if detail.specs?.length}
					<div class="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
						{#each detail.specs as spec (spec.href)}
							<!-- Every spec href is an absolute link out to an RFC, never a route. -->
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a class="underline underline-offset-2" href={spec.href} target="_blank">
								{spec.label}
							</a>
						{/each}
					</div>
				{/if}
			{:else if activeLine?.content.trim()}
				<p class="opacity-70">
					No documentation for <code
						>{activeLine.type ? `${activeLine.type}=` : activeLine.content.trim()}</code
					>.
				</p>
			{:else}
				<p class="opacity-70">Hover or select a line in the SDP to see details here...</p>
			{/if}
		</aside>
	</div>
</main>

{#if showTooltip && tooltip}
	{#key tooltip}
		<div
			class="pointer-events-none fixed z-10 rounded-[5px] border border-hairline bg-surface px-2 py-0.5 font-mono text-[14px] text-heading shadow-sm"
			style="top: {tooltipPos.y}px; left: {tooltipPos.x}px;"
			in:fade={{ duration: 80 }}
			out:fade={{ duration: 120 }}
		>
			{tooltip}
		</div>
	{/key}
{/if}
