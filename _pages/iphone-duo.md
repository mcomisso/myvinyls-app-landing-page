---
layout: page
title: "My Vinyl+ on iPhone Duo — Vinyl on One Screen, Details on the Other"
breadcrumb_title: iPhone Duo
description: "On the open iPhone Duo, a record fills one screen while its pressing, label and notes fill the other. Open the hinge to slide the vinyl out of its sleeve, or fold the phone like a laptop and scan a shelf hands-free."
include_in_header: false
content_class: duo-page
image: /assets/media/iphone-duo/record-tangk.webp
---

<header class="duo-hero duo-grid">
  <div class="duo-copy">
    <h1>My Vinyl+<br>on iPhone Duo</h1>
    <p>Open your collection across two screens. See the vinyl and its pressing details side by side, or fold your iPhone to scan a stack of records hands-free.</p>
    <div class="duo-actions">
      <a class="appstore-badge" href="{{ site.appstore_link }}">
        <img src="{{ '/assets/appstore.png' | relative_url }}" alt="Download on the App Store" width="164" height="56">
      </a>
      <a class="contextual-link" href="#scan-a-shelf-hands-free">See Desk Scan</a>
    </div>
  </div>
  <div class="duo-stage duo-stage--hero">
    <img class="duo-screen" src="{{ '/assets/media/iphone-duo/record-tangk.webp' | relative_url }}"
      srcset="{{ '/assets/media/iphone-duo/record-tangk-small.webp' | relative_url }} 760w, {{ '/assets/media/iphone-duo/record-tangk.webp' | relative_url }} 1500w"
      sizes="(max-width: 800px) 82vw, (max-width: 1280px) 50vw, 645px"
      width="1500" height="1055" fetchpriority="high"
      alt="The unfolded My Vinyl+ record page shows the yellow Tangk vinyl by IDLES on the left and pressing details on the right.">
  </div>
</header>

<section class="duo-feature duo-feature--detail duo-grid" aria-labelledby="the-record-page-unfolded">
  <div class="duo-copy">
    <h2 id="the-record-page-unfolded">The record page, unfolded</h2>
    <p>Open your iPhone Duo and the vinyl slides out of its sleeve. Close it and the record slips back in.</p>
    <p>Artwork, label and disc are drawn from the release's own photos. The label, catalogue number, format, country, year and your own notes and grading stay visible beside the record.</p>
  </div>
  <div class="duo-stage duo-stage--detail">
    <img class="duo-screen" src="{{ '/assets/media/iphone-duo/record-dreamland.webp' | relative_url }}"
      width="1080" height="760" loading="lazy" decoding="async"
      alt="The unfolded Dreamland release shows its green vinyl next to the label, format, and condition grading.">
  </div>
</section>

<section class="duo-feature duo-grid" aria-labelledby="scan-a-shelf-hands-free">
  <div class="duo-copy">
    <h2 id="scan-a-shelf-hands-free">Scan a shelf hands-free</h2>
    <p>Fold your iPhone Duo like a laptop and set it on a counter. Hold each sleeve up to the inner camera and the bottom screen shows the match, whether you already own it, and how many records you've scanned.</p>
    <p>The bulk scanner suggests folding the Duo the first time you open it. The screen stays awake, duplicate scans are filtered within the session, and you can review the stack before importing it.</p>
    <p>Desk Scan needs My Vinyl+ 4.5.2 or later.</p>
  </div>
  <figure class="duo-scan">
    <div class="duo-stage duo-stage--scan">
      <div class="duo-fold">
        <img class="duo-screen duo-fold-camera" src="{{ '/assets/media/iphone-duo/desk-scan-camera.webp' | relative_url }}"
          width="934" height="653" loading="lazy" decoding="async"
          alt="The upper screen reads the barcode on a record sleeve.">
        <img class="duo-screen duo-fold-results" src="{{ '/assets/media/iphone-duo/desk-scan-results.webp' | relative_url }}"
          width="934" height="653" loading="lazy" decoding="async"
          alt="The lower screen identifies Kind Of Blue by Miles Davis and shows three records scanned.">
      </div>
    </div>
    <figcaption>Desk Scan with an illustrated camera view.</figcaption>
  </figure>
</section>

<section class="duo-requirements" aria-labelledby="what-you-need">
  <h2 id="what-you-need">What you need</h2>
  <p>An iPhone Duo with iOS 26 for the unfolded record page, and a Discogs account if you want to sync your collection and wantlist.</p>
  <p>Planning a Record Store Day run? Browse <a class="contextual-link" href="{{ '/record-store-day/' | relative_url }}">Record Store Day release lists</a> or see <a class="contextual-link" href="{{ '/changelog/' | relative_url }}">what's new in My Vinyl+</a>.</p>
</section>
