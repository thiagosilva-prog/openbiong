import { BentoSchema, ValidLinkSchema } from '@/types';
import * as z from 'zod';

// Deliberately unvalidated (no .max()): these come from public,
// unauthenticated, high-traffic endpoints fed by third-party ad networks.
// Rejecting an oversized value would 400 the whole request instead of just
// skipping tracking. Values are truncated defensively before being stored.
const attributionFields = {
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  fbclid: z.string().optional(),
  gclid: z.string().optional(),
  ttclid: z.string().optional(),
};

export const LinkAvailableSchema = z.object({
  link: z.string().toLowerCase(),
});

const socialLinksFields = {
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  youtube: z.string().optional(),
  twitch: z.string().optional(),
  customLinks: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().optional(),
      })
    )
    .max(10)
    .optional(),
};

export const CreateLinkSchema = z.object({
  link: ValidLinkSchema,
  name: z.string().optional(),
  bio: z.string().optional(),
  ...socialLinksFields,
});

export const GetByLinkSchema = z.object({
  link: z.string(),
  editSession: z.boolean().optional(),
  ...attributionFields,
});

export const TrackClickSchema = z.object({
  linkId: z.string(),
  bentoId: z.string(),
  href: z.string(),
  eventId: z.string().optional(),
  editSession: z.boolean().optional(),
  ...attributionFields,
});

export const GetLinkViewsSchema = z.object({
  id: z.string(),
});

export const UpdateLinkSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  bio: z.string().optional(),
  theme: z.string().optional(),
  accentColor: z.string().nullable().optional(),
  darkMode: z.boolean().optional(),
  contentAlign: z.enum(['left', 'center', 'right']).optional(),
  customDomain: z.string().nullable().optional(),
  customFooter: z.string().nullable().optional(),
  backgroundImage: z.string().nullable().optional(),
  metaPixelId: z
    .string()
    .regex(/^\d+$/, 'O ID do Pixel deve conter apenas números.')
    .nullable()
    .optional(),
  metaCapiToken: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const DeleteLinkSchema = z.object({
  link: z.string(),
});

export const CreateLinkBentoSchema = z.object({
  link: z.string(),
  bento: BentoSchema,
});

export const DeleteLinkBentoSchema = z.object({
  link: z.string(),
  id: z.string(),
});

export const UpdateLinkBentoSchema = z.object({
  link: z.string(),
  bento: BentoSchema,
});
