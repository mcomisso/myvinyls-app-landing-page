# frozen_string_literal: true

require "minitest/autorun"
require "yaml"

class UnpublishedWorkingFilesTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def test_every_root_markdown_file_without_a_layout_is_excluded_from_the_site
    published_working_files = root_markdown_files.reject { |name| layout?(name) || excluded.include?(name) }

    assert_empty published_working_files
  end

  def test_agent_instructions_and_design_qa_report_are_excluded_from_the_site
    assert_includes excluded, "AGENTS.md"
    assert_includes excluded, "design-qa.md"
  end

  private

  def excluded
    YAML.safe_load_file(File.join(ROOT, "_config.yml"), permitted_classes: [Symbol]).fetch("exclude")
  end

  def root_markdown_files
    Dir.children(ROOT).select { |name| name.end_with?(".md") && File.file?(File.join(ROOT, name)) }.sort
  end

  def layout?(name)
    front_matter = File.read(File.join(ROOT, name), encoding: "UTF-8")[/\A---\s*\n(.*?)\n---\s*\n/m, 1]
    return false if front_matter.nil?

    values = YAML.safe_load(front_matter, permitted_classes: [Date, Time])
    values.is_a?(Hash) && values.key?("layout")
  end
end
