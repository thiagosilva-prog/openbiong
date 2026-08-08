import * as z from 'zod';

const metadataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

const BLOCKED_HOSTNAME_RE =
  /^(localhost|127\.|0\.0\.0\.0|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|.*\.local$)/i;

const META_PATTERNS: Record<'title' | 'description' | 'image', RegExp[]> = {
  title: [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ],
  description: [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ],
  image: [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ],
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function extractMeta(html: string, field: 'title' | 'description' | 'image') {
  for (const pattern of META_PATTERNS[field]) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }
  return;
}

function isSafeUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (BLOCKED_HOSTNAME_RE.test(parsed.hostname)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export const getMetadata = async (rawUrl: string) => {
  const url = isSafeUrl(rawUrl);
  if (!url) {
    return null;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenBioBot/1.0)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return null;
    }

    // Guard against a redirect landing on a blocked/internal host.
    const finalUrl = isSafeUrl(res.url);
    if (!finalUrl) {
      return null;
    }

    const html = await res.text();
    const title = extractMeta(html, 'title');
    if (!title) {
      return null;
    }

    const description = extractMeta(html, 'description');
    const imageRaw = extractMeta(html, 'image');
    const image = imageRaw ? new URL(imageRaw, finalUrl).toString() : undefined;

    return metadataSchema.parse({ title, description, image });
  } catch {
    return null;
  }
};
