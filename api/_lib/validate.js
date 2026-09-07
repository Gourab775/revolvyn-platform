// Validation schemas for CMS mutations (server-side, never trust the client).
import { z } from 'zod';

const text = (max = 5000) => z.string().max(max).default('');
const url = (max = 2000) => z.string().max(max).default('');
const id = () => z.string().uuid();

export const sectionPatch = z.object({
  id: id(),
  data: z.record(z.string(), z.unknown()).default({}),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
});

export const sectionsBulk = z.object({
  sections: z.array(sectionPatch).min(1).max(50),
});

const baseItem = {
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
};

export const portfolioCreate = z.object({
  title: text(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: text(2000),
  thumbnail: url(),
  video_url: url(),
  external_url: url(),
  client_name: text(200),
  category: text(100),
  ...baseItem,
});

export const portfolioUpdate = portfolioCreate.partial().extend({ id: id() });

export const brandCreate = z.object({
  name: text(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(),
  logo: url(),
  website_url: url(),
  ...baseItem,
});
export const brandUpdate = brandCreate.partial().extend({ id: id() });

export const serviceCreate = z.object({
  title: text(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: text(3000),
  image: url(),
  icon: text(100),
  details: z.array(z.unknown()).max(20).default([]),
  ...baseItem,
});
export const serviceUpdate = serviceCreate.partial().extend({ id: id() });

export const testimonialCreate = z.object({
  name: text(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(),
  company: text(200),
  role: text(200),
  content: text(3000),
  photo: url(),
  ...baseItem,
});
export const testimonialUpdate = testimonialCreate.partial().extend({ id: id() });

export const settingsPatch = z.object({
  settings: z.record(z.string().max(120), z.unknown()).refine((o) => Object.keys(o).length <= 60, {
    message: 'Too many settings at once',
  }),
});

export const reorderPatch = z.object({
  order: z.array(id()).min(1).max(200),
});

export const restoreBody = z.object({
  version_id: id(),
});

export function parseOr400(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const err = new Error('Some fields look invalid. Please check them and try again.');
    err.status = 400;
    err.publicMessage = 'Some fields look invalid. Please check them and try again.';
    throw err;
  }
  return result.data;
}
