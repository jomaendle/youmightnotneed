import { z } from "zod";

export interface CategoryMeta {
  id: string;
  name: string;
  description: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: "layout",
    name: "Layout & Sizing",
    description: "Sizing, positioning, and structuring boxes on the page.",
  },
  {
    id: "scrolling",
    name: "Scroll & Scrollbars",
    description: "Scroll containers, scrollbars, and scroll behavior.",
  },
  {
    id: "animation",
    name: "Animation & Transitions",
    description: "Animating state changes and page transitions.",
  },
  {
    id: "typography",
    name: "Typography & Colour",
    description: "Text layout, wrapping, and color.",
  },
  {
    id: "forms",
    name: "Forms & Interactive Controls",
    description: "Form inputs and interactive UI controls.",
  },
  {
    id: "device-apis",
    name: "Device & System APIs",
    description: "APIs that reach the device or operating system.",
  },
  {
    id: "async-data",
    name: "Async, Observers & Data",
    description: "Asynchronous work, observers, and data handling.",
  },
  {
    id: "formatting",
    name: "Internationalization & Formatting",
    description: "Locale-aware number, date, and time formatting.",
  },
] as const;

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];
export const categorySchema = z.enum(categoryIds);
export type CategoryId = z.infer<typeof categorySchema>;

export const CATEGORIES_BY_ID: Readonly<Record<CategoryId, CategoryMeta>> =
  Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
    CategoryId,
    CategoryMeta
  >;
