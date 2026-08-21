'use client';

import { getThemePreset } from '@/lib/themes';
import Image from 'next/image';
import { type CSSProperties, type ReactNode, useEffect } from 'react';

export default function ThemeWrapper({
  children,
  theme: themeName,
  darkMode,
  accentColor,
  backgroundImage,
}: {
  children: ReactNode;
  theme?: string;
  darkMode?: boolean;
  accentColor?: string | null;
  backgroundImage?: string | null;
}) {
  const theme = getThemePreset(themeName ?? 'default');
  const isDark = darkMode ?? false;
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  const style: CSSProperties = { ...colors } as CSSProperties;

  if (accentColor) {
    (style as Record<string, string>)['--primary'] = accentColor;
    (style as Record<string, string>)['--accent'] = accentColor;
  }

  // Apply theme CSS vars + dark class on body so portaled content (dialogs,
  // toasts, etc.) that renders outside this component's DOM tree still picks
  // up the themed values.
  useEffect(() => {
    const el = document.body;
    const vars = Object.entries(style) as [string, string][];

    for (const [key, value] of vars) {
      el.style.setProperty(key, value);
    }
    if (isDark) {
      el.classList.add('dark');
    }

    return () => {
      for (const [key] of vars) {
        el.style.removeProperty(key);
      }
      el.classList.remove('dark');
    };
  }, [style, isDark]);

  return (
    <div
      className={`${isDark ? 'dark ' : ''}w-full bg-background text-foreground`}
      style={style}
    >
      <div className="fixed inset-0 z-0 bg-background">
        {backgroundImage && (
          <>
            <Image
              src={backgroundImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* Scrim so header/body text stays legible over any photo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        )}
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
