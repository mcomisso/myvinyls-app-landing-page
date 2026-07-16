#!/usr/bin/env ruby

require "fileutils"
require "json"
require "net/http"
require "time"
require "uri"

FEED_URL = "https://rss.marketingtools.apple.com/api/v2/gb/music/most-played/25/albums.json"
OUTPUT_PATH = File.expand_path("../assets/data/apple-top-albums.json", __dir__)

uri = URI(FEED_URL)
response = Net::HTTP.get_response(uri)
abort "Apple chart request failed with HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)

feed = JSON.parse(response.body).fetch("feed")
albums = feed.fetch("results").first(16).map do |album|
  artwork = album.fetch("artworkUrl100").sub(%r{/\d+x\d+bb\.(jpg|png)$}, '/240x240bb.\1')

  {
    "id" => album.fetch("id"),
    "name" => album.fetch("name"),
    "artist" => album.fetch("artistName"),
    "release_date" => album["releaseDate"],
    "artwork" => artwork,
    "url" => album.fetch("url")
  }
end

payload = {
  "prototype_only" => true,
  "source" => FEED_URL,
  "generated_at" => Time.now.utc.iso8601,
  "albums" => albums
}

FileUtils.mkdir_p(File.dirname(OUTPUT_PATH))
File.write(OUTPUT_PATH, JSON.pretty_generate(payload) + "\n")
puts "Wrote #{albums.length} albums to #{OUTPUT_PATH}"
