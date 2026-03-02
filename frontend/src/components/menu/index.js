// Menu Display Styles Index
// Based on https://nicheaddons.com/demos/restaurant/elements/menu-element/

export { MenuStyleOne } from './MenuStyleOne';
export { MenuStyleTwo } from './MenuStyleTwo';
export { MenuStyleThree } from './MenuStyleThree';
export { MenuStyleFour } from './MenuStyleFour';

// Style descriptions for admin UI
export const MENU_STYLES = {
  style_one: {
    id: 'style_one',
    name: 'Horizontal Card',
    description: 'Image on left, title + price with dotted line, description below',
    icon: '▭',
    gridClass: 'grid-cols-1 lg:grid-cols-2 gap-4'
  },
  style_two: {
    id: 'style_two',
    name: 'Vertical Card',
    description: 'Centered circular image with price badge, title and description below',
    icon: '▢',
    gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
  },
  style_three: {
    id: 'style_three',
    name: 'Compact Row',
    description: 'Small square image, title, description, star rating, price',
    icon: '☰',
    gridClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
  },
  style_four: {
    id: 'style_four',
    name: 'Pastel Card',
    description: 'Rounded image on pastel background with View button',
    icon: '⬜',
    gridClass: 'grid-cols-1 md:grid-cols-2 gap-4'
  },
  default: {
    id: 'default',
    name: 'Default',
    description: 'Standard menu card layout',
    icon: '▣',
    gridClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
  }
};

// Default style assignments per category
export const DEFAULT_CATEGORY_STYLES = {
  'daily-specials': 'style_one',
  'starters': 'style_three',
  'sides': 'style_four',
  'entrees': 'style_one',
  'seafood-grits': 'style_two',
  'sandwiches': 'style_three',
  'salads': 'style_four',
  'beer-wine': 'default',
  'cocktails': 'style_two',
  'signature-cocktails': 'style_two',
  'mocktails': 'style_four',
  'sodas-spritzers': 'style_four',
  'teas-lemonades': 'default',
  'chilled-juices': 'default',
  'custom-lemonades': 'default',
  'hookah': 'style_one',
  'brunch': 'style_one',
  'brunch-drinks': 'style_two',
  'brunch-sides': 'style_three'
};
