# Dynamic Gallery from Supabase Storage

## Goal
Replace hardcoded gallery images with images dynamically fetched from the existing Supabase Storage bucket `picture`.

## Affected files
- `index.html`
- `index.js`

## Tasks

### 1. Remove hardcoded gallery items (`index.html`)
Delete all `<div class="gallery-item"><img src="grid-pic/..." alt=""></div>` inside `.gallery-grid`. Leave the empty container `<div class="gallery-grid filter"></div>`.

### 2. Refactor gallery IIFE to support dynamic population (`index.js`)
Inside the existing gallery IIFE:
- Extract `attachDrag` logic into a named function `attachDragToItem(item)` so it can be reused.
- Add `createGalleryItem(src)` that builds and returns a `.gallery-item` with an `<img>`.
- Add `async loadGallery()` on `grid` that:
  1. Clears existing `.gallery-item` children.
  2. Calls `supabase.storage.from("picture").list()` to get files.
  3. Maps each file to a `.gallery-item` using `createGalleryItem`.
  4. Calls `attachDragToItem` for each new item.
  5. Calls `scatterItems()` to position and fade them.
- Handle errors by logging to console and leaving the gallery empty.

Public URL pattern:
`${SUPABASE_URL}/storage/v1/object/public/picture/${file.name}`

### 3. Hook gallery load into navigation (`index.js`)
In the nav click handler, when `value === "gallery"`, call `grid.loadGallery()` before `grid.scatterItems()` (or replace the call, since `loadGallery` will call `scatterItems` internally).

### 4. Preserve existing behavior
- Drag-to-scroll on the paper (About section) is unchanged.
- Image overlay on click is unchanged.
- Gallery leave animation is unchanged.
- `gallery-grid` pointerdown stopPropagation remains.

## Validation
- Navigate to Gallery: images from the `picture` bucket appear scattered.
- Drag a gallery item: works.
- Click a gallery item: opens full-screen overlay.
- Upload a new image via upload panel: close panel, heart shows. (Gallery refresh on upload is out of scope unless requested.)
- Empty bucket: gallery shows no images, no errors in UI.
