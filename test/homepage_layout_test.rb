# frozen_string_literal: true

require "minitest/autorun"

class HomepageLayoutTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  LAYOUT = File.read(File.join(ROOT, "_layouts/default.html"))
  ANIMATIONS = File.read(File.join(ROOT, "assets/js/animations.js"))

  def test_homepage_uses_the_stable_media_hero
    assert_includes LAYOUT, 'class="hero-container"'
    assert_includes LAYOUT, "assets/media/hero-swift.mp4"
    refute_includes LAYOUT, "data-record-organizer"
    refute_includes LAYOUT, "assets/js/record-organizer.js"
  end

  def test_content_is_visible_without_intersection_observer_callbacks
    refute_includes ANIMATIONS, 'style.opacity = "0"'
    refute_includes ANIMATIONS, "IntersectionObserver"
  end
end
