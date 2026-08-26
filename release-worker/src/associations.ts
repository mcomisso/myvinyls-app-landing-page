export const appleAppSiteAssociation = {
  applinks: {
    details: [
      {
        appIDs: ["382G4857JD.com.mcomisso.DiscogsClient"],
        components: [
          { "/": "/events/*", comment: "App Store In-App Event and campaign links." },
          { "/": "/record/*", comment: "Record detail links." },
          { "/": "/release/*", comment: "Release detail links." },
          { "/": "/search", comment: "Search entry point." },
          { "/": "/search/*", comment: "Search result links." },
          { "/": "/collection", comment: "Collection entry point." },
          { "/": "/marketplace", comment: "Marketplace entry point." },
        ],
      },
    ],
  },
} as const;

export const androidAssetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.mcsoftware.myvinyl",
      sha256_cert_fingerprints: [
        "42:E4:1F:A4:B1:F3:13:26:E8:5B:20:34:DE:7D:E1:17:8D:92:CA:DE:35:41:20:FC:6A:B0:84:7D:B4:C2:45:58",
      ],
    },
  },
] as const;

export function associationDocument(pathname: string): unknown | undefined {
  switch (pathname) {
    case "/.well-known/apple-app-site-association":
      return appleAppSiteAssociation;
    case "/.well-known/assetlinks.json":
      return androidAssetLinks;
    default:
      return undefined;
  }
}
