import { z } from "zod";

/**
 * The ids, as a literal tuple. Declaring them here rather than deriving them
 * from CATEGORIES with a cast is what keeps CategoryId a closed union: a
 * `as [string, ...string[]]` cast widens the element type back to string, and
 * z.enum then infers string, so a typo'd category would type-check.
 */
const CATEGORY_IDS = [
  "layout",
  "scrolling",
  "animation",
  "typography",
  "forms",
  "device-apis",
  "async-data",
  "formatting",
] as const;

export const categorySchema = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof categorySchema>;

export interface CategoryMeta {
  id: CategoryId;
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

export const CATEGORIES_BY_ID: Readonly<Record<CategoryId, CategoryMeta>> =
  Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
    CategoryId,
    CategoryMeta
  >;
