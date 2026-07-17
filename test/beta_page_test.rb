# frozen_string_literal: true

require "minitest/autorun"

class BetaPageTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  PAGE = File.read(File.join(ROOT, "_pages/beta.html"))
  LAYOUT = File.read(File.join(ROOT, "_layouts/beta.html"))
  ORGANIZER = File.read(File.join(ROOT, "_includes/beta-organizer.html"))
  STYLES = File.read(File.join(ROOT, "main.scss"))
  SMARTPHONE_CURSOR = File.join(ROOT, "assets/smartphone-cursor.svg")

  def test_beta_route_owns_the_interactive_organizer
    assert_includes PAGE, "permalink: /beta/"
    assert_includes PAGE, "beta-organizer.html"
    assert_includes ORGANIZER, "data-record-organizer"
    assert_includes ORGANIZER, "assets/data/apple-top-albums.json"
    assert_includes LAYOUT, "assets/js/record-organizer.js"
  end

  def test_record_scanner_is_the_only_numbered_prototype
    prototype = File.read(File.join(ROOT, "_pages/beta-2.html"))

    assert_includes prototype, "permalink: /beta/2/"
    assert_includes prototype, "beta_effect: 2"
    assert_includes prototype, "sitemap: false"
    assert_includes prototype, "Prototype 2 · Record scanner"
    assert_includes prototype, "cursor_scanner=true"
    assert_includes ORGANIZER, "data-cursor-scanner="
    refute_path_exists File.join(ROOT, "_pages/beta-1.html")
    refute_path_exists File.join(ROOT, "_pages/beta-3.html")
    refute_path_exists File.join(ROOT, "assets/js/beta-effect-1.js")
    refute_path_exists File.join(ROOT, "assets/js/beta-effect-2.js")
    refute_path_exists File.join(ROOT, "assets/js/beta-effect-3.js")
    refute_path_exists File.join(ROOT, "assets/js/three-effect-utils.js")
    refute_includes LAYOUT, 'type="module"'
  end

  def test_numbered_variant_styles_do_not_apply_to_the_baseline_beta_page
    refute_includes PAGE, "beta_effect:"
  end

  def test_record_scanner_uses_a_small_iphone_cursor
    assert_path_exists SMARTPHONE_CURSOR
    cursor = File.read(SMARTPHONE_CURSOR)

    assert_includes cursor, 'width="28" height="48"'
    assert_includes cursor, 'width="10" height="3.5"'
    assert_match(/\.beta-effect-2 \.record-organizer,.*?smartphone-cursor\.svg.*?14 5, pointer;/m, STYLES)
  end

  def test_beta_page_is_not_indexed
    assert_includes PAGE, "sitemap: false"
    assert_includes PAGE, 'robots: "noindex, nofollow"'
  end

  def test_responsive_layout_keeps_copy_before_the_organizer
    responsive_styles = STYLES[/@media \(max-width: 920px\) \{(?<body>.*?)@media \(max-width: 580px\)/m, :body]

    refute_nil responsive_styles
    assert_match(/\.collection-hero__copy \{.*?order: 0;/m, responsive_styles)
    assert_match(/\.record-organizer \{.*?order: 1;/m, responsive_styles)
  end
end
