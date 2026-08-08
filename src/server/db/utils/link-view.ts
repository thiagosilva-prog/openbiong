import { redis, safeCacheGet, safeCacheSet } from '@/lib/redis';
import { UAParser } from 'ua-parser-js';
import { and, count, countDistinct, desc, eq, gte, sql } from '..';
import { db } from '../db';
import { linkView } from '../schema';
import { truncate } from './sanitize';

const CACHE_WINDOWS = [7, 30, 90];

export const getProfileLinkViews = async (linkId: string) => {
  const cached = await safeCacheGet<number | null>(
    `profile-link-views:${linkId}`
  );

  if (cached) {
    return cached;
  }

  const views = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  await safeCacheSet(`profile-link-views:${linkId}`, views[0]?.count ?? 0, {
    ex: 30 * 60,
  });

  return views[0]?.count ?? 0;
};

type RecordLinkViewInput = {
  ip: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
};

export const recordLinkView = async (
  linkId: string,
  {
    ip,
    userAgent,
    referrer,
    country,
    region,
    city,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    fbclid,
    gclid,
    ttclid,
  }: RecordLinkViewInput
) => {
  const exists = await db.query.linkView.findFirst({
    where: (linkView, { eq, and, sql }) =>
      and(
        eq(linkView.ip, ip ?? 'Unknown'),
        eq(linkView.linkId, linkId),
        sql`created_at > now() - interval '1 hour'`
      ),
    columns: {
      id: true,
    },
  });

  if (!exists) {
    await db.insert(linkView).values({
      linkId,
      ip,
      userAgent,
      referrer,
      country,
      region: truncate(region, 10),
      city: truncate(city),
      utmSource: truncate(utmSource),
      utmMedium: truncate(utmMedium),
      utmCampaign: truncate(utmCampaign),
      utmTerm: truncate(utmTerm),
      utmContent: truncate(utmContent),
      fbclid: truncate(fbclid),
      gclid: truncate(gclid),
      ttclid: truncate(ttclid),
    });

    // Cache invalidation is best-effort: a Redis outage shouldn't prevent
    // the view from being recorded.
    try {
      await Promise.all([
        redis.del(`profile-link-views:${linkId}`),
        redis.del(`profile-link-unique-views:${linkId}`),
        ...CACHE_WINDOWS.flatMap((days) => [
          redis.del(`analytics:views-over-time:${linkId}:${days}`),
          redis.del(`analytics:top-referrers:${linkId}:${days}`),
          redis.del(`analytics:devices:${linkId}:${days}`),
          redis.del(`analytics:geo:${linkId}:${days}`),
          redis.del(`analytics:utm:${linkId}:${days}`),
          redis.del(`analytics:traffic-source:${linkId}:${days}`),
          redis.del(`analytics:locations:${linkId}:${days}`),
          redis.del(`analytics:card-stats:${linkId}:${days}`),
          redis.del(`profile-link-views-window:${linkId}:${days}`),
        ]),
      ]);
    } catch {
      // ignore — see comment above
    }
  }
};

export async function getProfileLinkUniqueViews(
  linkId: string
): Promise<number> {
  const cacheKey = `profile-link-unique-views:${linkId}`;
  const cached = await safeCacheGet<number>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const result = await db
    .select({ count: countDistinct(linkView.ip) })
    .from(linkView)
    .where(eq(linkView.linkId, linkId));

  const count = Number(result[0]?.count ?? 0);
  await safeCacheSet(cacheKey, count, { ex: 1800 });
  return count;
}

export async function getDeviceBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:devices:${linkId}:${days}`;
  const cached = await safeCacheGet(cacheKey);
  if (cached) {
    return cached as {
      devices: { device: string; count: number }[];
      browsers: { browser: string; count: number }[];
    };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({ userAgent: linkView.userAgent })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)));

  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};

  for (const row of rows) {
    const ua = UAParser(row.userAgent ?? undefined);
    const device = ua.device.type || 'desktop';
    const browser = ua.browser.name || 'Desconhecido';
    devices[device] = (devices[device] ?? 0) + 1;
    browsers[browser] = (browsers[browser] ?? 0) + 1;
  }

  const result = {
    devices: Object.entries(devices)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count),
    browsers: Object.entries(browsers)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count),
  };

  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
}

export async function getGeoBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:geo:${linkId}:${days}`;
  const cached = await safeCacheGet(cacheKey);
  if (cached) {
    return cached as { country: string; count: number }[];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      country: sql<string>`coalesce(${linkView.country}, 'Desconhecido')`,
      count: count(),
    })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(linkView.country)
    .orderBy(desc(count()))
    .limit(20);

  const mapped = result.map((r) => ({
    country: r.country,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, mapped, { ex: 300 });
  return mapped;
}

export async function getTotalViewsInWindow(linkId: string, days: number) {
  const cacheKey = `profile-link-views-window:${linkId}:${days}`;
  const cached = await safeCacheGet<number>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({ count: count() })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)));

  const total = Number(result[0]?.count ?? 0);
  await safeCacheSet(cacheKey, total, { ex: 300 });
  return total;
}

export async function getUtmBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:utm:${linkId}:${days}`;
  const cached = await safeCacheGet(cacheKey);
  if (cached) {
    return cached as {
      source: string;
      medium: string;
      campaign: string;
      count: number;
    }[];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const source = sql<string>`coalesce(${linkView.utmSource}, 'Direto')`;
  const medium = sql<string>`coalesce(${linkView.utmMedium}, 'nenhum')`;
  const campaign = sql<string>`coalesce(${linkView.utmCampaign}, '(não definido)')`;

  const result = await db
    .select({ source, medium, campaign, count: count() })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(source, medium, campaign)
    .orderBy(desc(count()))
    .limit(20);

  const mapped = result.map((r) => ({
    source: r.source,
    medium: r.medium,
    campaign: r.campaign,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, mapped, { ex: 300 });
  return mapped;
}

export async function getTrafficSourceBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:traffic-source:${linkId}:${days}`;
  const cached = await safeCacheGet(cacheKey);
  if (cached) {
    return cached as { source: string; count: number }[];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Priority order for the rare URL that carries more than one click-id.
  const source = sql<string>`case
    when ${linkView.fbclid} is not null then 'Facebook/Instagram Ads'
    when ${linkView.gclid} is not null then 'Google Ads'
    when ${linkView.ttclid} is not null then 'TikTok Ads'
    else 'Orgânico/Direto'
  end`;

  const result = await db
    .select({ source, count: count() })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(source)
    .orderBy(desc(count()));

  const mapped = result.map((r) => ({
    source: r.source,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, mapped, { ex: 300 });
  return mapped;
}

export async function getLocationBreakdown(linkId: string, days: number) {
  const cacheKey = `analytics:locations:${linkId}:${days}`;
  const cached = await safeCacheGet(cacheKey);
  if (cached) {
    return cached as {
      country: string;
      region: string;
      city: string;
      count: number;
    }[];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const country = sql<string>`coalesce(${linkView.country}, 'Desconhecido')`;
  const region = sql<string>`coalesce(${linkView.region}, 'Desconhecido')`;
  const city = sql<string>`coalesce(${linkView.city}, 'Desconhecido')`;

  const result = await db
    .select({ country, region, city, count: count() })
    .from(linkView)
    .where(and(eq(linkView.linkId, linkId), gte(linkView.createdAt, since)))
    .groupBy(country, region, city)
    .orderBy(desc(count()))
    .limit(15);

  const mapped = result.map((r) => ({
    country: r.country,
    region: r.region,
    city: r.city,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, mapped, { ex: 300 });
  return mapped;
}
