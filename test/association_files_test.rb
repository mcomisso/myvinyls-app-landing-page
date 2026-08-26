# frozen_string_literal: true

require "json"
require "minitest/autorun"

class AssociationFilesTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def test_apple_association_owns_public_release_routes
    association = JSON.parse(File.read(File.join(ROOT, ".well-known/apple-app-site-association")))
    detail = association.fetch("applinks").fetch("details").first

    assert_equal ["382G4857JD.com.mcomisso.DiscogsClient"], detail.fetch("appIDs")
    paths = detail.fetch("components").map { |component| component.fetch("/") }
    assert_includes paths, "/release/*"
    assert_includes paths, "/record/*"
  end

  def test_android_association_matches_firebase_beta_signer
    associations = JSON.parse(File.read(File.join(ROOT, ".well-known/assetlinks.json")))
    association = associations.fetch(0)
    target = association.fetch("target")

    assert_equal ["delegate_permission/common.handle_all_urls"], association.fetch("relation")
    assert_equal "android_app", target.fetch("namespace")
    assert_equal "com.mcsoftware.myvinyl", target.fetch("package_name")
    assert_equal [
      "42:E4:1F:A4:B1:F3:13:26:E8:5B:20:34:DE:7D:E1:17:8D:92:CA:DE:35:41:20:FC:6A:B0:84:7D:B4:C2:45:58",
    ], target.fetch("sha256_cert_fingerprints")
  end
end
