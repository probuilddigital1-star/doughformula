import { defineCollection, z } from 'astro:content';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum([
    'fundamentals',
    'techniques',
    'ingredients',
    'styles',
    'troubleshooting',
  ]),
  publishedDate: z.date(),
  updatedDate: z.date().optional(),
  coverImage: z.string().optional(),
  draft: z.boolean().default(false),
});

const fundamentals = defineCollection({ type: 'content', schema: articleSchema });
const techniques = defineCollection({ type: 'content', schema: articleSchema });
const ingredients = defineCollection({ type: 'content', schema: articleSchema });
const styles = defineCollection({ type: 'content', schema: articleSchema });
const troubleshooting = defineCollection({ type: 'content', schema: articleSchema });

export const collections = {
  fundamentals,
  techniques,
  ingredients,
  styles,
  troubleshooting,
};
