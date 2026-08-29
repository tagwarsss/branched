# Gallery Fade Transition Plan

## Goal
Ensure the staggered 5s fade-in animation plays every time the user views the gallery section, without relying on position re-scattering to trigger it.

## Current State
- `index.css`: `.gallery-item` has `opacity: 0` by default with `transition: opacity 5s ease`.
- `index.js`: `scatterItems()` re-randomizes positions AND fades items in with staggered 60ms delays.
- Navigation: `goTo('gallery')` calls `scatterItems()`, so the fade currently happens on every gallery visit — but it also re-scatters positions each time.

## Problem
The fade-in is coupled to `scatterItems()`. If we ever want to preserve positions on subsequent views, the fade would be lost. The animation should be a standalone behavior that reliably replays whenever the gallery becomes visible.

## Proposed Changes

### 1. Extract a `fadeInItems()` function
In `index.js`, inside the gallery IIFE:

```js
const fadeTimeouts = [];

const fadeInItems = () => {
  const items = grid.querySelectorAll('.gallery-item');
  fadeTimeouts.forEach(clearTimeout);
  fadeTimeouts.length = 0;
  items.forEach((item, i) => {
    item.style.opacity = '0';
    const t = setTimeout(() => {
      item.style.opacity = '1';
    }, 60 * i);
    fadeTimeouts.push(t);
  });
};
```

### 2. Update `scatterItems()` to reuse `fadeInItems()`
```js
const scatterItems = () => {
  layoutItems();
  fadeInItems();
};
```

### 3. Update navigation to call `fadeInItems()` instead of `scatterItems()`
In `goTo()`:
```js
if (value === 'gallery') {
  const g = document.querySelector('.gallery-grid');
  if (g && g.fadeInItems) g.fadeInItems();
}
```

### 4. Keep `initPositions()` as-is
It sets initial random positions once on load. Items remain at `opacity: 0` until the first gallery view triggers `fadeInItems()`.

### 5. Keep the Scatter button behavior
The **Scatter** button still calls `scatterItems()` (re-scatter + fade).

## Files to Modify
- `index.js`: Refactor gallery IIFE to add `fadeInItems()`, update `scatterItems()` and `goTo()` references.

## Validation
1. Load page → Home view shows, gallery items invisible.
2. Click Gallery → items fade in with staggered 60ms delays over 5s.
3. Click Home → gallery hides.
4. Click Gallery again → items replay the same staggered fade-in without jumping to new positions.
5. Click Scatter → items re-scatter to new random positions AND fade in.
6. Resize window while gallery is active → items reposition but remain visible (no unwanted fade).

## Open Question
Should items preserve their dragged positions across gallery views, or should dragging be reset when navigating away and back? Current implementation preserves positions because `left`/`top` are inline styles that persist while the section is hidden.
