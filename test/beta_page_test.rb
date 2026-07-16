# frozen_string_literal: true

require "minitest/autorun"

class BetaPageTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  PAGE = File.read(File.join(ROOT, "_pages/beta.html"))
  LAYOUT = File.read(File.join(ROOT, "_layouts/beta.html"))
  ORGANIZER = File.read(File.join(ROOT, "_includes/beta-organizer.html"))
  STYLES = File.read(File.join(ROOT, "main.scss"))

  def test_beta_route_owns_the_interactive_organizer
    assert_includes PAGE, "permalink: /beta/"
    assert_includes PAGE, "beta-organizer.html"
    assert_includes ORGANIZER, "data-record-organizer"
    assert_includes ORGANIZER, "assets/data/apple-top-albums.json"
    assert_includes LAYOUT, "assets/js/record-organizer.js"
  end

  def test_three_prototypes_have_isolated_routes_and_effects
    (1..3).each do |number|
      prototype = File.read(File.join(ROOT, "_pages/beta-#{number}.html"))
      effect = File.read(File.join(ROOT, "assets/js/beta-effect-#{number}.js"))

      assert_includes prototype, "permalink: /beta/#{number}/"
      assert_includes prototype, "beta_effect: #{number}"
      assert_includes prototype, "sitemap: false"
      assert_includes effect, 'from "./three-effect-utils.js"'
      assert_includes effect, "createThreeLayer"
    end

    assert_includes LAYOUT, "beta-effect-"
  end

  def test_three_effects_do_not_load_on_the_baseline_beta_page
    refute_includes PAGE, "beta_effect:"
  end

  def test_vinyl_reveal_previews_on_hover_and_collects_on_click
    prototype = File.read(File.join(ROOT, "_pages/beta-1.html"))

    assert_includes prototype, "organize_on_hover=false"
    assert_includes prototype, "vinyl_preview=true"
    assert_includes ORGANIZER, "data-organize-on-hover="
    assert_includes ORGANIZER, "data-vinyl-preview="
    assert_match(/\.beta-has-effect \.record-sleeve:not\(\.is-organized\).*?cursor: pointer;/m, STYLES)
    assert_includes STYLES, ".record-sleeve__vinyl"
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
