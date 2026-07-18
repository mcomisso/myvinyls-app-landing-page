# frozen_string_literal: true

require "minitest/autorun"

class HomepageLayoutTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  LAYOUT = File.read(File.join(ROOT, "_layouts/default.html"))
  ORGANIZER = File.read(File.join(ROOT, "_includes/beta-organizer.html"))
  FEATURES = File.read(File.join(ROOT, "_includes/features.html"))
  VIDEO_CAPTIONS = File.read(File.join(ROOT, "assets/media/hero-swift.vtt"))
  STYLES = File.read(File.join(ROOT, "main.scss"))
  ANIMATIONS = File.read(File.join(ROOT, "assets/js/animations.js"))

  def test_homepage_promotes_the_interactive_collection_hero
    assert_includes LAYOUT, "beta-organizer.html"
    assert_includes LAYOUT, 'prototype_label="Built for iPhone collectors"'
    assert_includes LAYOUT, 'heading="Your vinyl records, wherever you are."'
    assert_includes LAYOUT, 'android_cta="Join the Android waitlist"'
    assert_includes LAYOUT, 'supporting_copy="Free to download. One-time unlock available."'
    assert_includes LAYOUT, 'instruction="Hover over a record to scan it into the app."'
    assert_includes LAYOUT, "assets/js/record-organizer.js"
    refute_includes LAYOUT, 'class="hero-stats"'
  end

  def test_mobile_hero_retains_the_product_video
    assert_includes ORGANIZER, "mobile_video"
    assert_includes ORGANIZER, "autoplay muted loop playsinline"
    assert_includes ORGANIZER, "assets/media/hero-poster.webp"
    assert_includes ORGANIZER, "assets/media/hero-swift.mp4"
    assert_includes ORGANIZER, "assets/media/hero-swift.vtt"
    assert_match(/\.collection-hero--with-mobile-video.*?\.record-organizer,.*?display: none;.*?\.collection-hero__mobile-video.*?display: flex;/m, STYLES)
  end

  def test_homepage_uses_the_phone_cursor_component_option
    assert_includes LAYOUT, "cursor_scanner=true"
    assert_includes ORGANIZER, "data-cursor-scanner="
    assert_includes STYLES, '.record-organizer[data-cursor-scanner="true"]'
  end

  def test_homepage_copy_uses_the_current_brand_without_unverified_metrics
    assert_includes LAYOUT, "Avoid buying the same record twice"
    assert_includes LAYOUT, "what's new in My Vinyl+"
    assert_includes FEATURES, "Explore millions of releases from Discogs."
    assert_includes VIDEO_CAPTIONS, "My Vinyl+ app preview."
    refute_includes LAYOUT, "My Vinyls"
    refute_includes LAYOUT, "aggregateRating"
    refute_includes FEATURES, "15M+"
  end

  def test_content_is_visible_without_intersection_observer_callbacks
    refute_includes ANIMATIONS, 'style.opacity = "0"'
    refute_includes ANIMATIONS, "IntersectionObserver"
  end
end
