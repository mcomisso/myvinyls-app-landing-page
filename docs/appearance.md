# Website appearance

The website supports system, light, and dark appearance. Dark mode uses neutral vinyl black `#111214`, graphite surfaces, off-white text, and ivory accents. Light mode retains the existing paper palette. Album artwork and simulated app screens retain their original colors.

`assets/js/theme.js` runs before styles paint on all Jekyll layouts and the `/get/` redirect. It reads the shared `theme` local-storage key and follows system changes when no explicit preference is saved. Header buttons toggle light/dark; the footer selector also offers System. Storage failure leaves appearance controls usable for the current page. CSS supports system appearance with JavaScript disabled.

`main.scss` owns the general website palette, while `assets/css/journal.css` owns the journal palette. Both use the same `data-theme` attribute. The redirect has a small inline palette.

Public release, recovery, and reporting pages use the equivalent static bootstrap in `release-worker/src/render.ts`. Its exact SHA-256 hash is allowlisted by the worker Content Security Policy. The route test checks that the script and hash match. Update both when changing the bootstrap, and increment `RENDERER_VERSION` when changing rendered output so cached HTML is invalidated.

Verify normal pages, journal pages, the redirect, and worker pages in both themes. Include saved preferences across navigation, system changes, disabled JavaScript, blocked storage, keyboard focus, and narrow phone widths.
