// ============================================================
// HEBLI – Professional category icon (Lucide SVG)
// Auto-maps category name → matching icon.
// Falls back to a generic Coffee icon.
// ============================================================

import {
  Coffee, CupSoda, Milk, Cookie, Cake, IceCream2, Croissant, Sandwich,
  Pizza, Soup, Beer, Wine, GlassWater, Candy, Salad, Apple, Beef, Donut,
  Citrus, type LucideProps,
} from 'lucide-react';

type IconComp = (props: LucideProps) => any;

// Keyword → icon mapping (substring, case-insensitive)
const KEYWORDS: Array<[RegExp, IconComp]> = [
  [/espresso|coffee|caf[eé]|قهوة|espress/i, Coffee],
  [/cappuc|latte|macchiato|mocha|moka/i, Coffee],
  [/tea|the|th[eé]|شاي|matcha/i, Soup],
  [/milk|lait|حليب/i, Milk],
  [/water|eau|ماء/i, GlassWater],
  [/juice|jus|عصير|smoothie|frapp/i, CupSoda],
  [/cold|iced|glac/i, IceCream2],
  [/soda|cola|fanta/i, CupSoda],
  [/beer|bi[eè]re/i, Beer],
  [/wine|vin/i, Wine],
  [/cookie|biscuit/i, Cookie],
  [/cake|g[aâ]teau|tarte|pastr/i, Cake],
  [/croissant|viennoiserie|brioche/i, Croissant],
  [/donut|beignet/i, Donut],
  [/dessert|sweet|sucr/i, Candy],
  [/ice ?cream|gelato|glace/i, IceCream2],
  [/sandwich|panini|burger|wrap/i, Sandwich],
  [/pizza/i, Pizza],
  [/salad|salade/i, Salad],
  [/soup|soupe|chorba/i, Soup],
  [/fruit|apple|pomme/i, Apple],
  [/meat|viande|beef/i, Beef],
  [/citr|orange|lemon|citron/i, Citrus],
];

export function getCategoryIconComponent(name: string): IconComp {
  if (!name) return Coffee;
  for (const [re, comp] of KEYWORDS) {
    if (re.test(name)) return comp;
  }
  return Coffee;
}

interface Props extends LucideProps {
  category: string;
}

export default function CategoryIcon({ category, ...rest }: Props) {
  const Icon = getCategoryIconComponent(category);
  return <Icon {...rest} />;
}
