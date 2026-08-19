"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// App-wide theme context (docs/05: theme is React Context, infrequent
// updates). next-themes is exactly that + persistence + no-flash, so it's
// used directly rather than hand-rolled.
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
