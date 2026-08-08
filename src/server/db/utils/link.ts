import { redis } from '@/lib/redis';
import { type BentoSchema, type LinkBento, ValidLinkSchema } from '@/types';
import type * as z from 'zod';
import { type InferSelectModel, eq, sql } from '..';
import { db } from '../db';
import { link } from '../schema';

type SelectProfileLinkColumns = {
  id?: boolean | undefined;
  link?: boolean | undefined;
  image?: boolean | undefined;
  name?: boolean | undefined;
  bio?: boolean | undefined;
  bento?: boolean | undefined;
  createdAt?: boolean | undefined;
  updatedAt?: boolean | undefined;
  userId?: boolean | undefined;
};

const CACHE_TTL_SECONDS = 30 * 60;

// Caching is best-effort: a Redis outage or misconfiguration should never
// take down profile pages, so failures here are swallowed rather than thrown.
async function getCachedProfileLink(inputLink: string) {
  try {
    return await redis.get<InferSelectModel<typeof link> | null>(
      `profile-link:${inputLink}`
    );
  } catch {
    return null;
  }
}

async function cacheProfileLink(
  result: InferSelectModel<typeof link> | undefined
) {
  if (!result) {
    return;
  }
  try {
    await redis.set(`profile-link:${result.link}`, result, {
      ex: CACHE_TTL_SECONDS,
    });
  } catch {
    // ignore — see comment above
  }
}

export const getProfileLinkByLink = async (
  inputLink: string,
  columns?: SelectProfileLinkColumns
) => {
  const cached = await getCachedProfileLink(inputLink);

  if (cached) {
    return cached;
  }

  const result = await db.query.link.findFirst({
    where: (_link, { eq }) => eq(_link.link, inputLink),
    columns,
  });

  await cacheProfileLink(result);

  return result;
};

export const getProfileLinkById = async (
  id: string,
  columns?: SelectProfileLinkColumns
) => {
  const result = await db.query.link.findFirst({
    where: (_link, { eq }) => eq(_link.id, id),
    columns,
  });

  return result;
};

export const isProfileLinkAvailable = async (link: string) => {
  const profileLink = await getProfileLinkByLink(link);

  return profileLink ? false : ValidLinkSchema.safeParse(link).success;
};

export const getProfileLinksOfUser = async (userId: string) => {
  const result = await db.query.link.findMany({
    where: (link, { eq }) => eq(link.userId, userId),
  });

  return result;
};

export const getProfileLinksCountOfUser = async (userId: string) => {
  const profileLinks = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(link)
    .where(eq(link.userId, userId));

  const nProfileLinks = profileLinks[0]?.count ?? 0;

  return nProfileLinks;
};

export const createProfileLink = async (data: {
  link: string;
  userId: string;
  image?: string;
  name: string;
  bio?: string;
  bento: LinkBento[];
}) => {
  const result = await db.insert(link).values(data).returning().execute();

  await cacheProfileLink(result[0]);

  return result[0];
};

export const canModifyProfileLink = async ({
  userId,
  linkId,
  link: linkSlug,
}: {
  userId: string;
  linkId?: string;
  link?: string;
}) => {
  let profileLink: InferSelectModel<typeof link> | undefined | null = null;
  if (linkId) {
    profileLink = await getProfileLinkById(linkId);
  } else if (linkSlug) {
    profileLink = await getProfileLinkByLink(linkSlug);
  }

  const canModify = profileLink?.userId === userId;

  if (!canModify) {
    throw new Error("You can't modify this profile link");
  }

  return canModify;
};

export const updateProfileLink = async (data: {
  id: string;
  name?: string;
  bio?: string;
  theme?: string;
  accentColor?: string | null;
  darkMode?: boolean;
  contentAlign?: 'left' | 'center' | 'right';
  customDomain?: string | null;
  customFooter?: string | null;
  isPublic?: boolean;
  bento?: z.infer<typeof BentoSchema>[];
}) => {
  const result = await db
    .update(link)
    .set(data)
    .where(eq(link.id, data.id))
    .returning()
    .execute();

  await cacheProfileLink(result[0]);

  return result[0];
};

export const deleteProfileLink = async (inputLink: string) => {
  await db.delete(link).where(eq(link.link, inputLink)).execute();

  try {
    await redis.del(`profile-link:${inputLink}`);
  } catch {
    // ignore — caching is best-effort
  }
};

export const addProfileLinkBento = async (
  inputLink: string,
  bento: z.infer<typeof BentoSchema>
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).concat(bento),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await cacheProfileLink(result[0]);

  return result[0]?.bento;
};

export const deleteProfileLinkBento = async (
  inputLink: string,
  bentoId: string
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).filter((b) => b.id !== bentoId),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await cacheProfileLink(result[0]);
};

export const updateProfileLinkBento = async (
  inputLink: string,
  bento: z.infer<typeof BentoSchema>
) => {
  const profileLink = await getProfileLinkByLink(inputLink);

  const result = await db
    .update(link)
    .set({
      bento: (profileLink?.bento ?? []).map((b) =>
        b.id === bento.id ? bento : b
      ),
    })
    .where(eq(link.link, inputLink))
    .returning()
    .execute();

  await cacheProfileLink(result[0]);
};
