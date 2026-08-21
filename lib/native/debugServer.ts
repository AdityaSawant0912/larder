import { registerPlugin } from "@capacitor/core";

// Native counterpart: android/app/src/main/java/dev/adityasawant/larder/DebugServerPlugin.java.
// No iOS implementation yet — the ios/ platform exists but has no
// DebugServerPlugin counterpart (no Mac to build/test it against).
export interface DebugServerPlugin {
  getServerUrl(): Promise<{ url: string }>;
  setServerUrl(options: { url: string }): Promise<void>;
}

export const DebugServer = registerPlugin<DebugServerPlugin>("DebugServer");
