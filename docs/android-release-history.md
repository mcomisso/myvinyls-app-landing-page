# Android release history

The What's New page has separate histories:

- `/changelog/`: iOS, kept in `_pages/changelog.md`.
- `/changelog/android/`: Android, kept in `_pages/android-changelog.md`.

Both use `_layouts/changelog.html`. Keep the existing iOS version anchors and
`### Version <version>` Markdown format: the iOS release synchronizer reads that
source, and the shared layout turns each heading into a release card.

## Android notes and evidence

The initial Android history uses the developer-authored English notes from
`mcsoftwareltd/MyVinylAndroid`, at commit
`ced558879cb4a540fa86186c992b6b63696f6fe8`:

- `fastlane/metadata/android/en-US/changelogs/38.txt`: 1.1.0
- `fastlane/metadata/android/en-US/changelogs/39.txt`: 1.1.1
- `fastlane/metadata/android/en-US/changelogs/40.txt`: 1.2.0
- `fastlane/metadata/android/en-US/changelogs/41.txt`: 1.2.1
- `fastlane/metadata/android/en-US/changelogs/42.txt`: 1.3.0
- `fastlane/metadata/android/en-US/changelogs/43.txt`: 1.3.1
- `fastlane/metadata/android/en-US/changelogs/44.txt`: 1.3.2
- `fastlane/metadata/android/en-US/changelogs/45.txt`: 1.3.3
- `fastlane/metadata/android/en-US/changelogs/46.txt`: 1.4.0

Each version was cross-checked against `version.properties` at the corresponding
`production/<build>` tag. Notes retain the author's feature and fix claims;
formatting removes the repeated heading and sign-off and uses Markdown bullets.

These tags identify uploaded source, not a verified publication date. Their
messages explicitly distinguish submission/review from publication. The public
Play listing was reachable on 2026-11-10, but reported `Varies with device` for
its version. Consequently the page labels 1.4.0 the latest **documented** Android
version, and does not invent dates or claim all devices have that version.
The older build-30 note has no verified version mapping here and was not added.

## Adding an Android version

1. Confirm the package is `com.mcsoftware.myvinyl`, identify the release version
   and build from release evidence, and obtain the approved Android release
   notes. Do not copy iOS notes or infer shipped features from development main.
2. Add a `### Version X.Y.Z` section at the top of
   `_pages/android-changelog.md`, followed by its notes and a `---` separator.
3. Update that page's `latest_version` and `latest_summary` fields. Keep
   `platform: android`, the explicit permalink, and its store link routing.
4. Add a Play publication date only when verified independently. An uploaded
   bundle or production tag alone is not enough.
5. Run the website regression tests and production Jekyll build. Check both
   histories on mobile and desktop, in light and dark themes, including the
   platform links, store badges, anchors and older-version disclosures.

The existing iOS release-sync job remains iOS-only. The separate Android source
prevents it from overwriting or interpreting Android versions as iOS releases.
Android updates are editorial until a publication-aware Android synchronizer is
explicitly configured.
