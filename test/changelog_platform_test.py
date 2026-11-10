"""Dependency-free source regressions: python3 -m unittest discover -s test -p '*_test.py'.

Set SITE_DIR to a Jekyll build directory to also verify rendered routes and badges.
"""
import os
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


def source(path):
    return (ROOT / path).read_text()


def section(pattern, html):
    match = re.search(pattern, html, re.S)
    if match is None:
        raise AssertionError(f"Missing markup: {pattern}")
    return match[0]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.active = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.active = {"attrs": attrs, "text": "", "images": []}
            self.links.append(self.active)
        elif tag == "img" and self.active is not None:
            self.active["images"].append(attrs)

    def handle_endtag(self, tag):
        if tag == "a":
            self.active = None

    def handle_data(self, data):
        if self.active is not None:
            self.active["text"] += data


class ChangelogPlatformTest(unittest.TestCase):
    def test_normal_navigation_preserves_ios_url_and_marks_current_platform(self):
        layout = source("_layouts/changelog.html")
        self.assertIn("page.platform | default: 'ios'", layout)
        nav = section(r'<nav class="changelog-platform-nav".*?</nav>', layout)
        self.assertIn('aria-label="Release history platform"', nav)
        for route, condition, label in [
            ("/changelog/", "!=", "iOS"),
            ("/changelog/android/", "==", "Android"),
        ]:
            self.assertIn(
                '<a href="{{ \'' + route + "' | relative_url }}\""
                + "{% if release_platform " + condition + " 'android' %}"
                + ' aria-current="page"{% endif %}>' + label + '</a>', nav
            )
        self.assertNotIn('role="tab', nav)
        self.assertNotIn("onclick", nav)

    def test_latest_panel_is_platform_labelled_and_uses_matching_store(self):
        layout = source("_layouts/changelog.html")
        panel = section(r'<aside class="changelog-latest-panel".*?</aside>', layout)
        self.assertIn('aria-label="{{ page.latest_label | default: latest_label }}"', panel)
        self.assertIn('{{ page.latest_label | default: latest_label }}', panel)
        self.assertIn("'Latest ' | append: platform_label | append: ' version'", layout)
        self.assertIn('{{ page.latest_version }}', panel)
        self.assertIn('{{ page.latest_summary }}', panel)
        stores = panel.split("{% if release_platform == 'android' %}")[1].split("{% else %}")
        self.assertIn('site.playstore_link', stores[0])
        self.assertIn('assets/playstore.png', stores[0])
        self.assertIn('alt="Download My Vinyl+ for Android on Google Play"', stores[0])
        self.assertNotIn('site.appstore_link', stores[0])
        self.assertIn('site.appstore_link', stores[1])
        self.assertNotIn('default: "3.14.0"', panel)

    def test_optional_provenance_is_visible_in_the_sidebar(self):
        layout = source('_layouts/changelog.html')
        sidebar = section(r'<aside class="changelog-context">.*?</aside>', layout)
        self.assertIn('{% if page.release_history_note %}', sidebar)
        self.assertIn('<p>{{ page.release_history_note | escape }}</p>', sidebar)

    def test_shared_release_parser_keeps_version_heading_ids(self):
        layout = source("_layouts/changelog.html")
        self.assertIn("content | split: '<h3'", layout)
        self.assertIn("release_part | split: '</h3>'", layout)
        self.assertIn('<h2{{ release_heading }}</h2>', layout)
        self.assertIn('<span{{ summary_heading }}</span>', layout)
        self.assertIn('<details class="changelog-release changelog-release-disclosure">', layout)
        ios = source('_pages/changelog.md')
        self.assertIn('layout: changelog', ios)
        self.assertRegex(ios, r'(?m)^### Version \d')
        self.assertIn('permalink: /:path/', source('_config.yml'))

    def test_platform_links_have_theme_aware_focus_and_touch_targets(self):
        styles = source('main.scss')
        nav = styles.split('.changelog-platform-nav {', 1)[1].split('.changelog-kicker {', 1)[0]
        self.assertIn('flex-wrap: wrap;', nav)
        self.assertIn('min-height: 44px;', nav)
        self.assertIn('background: var(--primary);', nav)
        self.assertIn('color: var(--on-primary);', nav)
        self.assertIn('&[aria-current="page"]', nav)
        self.assertIn('text-decoration: underline;', nav)
        self.assertIn('.changelog-platform-nav a:focus-visible', nav)
        self.assertIn('outline: 3px solid var(--text);', nav)
        self.assertIn('.changelog-store-link:focus-visible', nav)

    def test_all_shared_android_download_links_have_no_beta_accessible_text(self):
        count = 0
        for directory in ['_includes', '_layouts']:
            for path in (ROOT / directory).glob('*.html'):
                # Liquid attributes aren't HTML until rendered; remove control tags only.
                parser = Links()
                parser.feed(re.sub(r'{%.*?%}', '', path.read_text(), flags=re.S))
                for link in parser.links:
                    if 'site.playstore_link' not in link['attrs'].get('href', ''):
                        continue
                    count += 1
                    name = link['attrs'].get('aria-label', '') or (
                        link['text'] + ''.join(img.get('alt', '') for img in link['images'])
                    )
                    self.assertTrue(name.strip(), str(path))
                    self.assertNotRegex(name.lower(), r'beta|testing|opt.in', str(path))
                    self.assertNotRegex(link['text'].lower(), r'\bbeta\b', str(path))
        self.assertGreaterEqual(count, 5)
        for path in ['_layouts/default.html', '_includes/beta-organizer.html']:
            self.assertNotIn('class="beta-stamp"', source(path))
        config = source('_config.yml')
        self.assertIn('https://play.google.com/store/apps/details?id=com.mcsoftware.myvinyl', config)
        self.assertNotIn('play.google.com/apps/testing/', config)
        for path in ['index.html', '_layouts/default.html']:
            self.assertNotRegex(source(path), r'(?i)Android beta|public beta|now testing|beta feedback')
        self.assertIn("'/changelog/android/' | relative_url", source('_layouts/default.html'))

    @unittest.skipUnless(os.environ.get('SITE_DIR'), 'Set SITE_DIR to check a Jekyll build')
    def test_rendered_routes_platform_names_and_store_targets(self):
        site = Path(os.environ['SITE_DIR'])
        self.assertFalse((site / 'test').exists(), 'Tests must not be published')
        for route, label, other, store in [
            ('changelog', 'iOS', 'Android', 'apps.apple.com'),
            ('changelog/android', 'Android', 'iOS', 'play.google.com/store/apps/details?id=com.mcsoftware.myvinyl'),
        ]:
            html = (site / route / 'index.html').read_text()
            self.assertNotIn('{%', html)
            expected_label = 'Latest documented Android version' if label == 'Android' else 'Latest iOS version'
            self.assertIn(expected_label, html)
            self.assertNotIn('Latest ' + other + ' version', html)
            nav = section(r'<nav class="changelog-platform-nav".*?</nav>', html)
            links = Links()
            links.feed(nav)
            current = [link for link in links.links if link['attrs'].get('aria-current') == 'page']
            self.assertEqual([link['text'] for link in current], [label])
            self.assertEqual(len(links.links), 2)
            self.assertTrue(all(link['attrs'].get('href') for link in links.links))
            panel = section(r'<aside class="changelog-latest-panel".*?</aside>', html)
            self.assertIn(store, panel)
            self.assertRegex(html, r'<h2 id="version-[^"]+"')
            self.assertIn('class="changelog-release is-latest"', html)


if __name__ == '__main__':
    unittest.main()
