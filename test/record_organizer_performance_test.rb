# frozen_string_literal: true

require "minitest/autorun"

class RecordOrganizerPerformanceTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  SCRIPT = File.read(File.join(ROOT, "assets/js/record-organizer.js"))
  STYLES = File.read(File.join(ROOT, "main.scss"))
  BETA_ORGANIZER = File.read(File.join(ROOT, "_includes/beta-organizer.html"))
  REFRESH_SCRIPT = File.read(File.join(ROOT, "scripts/refresh_apple_chart.rb"))
  CHART_DATA = File.read(File.join(ROOT, "assets/data/apple-top-albums.json"))

  def test_pointer_updates_are_coalesced_into_animation_frames
    assert_includes SCRIPT, "requestAnimationFrame(flushPhonePosition)"
    assert_includes SCRIPT, 'stage.addEventListener("pointermove", schedulePhoneMove)'
    assert_includes SCRIPT, "if (phoneFrameRequest !== null) return"
    assert_includes SCRIPT, "phoneFrameRequest = null"
  end

  def test_organizer_exposes_effect_events_without_moving_state_out_of_the_dom
    assert_includes SCRIPT, 'new CustomEvent("recordorganizer:ready"'
    assert_includes SCRIPT, 'new CustomEvent("recordorganizer:scan"'
    assert_includes SCRIPT, 'new CustomEvent("recordorganizer:organized"'
    assert_includes SCRIPT, 'new CustomEvent("recordorganizer:scatter"'
  end

  def test_hover_organization_can_be_disabled_for_preview_effects
    assert_includes SCRIPT, 'stage.dataset.organizeOnHover !== "false"'
    assert_match(/if \(organizeOnHover\).*?pointerenter.*?focus/m, SCRIPT)
    assert_includes SCRIPT, 'record.addEventListener("click", () => organize(record))'
    assert_includes SCRIPT, 'stage.dataset.vinylPreview === "true"'
    assert_includes SCRIPT, 'vinyl.className = "record-sleeve__vinyl"'
  end

  def test_record_layout_batches_measurement_before_mutation
    assert_includes SCRIPT, "const measureRecordPositions"
    assert_includes SCRIPT, "const applyRecordPositions"

    layout_body = SCRIPT[/const layoutRecords = \(\) => \{(?<body>.*?)\n  \};/m, :body]
    refute_nil layout_body
    assert_operator layout_body.index("measureRecordPositions"), :<, layout_body.index("applyRecordPositions")

    measure_section = SCRIPT[/const measureRecordPositions.*?(?=const applyRecordPositions)/m]
    apply_section = SCRIPT[/const applyRecordPositions.*?(?=const layoutRecords)/m]
    position_write_section = SCRIPT[/const applyRecordPosition.*?(?=const measureSlotPosition)/m]
    assert_includes measure_section, "getBoundingClientRect"
    refute_includes measure_section, ".style."
    assert_includes apply_section, "applyRecordPosition"
    refute_includes apply_section, "getBoundingClientRect"
    assert_includes position_write_section, ".style.transform"
    refute_includes position_write_section, "getBoundingClientRect"
  end

  def test_interactive_hero_avoids_persistent_expensive_compositor_effects
    organizer_styles = STYLES[/\.record-organizer \{(?<body>.*?)\/\/ APP GALLERY SECTION/m, :body]
    refute_nil organizer_styles
    refute_match(/will-change:/, organizer_styles)
    refute_match(/backdrop-filter:/, organizer_styles)
    refute_match(/(^|\s)filter:/, organizer_styles)
  end

  def test_phone_frame_uses_a_small_web_asset
    asset = File.join(ROOT, "assets/iphone-frame.png")

    assert_includes BETA_ORGANIZER, "assets/iphone-frame.png"
    refute_includes BETA_ORGANIZER, "Frames/iPhone 14 Pro Portrait.png"
    assert_match(/width="90" height="183"/, BETA_ORGANIZER)
    assert_path_exists asset
    assert_operator File.size(asset), :<, 50_000

    data = File.binread(asset)
    assert_equal "\x89PNG\r\n\x1a\n".b, data[0, 8]
    assert_equal [270, 549], data.byteslice(16, 8).unpack("NN")
  end

  def test_chart_artwork_is_requested_at_display_appropriate_resolution
    assert_includes REFRESH_SCRIPT, "/240x240bb."
    refute_includes REFRESH_SCRIPT, "/600x600bb."
    refute_includes CHART_DATA, "/600x600bb."
  end
end
