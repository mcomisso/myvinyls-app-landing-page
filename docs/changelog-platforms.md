# Platform release histories

The shared `_layouts/changelog.html` renders both release histories:

- `/changelog/` uses `_pages/changelog.md`. An absent `platform` field defaults to iOS, preserving the iOS release-sync source format and existing version anchors.
- `/changelog/android/` uses `_pages/android-changelog.md`, with `platform: android` and an explicit `permalink: /changelog/android/`.

Each page supplies `latest_version` and `latest_summary`. Optional `latest_label` overrides the default platform version label. Android uses `Latest documented Android version` when the release notes establish documented versions but not current Play Store availability.

Optional `release_history_note` renders as escaped text in the sidebar below the platform description, so provenance remains visible.

Keep release sections as `### Version ...` in Markdown. The shared layout retains their generated IDs when converting headings to release cards. The first three releases stay expanded by default; `open_release_count` can override this. Older releases use native details disclosures.

Platform navigation uses ordinary links, not JavaScript tabs. The selected link has `aria-current="page"`, an underlined label, and an inverted theme-aware background. Links wrap on small screens, have 44px minimum height, and show a keyboard focus outline. Android's latest panel links to the production Google Play listing; iOS links to the App Store.

The homepage retains the `android-beta` fragment and existing CSS class names for link compatibility, but its download text and badges no longer advertise beta testing. Unrelated `/beta/` organizer prototypes remain unchanged.

## Regression checks

Run dependency-free source checks:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s test -p '*_test.py' -v
```

After a Jekyll build, include rendered route checks:

```sh
SITE_DIR=_site PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s test -p '*_test.py' -v
```

Existing Ruby homepage tests now expect production Android copy. Run them with the site's other Ruby tests in an environment with Ruby installed.

Before publishing, check both changelog URLs at desktop and mobile widths in light and dark themes. Tab through the platform links and store badge, follow each platform link, check the current-page marker, and open an archived release. Confirm existing iOS version fragments still target their release headings.
