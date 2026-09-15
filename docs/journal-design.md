# The Vinyl Journal

The user selected prototype A, The sleeve, on 16 September 2026. The five-direction experiment remains on `codex/blog-style-prototypes`. [Issue 159](https://github.com/mcsoftwareltd/My-Vinyl/issues/159) records the selection and implementation.

## Visual decisions

The blog is a reading surface. A record-sleeve feature gives the leading article equal space for photography and text. The circular journal stamp reinforces the vinyl identity. Subsequent articles use a two-column tracklist on desktop and one column on phones.

Warm paper `#f8f6ef`, dark olive ink `#262820`, muted olive `#606154`, and rust `#a43d20` carry the approved design. DM Serif Display is the title face; DM Sans handles navigation and metadata. Article prose uses Georgia at 20px with 1.8 line height and a 690px maximum width, reducing to 19px on phones. Fonts are bundled under `assets/fonts/journal` with their licenses.

The header and footer retain links into the existing product site. Journal CSS is loaded only by blog and article layouts, so other pages keep their existing appearance. Both light and dark mode are supported. System appearance is the default; the footer offers a saved System / Light / Dark choice. Theme colors are applied before content paints. Without JavaScript the system theme still works and article content remains visible. No animated reveals are used on the reading surface.

## Content and behaviour

The existing Jekyll paginator provides nine articles per page. The first is the sleeve feature; the other eight become article rows. Full published content, dates, categories, metadata, canonical URLs, structured data, tags, author details, related links, and social sharing are retained.

Search and categories filter the current page, matching the original blog's scope. The search label explicitly says this. Both controls use one predicate, with an accessible result count, pressed states, and an empty message. Pagination remains available during filtering. Clipboard failure presents a selectable article URL.

The current website supports English only. No mobile-app strings or app functionality changed.

## Implementation

- `_layouts/blog.html` and `_layouts/post.html` own the page structures.
- `_includes/journal-*` share the header, footer, metadata, story rows, and app links.
- `assets/css/journal.css` is the isolated journal stylesheet.
- `assets/js/blog.js` handles filtering and copy-link feedback.

Run with the project's existing `bundle exec jekyll serve` command. Prototype routes, Python preview server, and variant switching are absent from this implementation branch.
