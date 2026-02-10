export const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'daily-specials', name: '$5 Daily Specials', icon: '⭐' },
  { id: 'starters', name: 'Starters', icon: '🍤' },
  { id: 'entrees', name: 'Entrees', icon: '🍖' },
  { id: 'seafood-grits', name: 'Seafood & Grits', icon: '🦞' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'salads', name: 'Salads', icon: '🥗' },
  { id: 'sides', name: 'Sides', icon: '🍟' }
];

export const menuItems = [
  // $5 DAILY SPECIALS - FOOD
  {
    id: 'ds1',
    name: '4 Party Wings & Fries',
    description: 'Four wings in your choice of flavor: lemon pepper, BBQ, mild, or fire. Served with fries',
    price: 5,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  {
    id: 'ds2',
    name: '2 Chicken Tenders & Fries',
    description: 'Two crispy chicken tenders served with fries',
    price: 5,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  {
    id: 'ds3',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken, romaine lettuce, parmesan cheese, and Caesar dressing wrapped in a flour tortilla',
    price: 5,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  {
    id: 'ds4',
    name: 'Thigh Nuggets & Fries',
    description: 'Crispy chicken thigh nuggets served with fries',
    price: 5,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  {
    id: 'ds5',
    name: '2 Tacos',
    description: 'Two tacos with your choice of chicken, fish, veggie, or shrimp (+$1)',
    price: 5,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  {
    id: 'ds6',
    name: 'Catfish Nuggets & Fries',
    description: 'Crispy catfish nuggets served with fries',
    price: 5,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'food'
  },
  
  // $5 DAILY SPECIALS - DRINKS
  {
    id: 'ds7',
    name: 'Whiskey Sour',
    description: 'Classic whiskey sour cocktail',
    price: 5,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  {
    id: 'ds8',
    name: 'Long Island Iced Tea',
    description: 'Classic Long Island Iced Tea cocktail',
    price: 5,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  {
    id: 'ds9',
    name: 'Rum Punch',
    description: 'Refreshing rum punch',
    price: 5,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  {
    id: 'ds10',
    name: 'Margarita',
    description: 'Classic margarita cocktail',
    price: 5,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  {
    id: 'ds11',
    name: 'CK Mondavi White Wines',
    description: 'Chardonnay, Moscato, or Pinot Grigio',
    price: 5,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  {
    id: 'ds12',
    name: 'CK Mondavi Red Wine',
    description: 'Cabernet or Merlot',
    price: 5,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    category: 'daily-specials',
    badges: [],
    type: 'drink'
  },
  
  // STARTERS
  {
    id: '1',
    name: 'F&F Signature Wings',
    description: 'Our special fried wings come in five unique flavors: plain, lemon pepper, BBQ, mild, or fire. You can enjoy them with your choice of ranch or blue cheese dressing',
    price: 15,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '2',
    name: 'Chicken Thigh Nuggets',
    description: 'Perfectly cooked and delicious deep-fried chicken thigh nuggets, seasoned for your enjoyment with a selection of BBQ, honey mustard, ranch, or blue cheese dressing',
    price: 13,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '3',
    name: 'Twisted Tacos',
    description: 'Three corn tortillas come with pickled cabbage, our signature peach and pineapple salsa, jack cheese and topped with herb sour cream. Choose between chicken, catfish, sautéed veggies or shrimp (+$4) as your filling',
    price: 15,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    category: 'starters',
    badges: ['Spicy']
  },
  {
    id: '4',
    name: 'Catfish Nuggets',
    description: 'Freshly caught catfish nuggets fried to perfection and accompanied by your choice of signature rémoulade, tartar or hot sauce',
    price: 15,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '5',
    name: 'Jerk Chicken Egg Rolls',
    description: 'Savory jerk chicken combined with seasoned vegetables, wrapped, fried to a crisp perfection, and served with a pineapple sweet chili sauce',
    price: 15,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    category: 'starters',
    badges: ['Spicy']
  },
  {
    id: '6',
    name: 'Chicken Tenders & Fries',
    description: 'Our signature seasoned chicken tenders come with fries and your choice of honey mustard, BBQ sauce, ranch or blue cheese',
    price: 16,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '7',
    name: 'Fried Pickles',
    description: 'Hand-battered dill pickles, fried to perfection and served with chipotle ranch dressing',
    price: 12,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '8',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled hibachi chicken, romaine lettuce, parmesan cheese, Caesar dressing, wrapped and lightly grilled in a flour tortilla',
    price: 16,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '9',
    name: 'Dynamite Pepper Shrimp',
    description: 'Fresh shrimp are hand-battered, deep-fried and coated in a signature sauce featuring sweet peppers, jalapeños and banana peppers served with chipotle ranch dressing',
    price: 18,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    category: 'starters',
    badges: ['Spicy', 'Chef\'s Special']
  },
  
  // ENTREES
  {
    id: '10',
    name: 'Fried Catfish',
    description: 'Fresh caught catfish, fried to perfection and served with your choice of our signature rémoulade sauce, tartar sauce or hot sauce. Served with two sides',
    price: 22,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '11',
    name: 'Grilled Blackened Catfish',
    description: 'Grilled catfish, perfectly seasoned and served with your choice of our signature rémoulade sauce, tartar sauce or hot sauce. Served with two sides',
    price: 22,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '12',
    name: 'Grilled Honey Bourbon Salmon',
    description: 'Freshly cooked Atlantic salmon, glazed with our signature honey bourbon sauce. Served with two sides',
    price: 31,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '13',
    name: 'Grilled Lobster Tails',
    description: 'Indulge in two delicious lobster tails grilled to perfection and accompanied by our special signature lemon garlic butter. Served with two sides',
    price: 65,
    image: 'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '14',
    name: 'New Zealand Lamb Chops',
    description: 'Four grilled chops, perfectly cooked and accompanied by our special balsamic ginger sauce made in-house. Served with two sides',
    price: 44,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '15',
    name: 'Marinated Malibu Ribeye',
    description: 'Hand-cut ribeye steak marinated in the essence of California and grilled to perfection according to your preference. Served with two sides',
    price: 42,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '16',
    name: 'Stuffed Chicken Breast',
    description: 'Sliced chicken breast stuffed with a blend of herbs, distinct cheeses, and roasted broccoli, topped with a homemade lemon cream sauce and diced tomatoes. Served with two sides',
    price: 26,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '17',
    name: 'Roasted Chicken Thighs',
    description: 'Juicy pan-seared chicken thighs topped with our flavorful orange au jus sauce. Served with two sides',
    price: 22,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '18',
    name: 'Southern Fried Chicken',
    description: 'Three whole wings or two thighs, skillfully seasoned, coated and fried to absolute perfection. Served with two sides',
    price: 22,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '19',
    name: 'Veggie Rice Bowl',
    description: 'A mixture of broccoli, carrots, tomatoes, spinach and mixed peppers sautéed in sweet Thai garlic, served on a bed of rice pilaf',
    price: 20,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'entrees',
    badges: ['Vegetarian']
  },
  {
    id: '20',
    name: 'Chicken & Waffle',
    description: 'Three whole wings or two thighs, expertly seasoned, coated and fried to perfection. Served with a buttermilk waffle and garnished with a dusting of powdered sugar',
    price: 19,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  
  // SEAFOOD & GRITS
  {
    id: '21',
    name: 'Catfish & Grits',
    description: 'Fried catfish expertly cooked and served on a bed of cheese grits. It\'s topped with spinach, roasted peppers and drizzled with our signature parmesan cheese sauce',
    price: 22,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '22',
    name: 'Shrimp & Grits',
    description: 'Grilled shrimp expertly cooked and served on a bed of cheese grits. It\'s topped with spinach, roasted peppers and drizzled with our signature parmesan cheese sauce',
    price: 26,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '23',
    name: 'Salmon & Grits',
    description: 'Grilled salmon expertly cooked and served on a bed of cheese grits. It\'s topped with spinach, roasted peppers and drizzled with our signature parmesan cheese sauce',
    price: 28,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '24',
    name: 'Lobster & Grits',
    description: 'Grilled lobster expertly cooked and served on a bed of cheese grits. It\'s topped with spinach, roasted peppers and drizzled with our signature parmesan cheese sauce',
    price: 75,
    image: 'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  
  // SANDWICHES
  {
    id: '25',
    name: 'F&F Jerk Turkey Burger',
    description: 'Our signature jerk turkey patty is served with pickled cabbage, garlic aioli, melted jack cheese and tomato, drizzled with jerk aioli and topped with our signature peach and pineapple salsa',
    price: 16,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '26',
    name: 'BBQ Chicken Sandwich',
    description: 'Hibachi-grilled or deep-fried chicken breast, garnished with BBQ sauce and melted jack cheese, topped with lettuce, tomatoes and pickles',
    price: 16,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '27',
    name: 'Fire Chicken Sandwich',
    description: 'Grilled or fried chicken breast served with our signature fire sauce, melted jack cheese, sautéed jalapeños',
    price: 16,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '28',
    name: 'Catfish Filet',
    description: 'Deep-fried catfish served with lettuce, tomatoes, and pickles. Paired with your choice of parmesan sauce, tartar sauce or signature rémoulade',
    price: 17,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '29',
    name: 'Salmon Burger',
    description: 'Skinless salmon fillet with a zesty parmesan sauce, lettuce, tomatoes and pickles',
    price: 19,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '30',
    name: 'Kick\'n Chick\'n Sandwich',
    description: 'Deep-fried maitake mushroom served on a toasted bun, topped with fresh lettuce, tomatoes, and pickles. Choose between BBQ or mango habanero sauce',
    price: 16,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    category: 'sandwiches',
    badges: ['Vegetarian']
  },
  
  // SALADS
  {
    id: '31',
    name: 'Chef Salad',
    description: 'Spring mix and romaine lettuce, combined with carrots, cucumbers, tomatoes, jack cheese and croutons',
    price: 16,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'salads',
    badges: []
  },
  {
    id: '32',
    name: 'Caesar Salad',
    description: 'Romaine lettuce, parmesan cheese, and croutons',
    price: 15,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
    category: 'salads',
    badges: []
  },
  
  // SIDES
  {
    id: '33',
    name: 'Mac & Cheese',
    description: 'Creamy, rich macaroni and cheese',
    price: 9,
    image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '34',
    name: 'Whipped Red Potatoes',
    description: 'Creamy whipped red potatoes',
    price: 8,
    image: 'https://images.unsplash.com/photo-1585307833696-98baee8f8fc9?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '35',
    name: 'Sautéed Garlic Spinach',
    description: 'Fresh spinach sautéed with garlic',
    price: 8,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '36',
    name: 'Lemon Butter Broccoli',
    description: 'Fresh broccoli with lemon butter',
    price: 8,
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '37',
    name: 'Jalapeño Roasted Corn',
    description: 'Roasted corn with jalapeños',
    price: 8,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian', 'Spicy']
  },
  {
    id: '38',
    name: 'Crispy Fries',
    description: 'Golden crispy fries',
    price: 7,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '39',
    name: 'Cheese Grits',
    description: 'Creamy cheese grits',
    price: 7,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '40',
    name: 'Chef Salad',
    description: 'Spring mix and romaine lettuce, combined with carrots, cucumbers, tomatoes, jack cheese and croutons',
    price: 7,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '41',
    name: 'Caesar Salad',
    description: 'Romaine lettuce, parmesan cheese, and croutons',
    price: 7,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '42',
    name: 'Rice Pilaf',
    description: 'Seasoned rice pilaf',
    price: 8,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  }
];

