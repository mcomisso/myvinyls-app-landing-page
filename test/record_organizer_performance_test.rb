# frozen_string_literal: true

require "minitest/autorun"

class RecordOrganizerPerformanceTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  SCRIPT = File.read(File.join(ROOT, "assets/js/record-organizer.js"))
  STYLES = File.read(File.join(ROOT, "main.scss"))
  BETA_ORGANIZER = File.read(File.join(ROOT, "_includes/beta-organizer.html"))
  REFRESH_SCRIPT = File.read(File.join(ROOT, "scripts/refresh_apple_chart.rb"))
  CHART_DATA = File.read(File.join(ROOT, "assets/data/apple-top-albums.json"))

  def test_records_land_in_the_collection_grid_inside_the_phone
    assert_match(/class="organizer-phone".*?class="organized-grid" data-organized-grid/m, BETA_ORGANIZER)
    assert_includes BETA_ORGANIZER, 'class="app-collection-title">Collection'
    assert_includes BETA_ORGANIZER, 'class="app-record-slot"'
    assert_includes SCRIPT, 'slot.querySelector("img").src = record.dataset.artwork'
    assert_includes SCRIPT, 'slot.querySelector("strong").textContent = record.dataset.title'
    assert_includes SCRIPT, 'slot.querySelector("small").textContent = record.dataset.artist'
  end

  def test_fixed_phone_does_not_follow_pointer
    refute_includes SCRIPT, "schedulePhoneMove"
    refute_includes SCRIPT, 'stage.addEventListener("pointermove"'
    refute_includes SCRIPT, "phoneFrameRequest"
  end

  def test_reset_cancels_records_that_are_still_flying
    assert_includes SCRIPT, "record.dataset.scanToken = scanToken"
    assert_includes SCRIPT, "if (record.dataset.scanToken !== scanToken) return"
    assert_includes SCRIPT, "delete record.dataset.scanToken"
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
    assert_includes position_write_section, "position.scale"
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
    assert_match(/width="300" height="610"/, BETA_ORGANIZER)
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
