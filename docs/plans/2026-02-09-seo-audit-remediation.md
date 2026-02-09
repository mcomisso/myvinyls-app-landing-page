# SEO Audit Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the Squirrelscan audit findings for https://myvinyls.app by fixing SEO, accessibility, broken links, and content issues in the Jekyll source, then re-audit after deployment.

**Architecture:** Update Jekyll config and layouts to improve metadata, navigation, and semantics; normalize legal/about/contact content; adjust templates for headings and link text; add video captions + schema; and tighten performance hints/minification.

**Tech Stack:** Jekyll (Liquid), SCSS, vanilla JS.

### Task 1: Update Jekyll Configuration Baseline

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_config.yml`

**Step 1: Edit config for exclusions and metadata**

```yaml
app_description: "My Vinyls is a fast, beautiful vinyl collection manager for iPhone with Discogs sync, barcode scanning, offline access, and intelligent insights so you always know what you own."
presskit_download_link: /assets/PressKit.zip
exclude:
  - LICENSE
  - README.md
  - CNAME
  - public
  - PLAN.md
  - CLAUDE.md
  - privacy.md
  - firebase-debug.log
  - squirrel.toml
```

**Step 2: Run a local build (if Jekyll deps are available)**

Run: `bundle exec jekyll build`
Expected: `Build completed successfully` (or a dependency error to resolve)

**Step 3: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_config.yml
git commit -m "chore: tighten site config" -m "Summary: update metadata and exclude non-site files from output."
```

### Task 2: Normalize Legal Pages + Add About & Contact

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/privacypolicy.md`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/terms.md`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/changelog.md`
- Create: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/about.md`
- Create: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/contact.md`

**Step 1: Update Privacy Policy headings**

```md
# Privacy Policy

## Information Collection and Use
## Log Data
## Cookies
## Service Providers
## Security
## Links to Other Sites
## Children’s Privacy
## Changes to This Privacy Policy
## Contact Us
```

**Step 2: Add frontmatter + H1 to Terms**

```md
---
layout: page
title: Terms of Service
description: Terms of Service for My Vinyls covering account usage, subscriptions, acceptable use, and legal responsibilities.
---

# Terms of Service
```

**Step 3: Fix Changelog heading hierarchy**

```md
# Changelog

## Latest
### Version 3.11.0
#### Improvements
#### Bug Fixes
```

(Repeat for other versions.)

**Step 4: Add About and Contact pages**

```md
---
layout: page
title: About My Vinyls
description: Learn who built My Vinyls, why it exists, and how it helps vinyl collectors organize and enjoy their records.
include_in_header: true
---

# About My Vinyls
```

```md
---
layout: page
title: Contact
description: How to contact the My Vinyls team for support, feedback, and press inquiries.
include_in_header: true
---

# Contact
```

**Step 5: Local build check**

Run: `bundle exec jekyll build`
Expected: `Build completed successfully`

**Step 6: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/privacypolicy.md \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/terms.md \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/changelog.md \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/about.md \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_pages/contact.md

git commit -m "content: improve legal and about pages" -m "Summary: add structured headings and add About/Contact pages for E-E-A-T."
```

### Task 3: Add Skip Link + Main Landmarks + Navigation Fixes

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/header.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/footer.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/page.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/main.scss`

**Step 1: Add skip link in header include**

```html
<a class="skip-link" href="#main-content">Skip to content</a>
```

**Step 2: Wrap primary content in `<main id="main-content">` in each layout**

```html
<main id="main-content" tabindex="-1">
  ...
</main>
```

**Step 3: Fix footer press kit link and mail link**

```liquid
{% assign presskit_link = site.presskit_download_link %}
{% if presskit_link contains "://" %}
  <a href="{{ presskit_link }}" target="_blank" rel="noopener">Press Kit</a>
{% else %}
  <a href="{{ presskit_link | relative_url }}" target="_blank" rel="noopener">Press Kit</a>
{% endif %}
```

Replace the mailto icon with a link to `/contact/`.

**Step 4: Add skip-link styles**

```scss
.skip-link {
  position: absolute;
  left: -999px;
  top: 8px;
  background: #111;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  z-index: 9999;
}

.skip-link:focus {
  left: 12px;
}
```

**Step 5: Local build check**

Run: `bundle exec jekyll build`
Expected: `Build completed successfully`

**Step 6: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/header.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/footer.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/page.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/main.scss

git commit -m "a11y: add skip link and main landmarks" -m "Summary: improve page structure and footer navigation links."
```

### Task 4: Fix Titles, Meta, and Link Text

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/head.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/blog-card.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/header.html`

**Step 1: Shorten titles and add pagination uniqueness**

```liquid
{% assign base_title = page.title | default: site.page_title %}
{% if paginator and paginator.page and paginator.page > 1 %}
  {% assign base_title = base_title | append: " (Page " | append: paginator.page | append: ")" %}
{% endif %}
<title>{{ base_title | truncate: 45, "" }} | {{ site.app_name }}</title>
```

**Step 2: Add meta author and preconnect for ajax.googleapis.com**

```html
<meta name="author" content="{{ page.author | default: site.your_name }}">
<link rel="preconnect" href="https://ajax.googleapis.com" crossorigin>
```

**Step 3: Update post layout title + add `<time>` element**

```html
<title>{{ page.title | truncate: 45, "" }} | {{ site.app_name }}</title>
<time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: "%B %d, %Y" }}</time>
```

**Step 4: Fix generic link text**

- Header button: “Download My Vinyls”
- Blog pagination: “Previous posts” / “Next posts”
- Author link: “Author website”

**Step 5: Local build check**

Run: `bundle exec jekyll build`
Expected: `Build completed successfully`

**Step 6: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/head.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/blog-card.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_includes/header.html

git commit -m "seo: shorten titles and clarify links" -m "Summary: reduce title length, improve metadata, and update generic link text."
```

### Task 5: Video Accessibility + Schema

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html`
- Create: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/media/hero-swift.vtt`

**Step 1: Add captions track to hero video**

```html
<track kind="captions" srclang="en" label="English" src="{{ 'assets/media/hero-swift.vtt' | relative_url }}">
```

**Step 2: Add VideoObject JSON-LD**

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "My Vinyls app preview",
  "description": "Quick preview of the My Vinyls iOS app interface.",
  "thumbnailUrl": "{{ 'assets/media/hero-poster.webp' | absolute_url }}",
  "uploadDate": "2026-02-01",
  "contentUrl": "{{ 'assets/media/hero-swift.mp4' | absolute_url }}"
}
```

**Step 3: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/media/hero-swift.vtt

git commit -m "a11y: add video captions and schema" -m "Summary: provide captions and VideoObject metadata for the hero video."
```

### Task 6: Performance Cleanups

**Files:**
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/animations.js`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/faq.js`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/blog.js`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html`
- Modify: `/Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html`

**Step 1: Remove lazy loading for above-fold gallery image**

```html
<img ... loading="eager" fetchpriority="high">
```

**Step 2: Minify JS files (remove comments/whitespace)**

Keep functionality identical, reduce whitespace and comments in:
- `assets/js/animations.js`
- `assets/js/faq.js`
- `assets/js/blog.js`

**Step 3: Add `defer` to script tags**

```html
<script src="..." defer></script>
```

**Step 4: Local build check**

Run: `bundle exec jekyll build`
Expected: `Build completed successfully`

**Step 5: Commit**

```bash
git add /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/default.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/animations.js \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/faq.js \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/assets/js/blog.js \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/faq.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/blog.html \
  /Users/matcom/Developer/MCSoftware/MyVinyl/landing-page/.worktrees/seo-audit-fixes/_layouts/post.html

git commit -m "perf: reduce JS and improve loading" -m "Summary: minimize scripts, add defer, and eager-load above-fold imagery."
```

### Task 7: Re-Audit After Deployment

**Step 1: Deploy updated site**

(Trigger your normal GitHub Pages/Vercel/Cloudflare Pages deploy.)

**Step 2: Re-run Squirrelscan (surface + full)**

```bash
squirrel audit https://myvinyls.app --format llm
squirrel audit https://myvinyls.app -C full --format llm
```

**Step 3: Compare scores + list remaining warnings**

If any warnings remain (especially security headers), document hosting-level fixes.

**Step 4: Commit any follow-ups**

```bash
git commit -m "chore: document audit follow-ups" -m "Summary: note remaining hosting-level fixes after re-audit."
```
