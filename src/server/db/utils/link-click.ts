import { redis, safeCacheGet, safeCacheSet } from '@/lib/redis';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { linkClick, linkView } from '../schema';
import { getTotalViewsInWindow } from './link-view';
import { truncate } from './sanitize';

const CACHE_WINDOWS = [7, 30, 90];

type RecordLinkClickInput = {
  bentoId: string;
  href: string;
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

export const recordLinkClick = async (
  linkId: string,
  {
    bentoId,
    href,
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
  }: RecordLinkClickInput
) => {
  await db.insert(linkClick).values({
    linkId,
    bentoId,
    href,
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

  // Cache invalidation is best-effort: a Redis outage shouldn't prevent the
  // click from being recorded.
  try {
    await Promise.all([
      redis.del(`profile-link-clicks:${linkId}`),
      ...CACHE_WINDOWS.flatMap((days) => [
        redis.del(`analytics:clicks-over-time:${linkId}:${days}`),
        redis.del(`analytics:card-stats:${linkId}:${days}`),
      ]),
    ]);
  } catch {
    // ignore — see comment above
  }
};

export const getViewsOverTime = async (linkId: string, days: number) => {
  const cacheKey = `analytics:views-over-time:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ date: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkView.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkView.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkView.createdAt})::date`);

  const result = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getClicksOverTime = async (linkId: string, days: number) => {
  const cacheKey = `analytics:clicks-over-time:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ date: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${linkClick.createdAt})::date`.as(
        'date'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkClick)
    .where(
      and(
        eq(linkClick.linkId, linkId),
        gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`date_trunc('day', ${linkClick.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${linkClick.createdAt})::date`);

  const result = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getCardStats = async (linkId: string, days: number) => {
  const cacheKey = `analytics:card-stats:${linkId}:${days}`;
  const cached =
    await safeCacheGet<
      { bentoId: string; href: string; clicks: number; ctr: number }[]
    >(cacheKey);
  if (cached) {
    return cached;
  }

  const [rows, totalViews] = await Promise.all([
    db
      .select({
        bentoId: linkClick.bentoId,
        href: linkClick.href,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(linkClick)
      .where(
        and(
          eq(linkClick.linkId, linkId),
          gte(linkClick.createdAt, sql`now() - ${`${days} days`}::interval`)
        )
      )
      .groupBy(linkClick.bentoId, linkClick.href)
      .orderBy(desc(sql`count(*)`))
      .limit(200),
    getTotalViewsInWindow(linkId, days),
  ]);

  const result = rows.map((r) => {
    const clicks = Number(r.count);
    return {
      bentoId: r.bentoId,
      href: r.href,
      clicks,
      ctr: totalViews > 0 ? clicks / totalViews : 0,
    };
  });
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getTopReferrers = async (linkId: string, days: number) => {
  const cacheKey = `analytics:top-referrers:${linkId}:${days}`;
  const cached =
    await safeCacheGet<{ referrer: string; count: number }[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      referrer: sql<string>`coalesce(${linkView.referrer}, 'Direto')`.as(
        'referrer'
      ),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(linkView)
    .where(
      and(
        eq(linkView.linkId, linkId),
        gte(linkView.createdAt, sql`now() - ${`${days} days`}::interval`)
      )
    )
    .groupBy(sql`coalesce(${linkView.referrer}, 'Direto')`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const result = rows.map((r) => ({
    referrer: r.referrer,
    count: Number(r.count),
  }));
  await safeCacheSet(cacheKey, result, { ex: 300 });
  return result;
};

export const getTotalClicks = async (linkId: string) => {
  const cached = await safeCacheGet<number | null>(
    `profile-link-clicks:${linkId}`
  );
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(linkClick)
    .where(eq(linkClick.linkId, linkId));

  const count = Number(rows[0]?.count ?? 0);
  await safeCacheSet(`profile-link-clicks:${linkId}`, count, { ex: 30 * 60 });
  return count;
};
