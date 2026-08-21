"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth/client";
import { DebugServer } from "@/lib/native/debugServer";
import { DEBUG_EMAIL, PROD_SERVER_URL } from "@/lib/constants/debug";

const LOCAL_URL_KEY = "larder:debug:lastLocalUrl";

export default function DebugSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const isNative = Capacitor.isNativePlatform();

  const [target, setTarget] = useState<"prod" | "local">("prod");
  const [localUrl, setLocalUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user.email !== DEBUG_EMAIL) {
      router.replace("/settings");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    setLocalUrl(localStorage.getItem(LOCAL_URL_KEY) ?? "");
    if (!isNative) return;
    DebugServer.getServerUrl().then(({ url }) => setCurrentUrl(url || PROD_SERVER_URL));
  }, [isNative]);

  async function apply() {
    const url = target === "prod" ? PROD_SERVER_URL : localUrl.trim();
    if (!url) return;
    if (target === "local") localStorage.setItem(LOCAL_URL_KEY, url);
    setApplying(true);
    await DebugServer.setServerUrl({ url });
    setCurrentUrl(url);
    setApplying(false);
  }

  if (isPending || session?.user.email !== DEBUG_EMAIL) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <Link href="/settings" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <h1 className="mb-4 font-display text-3xl">Debug</h1>

      <div className="space-y-4 rounded-lg border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">Server</p>
          <p className="text-xs text-muted-foreground">
            {isNative ? `Currently loaded: ${currentUrl ?? "…"}` : "Only takes effect inside the native app."}
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Target</Label>
          <Select value={target} onValueChange={(v) => v && setTarget(v as "prod" | "local")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prod">Production ({PROD_SERVER_URL})</SelectItem>
              <SelectItem value="local">Local network</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {target === "local" && (
          <div className="space-y-1">
            <Label className="text-xs">Local address</Label>
            <Input
              placeholder="http://192.168.1.23:3000"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
            />
          </div>
        )}

        <Button
          className="w-full"
          disabled={!isNative || applying || (target === "local" && !localUrl.trim())}
          onClick={apply}
        >
          {applying ? "Applying..." : "Apply and reload"}
        </Button>
      </div>
    </div>
  );
}
