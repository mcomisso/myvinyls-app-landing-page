# Five throwaway journal prototypes

Question: which editorial structure gives My Vinyl+ a recognizable vinyl identity while keeping article discovery and long-form reading comfortable?

Run from the landing-page directory:

```sh
python3 blog/prototype/serve.py
```

Open http://127.0.0.1:8765/blog/?variant=A. Use the floating arrows, selector, or keyboard left/right arrows. The variant and selected reading preview are encoded in the URL. Input fields keep their normal keyboard behaviour.

| Variant | Direction | Design question |
| --- | --- | --- |
| A | The sleeve | Can a gatefold composition make the journal immediately recognizable? |
| B | Liner notes | Does a quieter, text-first journal best support leisurely reading? |
| C | The catalogue | Is a compact, searchable archive the most useful collector experience? |
| D | Listening room | Does a low-glare evening palette suit reading alongside music? |
| E | The quarterly | Can a magazine spread make practical guides feel collectible? |

## Scope

The Python development server overlays the existing `/blog/` route locally and reads the existing `_posts` collection. Production Jekyll excludes `blog/prototype`. The switcher also checks for localhost before showing itself. No new dependencies, persistence, subscriptions, or backend calls. Existing English-only website scope is preserved.

Each direction includes search, category filtering, real article links, and a reading preview composed of opening extracts. Full articles link to the published website. Initial layouts show a curated slice of recent posts; search and filters show up to 18 matches. Images and copy are existing site content, not new editorial claims. The fonts are locally bundled with their SIL Open Font Licenses; `fonts/downloads.json` records the original Google Fonts URLs.

## Mobbin references

Inspected through the Mobbin MCP, not copied as page templates:

- [Ghost](https://mobbin.com/screens/b6b0856a-471f-4ffd-934a-a9693849724b): quiet typographic hierarchy and compact article rows.
- [Podia](https://mobbin.com/screens/bf514c3d-f4b0-4eb4-ab46-c9019efa474e): useful contrast between image rhythm and headline density.
- [Hashnode](https://mobbin.com/screens/d922b22f-ad50-4703-bfe2-b94425ca5064): related-article navigation.
- [KOBU](https://mobbin.com/sites/sections/f5959421-5ded-4adb-98db-49143db77839): image-led editorial spacing.
- [Kinfolk](https://mobbin.com/sites/sections/6fcb8f5c-0595-4c0e-adce-fa3e4090fb52): restrained serif typography and generous photography.

## Decision

Awaiting user selection. A is the initial recommendation for recognizable vinyl identity; B is the strongest reading-first alternative. No direction has been validated or promoted to production. Retain the full experiment on `codex/blog-style-prototypes`; implement an approved direction separately.

## Verification

Browser inspection at 1440 and 390 CSS pixels for all five index layouts and their reading previews. Checked URL persistence, keyboard cycling and wraparound, input keyboard exclusion, search, empty results, and category selection. No automated test suite was added, in keeping with the prototype skill. The Impeccable context and detector launchers both exited without output; direct browser inspection supplied the visual evidence.
