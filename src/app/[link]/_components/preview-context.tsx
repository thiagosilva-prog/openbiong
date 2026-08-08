'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

export type Viewport = 'desktop' | 'mobile';

const PreviewContext = createContext<{
  preview: boolean;
  setPreview: (v: boolean) => void;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  editSession: boolean;
}>({
  preview: false,
  setPreview: () => undefined,
  viewport: 'desktop',
  setViewport: () => undefined,
  editSession: false,
});

export function PreviewProvider({
  children,
  initialPreview = true,
  editSession = false,
}: {
  children: React.ReactNode;
  initialPreview?: boolean;
  editSession?: boolean;
}) {
  const [preview, setPreview] = useState(initialPreview);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  return (
    <PreviewContext.Provider
      value={{ preview, setPreview, viewport, setViewport, editSession }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
