import { registerPlugin } from "@capacitor/core";

// Native counterpart: android/app/src/main/java/dev/adityasawant/larder/DebugServerPlugin.java.
// No iOS implementation yet (no ios/ platform in this repo).
export interface DebugServerPlugin {
  getServerUrl(): Promise<{ url: string }>;
  setServerUrl(options: { url: string }): Promise<void>;
}

export const DebugServer = registerPlugin<DebugServerPlugin>("DebugServer");
