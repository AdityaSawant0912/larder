import type { CapacitorConfig } from "@capacitor/cli";

// The native shell has no logic of its own — it just loads the deployed
// site (docs/04-architecture.md: three surfaces, one deployed codebase).
// `server.url` means Capacitor loads that live URL directly; `webDir`
// only needs to satisfy the CLI, nothing gets bundled from it.
const config: CapacitorConfig = {
  appId: "dev.adityasawant.larder",
  appName: "Larder",
  webDir: "public",
  server: {
    // TODO: replace with the real deployed URL once live (docs/04:
    // `<app>.adityasawant.dev`).
    url: "https://larder.adityasawant.dev",
    androidScheme: "https",
  },
};

export default config;
