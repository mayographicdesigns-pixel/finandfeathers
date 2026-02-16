export const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'daily-specials', name: '$5 Daily Specials', icon: '⭐' },
  { id: 'starters', name: 'Starters', icon: '🍤' },
  { id: 'sides', name: 'Sides', icon: '🍟' },
  { id: 'entrees', name: 'Entrees', icon: '🍖' },
  { id: 'seafood-grits', name: 'Seafood & Grits', icon: '🦞' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'salads', name: 'Salads', icon: '🥗' },
  { id: 'cocktails', name: 'Signature Cocktails', icon: '🍹' },
  { id: 'brunch', name: 'Brunch', icon: '🥞' },
  { id: 'brunch-sides', name: 'Brunch Sides', icon: '🥓' }
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
  },
  
  // SIGNATURE COCKTAILS
  {
    id: 'c1',
    name: 'California Dreaming',
    description: 'A colorful punch that gives you island vibes. Made with Malibu rum, Captain Morgan spiced rum, pineapple juice, melon liqueur, sour mix and a splash of blue curaçao',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c2',
    name: 'Sunset Blvd',
    description: 'F&F\'s best selling beverage! Hennessey, agave, freshly muddled lime and simple syrup',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: ['Chef\'s Special']
  },
  {
    id: 'c3',
    name: 'LAX Sidecar',
    description: 'A delightfully sweet variation of the traditional sidecar martini! Crafted with Remy Martin VSOP, freshly muddled citrus and a hint of simple syrup',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c4',
    name: 'Marina Del Rey',
    description: 'Our rum punch includes Malibu rum, pineapple juice, cranberry juice, lime juice and grenadine',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c5',
    name: 'The 405',
    description: 'A popular boozy delight! Uncle Nearest 100-proof whiskey mixed with a hint of lemon juice and agave',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c6',
    name: 'Baldwin Hills',
    description: 'A unique cocktail exclusive to our establishment! Crafted with Island Jon Apple Guava Vodka, strawberry puree and pineapple juice',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c7',
    name: 'East LA',
    description: 'A bit sweet, a bit tart, and absolutely delightful! Crafted with Gran Coramino Reposado tequila, fresh lime, simple syrup and a red wine float',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c8',
    name: 'Melrose Ave',
    description: 'A refreshing summer cocktail crafted with Peach Cîroc, pineapple juice and a hint of grenadine',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: 'c9',
    name: 'Pacific Coast Hwy',
    description: 'A sophisticated margarita crafted with Rémy Martin 1738 Cognac—a favorite among the socialites at Fin & Feathers',
    price: 17,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: ['Chef\'s Special']
  },
  
  // BRUNCH
  {
    id: 'b1',
    name: 'All Star Breakfast',
    description: 'Two eggs prepared in any style, served with breakfast potatoes or cheese grits, accompanied by a choice of bacon or chicken sausage and a biscuit',
    price: 15,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b2',
    name: 'Edgewood Breakfast',
    description: 'Two eggs prepared in any style, along with a selection of bacon or chicken sausage. Enjoy two pancakes or a waffle garnished with powdered sugar, blueberries and strawberries',
    price: 17,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b3',
    name: 'French Toast Breakfast',
    description: 'Delicious French toast topped with powdered sugar, a triple sec sugar glaze, fresh blueberries, and strawberries. Enjoy it with two eggs and your choice of bacon or chicken sausage, or three wings for an additional $6',
    price: 18,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b4',
    name: 'Chicken & Waffle',
    description: 'Three whole wings or a boneless thigh, seasoned, battered and fried to perfection, served with a waffle dusted with powdered sugar and garnished with blueberries and strawberries',
    price: 19,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b5',
    name: 'Ultimate French Toast Sandwich',
    description: 'Frosted French toast sandwich stuffed with scrambled cheesy eggs, bacon, or chicken sausage, topped with a triple sec sugar glaze and a dusting of powdered sugar',
    price: 20,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b6',
    name: 'Breakfast Burrito',
    description: 'A flour tortilla filled with three eggs, bacon or chicken sausage, green peppers, red peppers, mushrooms, spinach, tomatoes and cheese',
    price: 17,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b7',
    name: 'Lamb Chops & Eggs',
    description: 'Three New Zealand lamb chops grilled and served with a balsamic ginger sauce, two eggs cooked to your liking and a choice of breakfast potatoes or cheese grits and a biscuit',
    price: 32,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    category: 'brunch',
    badges: ['Chef\'s Special']
  },
  {
    id: 'b8',
    name: 'Malibu Ribeye & Eggs',
    description: 'Hand-cut ribeye steak marinated in the essence of California and grilled to perfection according to your preference, served with two eggs and a choice of breakfast potatoes or cheese grits and a biscuit',
    price: 30,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'brunch',
    badges: ['Chef\'s Special']
  },
  {
    id: 'b9',
    name: 'California Omelette',
    description: 'Three eggs, green peppers, red peppers, mushrooms, spinach, tomatoes and cheese with bacon or chicken sausage served with a biscuit',
    price: 18,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b10',
    name: 'Veggie Breakfast Bowl',
    description: 'Choice of cheese grits or breakfast potatoes topped with spinach, mushroom, tomatoes, red peppers, green peppers and two eggs scrambled with cheese',
    price: 18,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'brunch',
    badges: ['Vegetarian']
  },
  {
    id: 'b11',
    name: 'Seafood & Grits (Brunch)',
    description: 'Choice of one: Catfish $22, Shrimp $26, Salmon $28, Lobster MKT. A delightful seafood dish of your choosing, expertly cooked and served on a bed of cheese grits. It\'s topped with spinach, roasted peppers and drizzled with a zesty parmesan cheese sauce',
    price: 22,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  
  // BRUNCH DRINKS
  {
    id: 'bd1',
    name: 'Mimosa',
    description: 'Champagne & orange juice offered in various flavors: peach, strawberry, pineapple, cranberry or mango',
    price: 10,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'brunch-drinks',
    badges: []
  },
  {
    id: 'bd2',
    name: 'Bellini',
    description: 'A bellini is a cocktail crafted from Prosecco and peach schnapps',
    price: 12,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'brunch-drinks',
    badges: []
  },
  {
    id: 'bd3',
    name: 'Tequila Sunrise',
    description: 'Casamigos Blanco tequila, orange juice, and a splash of grenadine, served in a glass with a Tajín or salted rim',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'brunch-drinks',
    badges: []
  },
  {
    id: 'bd4',
    name: 'Vodka Sunrise',
    description: 'Ciroc vodka, orange juice, and a splash of grenadine in a glass with a Tajín or salted rim',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'brunch-drinks',
    badges: []
  },
  {
    id: 'bd5',
    name: 'French 75',
    description: 'Tanqueray gin, champagne, lemon muddled and simple syrup',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'brunch-drinks',
    badges: []
  },
  
  // BRUNCH SIDES
  {
    id: 'bs1',
    name: 'Two Eggs (Any Style)',
    description: 'Two eggs cooked to your preference',
    price: 7,
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs2',
    name: 'Chicken Sausage (3)',
    description: 'Three chicken sausage links',
    price: 7,
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs3',
    name: 'Breakfast Potatoes',
    description: 'Seasoned breakfast potatoes',
    price: 7,
    image: 'https://images.unsplash.com/photo-1585307833696-98baee8f8fc9?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs4',
    name: 'Waffle',
    description: 'Golden Belgian waffle',
    price: 9,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs5',
    name: 'Cheese Grits',
    description: 'Creamy cheese grits',
    price: 7,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs6',
    name: 'Biscuit',
    description: 'Freshly baked biscuit',
    price: 5,
    image: 'https://images.unsplash.com/photo-1585238341710-7a9b68c097b5?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs7',
    name: 'Bacon (3)',
    description: 'Three crispy bacon strips',
    price: 7,
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs8',
    name: 'French Toast',
    description: 'Classic French toast',
    price: 13,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: 'bs9',
    name: 'Whole Wings (3)',
    description: 'Three whole chicken wings',
    price: 14,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  }
];

// LOCATIONS DATA
export const locations = [
  {
    id: 1,
    slug: 'edgewood-atlanta',
    name: 'Fin & Feathers - Edgewood (Atlanta)',
    address: '345 Edgewood Ave SE, Atlanta, GA 30312',
    phone: '(404) 855-5524',
    reservationPhone: '(404) 692-1252',
    coordinates: { lat: 33.7547, lng: -84.3733 },
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    hours: {
      monday: '11am-1am',
      tuesday: '11am-1am',
      wednesday: '11am-1am',
      thursday: '11am-1am',
      friday: '11am-3am',
      saturday: '10am-3am',
      sunday: '10am-12am'
    },
    locationUrl: '/location/edgewood/',
    onlineOrdering: '/location/edgewood/',
    reservations: 'sms:14046921252?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/edgewood/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_edgewood',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: '$5 Wings & $5 Margaritas', image: '/videos/5.mp4' },
      { day: 'Tuesday', special: 'Taco Tuesday - $2 Tacos', image: '/videos/9.mp4' },
      { day: 'Wednesday', special: 'Wine Down Wednesday - Half Price Wine', image: '/videos/13.mp4' },
      { day: 'Thursday', special: 'Thirsty Thursday - $10 Long Islands', image: '/videos/17.mp4' },
      { day: 'Friday', special: 'Fresh Fish Friday - Market Price', image: '/videos/21.mp4' },
      { day: 'Saturday', special: 'Brunch & Bottomless Mimosas', image: '/videos/24.mp4' },
      { day: 'Sunday', special: 'Sunday Funday - Kids Eat Free', image: '/videos/1.mp4' }
    ]
  },
  {
    id: 2,
    slug: 'midtown-atlanta',
    name: 'Fin & Feathers - Midtown (Atlanta)',
    address: '1136 Crescent Ave NE, Atlanta, GA 30309',
    phone: '(404) 549-7555',
    reservationPhone: '(678) 421-4083',
    coordinates: { lat: 33.7812, lng: -84.3838 },
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/midtown-atlanta/',
    onlineOrdering: '/location/midtown-atlanta/',
    reservations: 'sms:16784214083?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/midtown-atlanta/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_midtown',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: 'Margarita Madness - $7 Margaritas', image: '/videos/5.mp4' },
      { day: 'Tuesday', special: '$1 Oysters All Day', image: '/videos/9.mp4' },
      { day: 'Wednesday', special: 'Wings & Things - $6 Wings', image: '/videos/13.mp4' },
      { day: 'Thursday', special: 'Steak Night - $25 Ribeye', image: '/videos/17.mp4' },
      { day: 'Friday', special: 'Lobster Special - Market Price', image: '/videos/21.mp4' },
      { day: 'Saturday', special: 'Weekend Brunch 10am-3pm', image: '/videos/24.mp4' },
      { day: 'Sunday', special: 'Live Music & Happy Hour', image: '/videos/1.mp4' }
    ]
  },
  {
    id: 3,
    slug: 'douglasville',
    name: 'Fin & Feathers - Douglasville',
    address: '7430 Douglas Blvd, Douglasville, GA 30135',
    phone: '(678) 653-9577',
    reservationPhone: '(404) 458-1958',
    coordinates: { lat: 33.7515, lng: -84.7477 },
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    hours: {
      monday: '12pm-10pm',
      tuesday: '12pm-10pm',
      wednesday: '12pm-10pm',
      thursday: '12pm-11pm',
      friday: '12pm-12am',
      saturday: '11am-12am',
      sunday: '11am-9pm'
    },
    locationUrl: '/location/douglasville/',
    onlineOrdering: '/location/douglasville/',
    reservations: 'sms:14044581958?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/douglasville/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_douglasville',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: 'Family Night - Kids Eat Free', image: '/videos/6.mp4' },
      { day: 'Tuesday', special: 'Taco & Tequila Tuesday', image: '/videos/10.mp4' },
      { day: 'Wednesday', special: 'Wine & Dine - 50% Off Bottles', image: '/videos/14.mp4' },
      { day: 'Thursday', special: 'Craft Beer Night', image: '/videos/18.mp4' },
      { day: 'Friday', special: 'Seafood Boil Special', image: '/videos/22.mp4' },
      { day: 'Saturday', special: 'Brunch Party 11am-3pm', image: '/videos/25.mp4' },
      { day: 'Sunday', special: 'Sunday Roast Special', image: '/videos/2.mp4' }
    ]
  },
  {
    id: 4,
    slug: 'riverdale',
    name: 'Fin & Feathers - Riverdale',
    address: '6340 Hwy 85, Riverdale, GA 30274',
    phone: '(770) 703-2282',
    reservationPhone: '(678) 304-8191',
    coordinates: { lat: 33.5726, lng: -84.4132 },
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/riverdale/',
    onlineOrdering: '/location/riverdale/',
    reservations: 'sms:16783048191?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/riverdale/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_riverdale',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: '$5 Daily Specials All Day', image: '/videos/7.mp4' },
      { day: 'Tuesday', special: 'Two for Tuesday - BOGO Entrees', image: '/videos/11.mp4' },
      { day: 'Wednesday', special: 'Wine Wednesday - $5 Glasses', image: '/videos/15.mp4' },
      { day: 'Thursday', special: 'Throwback Thursday - Classic Menu', image: '/videos/19.mp4' },
      { day: 'Friday', special: 'Fried Fish Friday', image: '/videos/23.mp4' },
      { day: 'Saturday', special: 'All Day Brunch & Cocktails', image: '/videos/26.mp4' },
      { day: 'Sunday', special: 'Southern Sunday Dinner', image: '/videos/3.mp4' }
    ]
  },
  {
    id: 5,
    slug: 'valdosta',
    name: 'Fin & Feathers - Valdosta',
    address: '1700 Norman Dr, Valdosta, GA 31601',
    phone: '(229) 474-4049',
    reservationPhone: '(229) 231-4653',
    coordinates: { lat: 30.8327, lng: -83.2785 },
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    hours: {
      monday: '12pm-9pm',
      tuesday: '12pm-9pm',
      wednesday: '12pm-9pm',
      thursday: '12pm-10pm',
      friday: '12pm-11pm',
      saturday: '11am-11pm',
      sunday: '11am-9pm'
    },
    locationUrl: '/location/valdosta/',
    onlineOrdering: '/location/valdosta/',
    reservations: 'sms:2292314653?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/valdosta/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_valdosta',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: 'Manic Monday - $8 Burgers', image: '/videos/8.mp4' },
      { day: 'Tuesday', special: 'Taco Tuesday Fiesta', image: '/videos/12.mp4' },
      { day: 'Wednesday', special: 'Wine Down Wednesday', image: '/videos/16.mp4' },
      { day: 'Thursday', special: 'Thirsty Thursday - $3 Drafts', image: '/videos/20.mp4' },
      { day: 'Friday', special: 'Fresh Catch Friday', image: '/videos/21.mp4' },
      { day: 'Saturday', special: 'Brunch & Bubbles', image: '/videos/27.mp4' },
      { day: 'Sunday', special: 'Family Sunday Feast', image: '/videos/4.mp4' }
    ]
  },
  {
    id: 6,
    slug: 'albany',
    name: 'Fin & Feathers - Albany',
    address: '2800 Old Dawson Rd Unit 5, Albany, GA 31707',
    phone: '(229) 231-2101',
    reservationPhone: '(229) 231-2101',
    coordinates: { lat: 31.5785, lng: -84.1558 },
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    hours: {
      monday: '11am-9pm',
      tuesday: '11am-9pm',
      wednesday: '11am-9pm',
      thursday: '11am-10pm',
      friday: '11am-11pm',
      saturday: '10am-11pm',
      sunday: '10am-9pm'
    },
    locationUrl: '/location/albany/',
    onlineOrdering: '/location/albany/',
    reservations: 'sms:12292312101?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/albany/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_albany',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: 'Monday Blues Buster - Live Music', image: '/videos/5.mp4' },
      { day: 'Tuesday', special: '$2 Taco & $2 Tecate', image: '/videos/9.mp4' },
      { day: 'Wednesday', special: 'Wing Wednesday - 50¢ Wings', image: '/videos/13.mp4' },
      { day: 'Thursday', special: 'Thirsty Thursday Cocktails', image: '/videos/17.mp4' },
      { day: 'Friday', special: 'Fish Fry Friday', image: '/videos/21.mp4' },
      { day: 'Saturday', special: 'Weekend Brunch Extravaganza', image: '/videos/28.mp4' },
      { day: 'Sunday', special: 'Sunday Funday - All Day Happy Hour', image: '/videos/1.mp4' }
    ]
  },
  {
    id: 7,
    slug: 'stone-mountain',
    name: 'Fin & Feathers - Stone Mountain',
    address: '5370 Stone Mountain Hwy, Stone Mountain, GA 30087',
    phone: '(470) 334-8255',
    reservationPhone: '(470) 334-8255',
    coordinates: { lat: 33.8081, lng: -84.1458 },
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/stone-mountain/',
    onlineOrdering: '/location/stone-mountain/',
    reservations: 'sms:14703348255?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/stone-mountain/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathers_stonemountain',
      facebook: 'https://facebook.com/finandfeathers',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: '$5 Wings & $5 Margaritas', image: '/videos/5.mp4' },
      { day: 'Tuesday', special: 'Taco Tuesday - $2 Tacos', image: '/videos/9.mp4' },
      { day: 'Wednesday', special: 'Wine Down Wednesday - Half Price Wine', image: '/videos/13.mp4' },
      { day: 'Thursday', special: 'Thirsty Thursday - $10 Long Islands', image: '/videos/17.mp4' },
      { day: 'Friday', special: 'Fresh Fish Friday - Market Price', image: '/videos/21.mp4' },
      { day: 'Saturday', special: 'Brunch & Bottomless Mimosas', image: '/videos/24.mp4' },
      { day: 'Sunday', special: 'Sunday Funday - Kids Eat Free', image: '/videos/1.mp4' }
    ]
  },
  {
    id: 8,
    slug: 'las-vegas',
    name: 'Fin & Feathers - Las Vegas',
    address: '1229 S. Casino Center Blvd, Las Vegas, NV 89104',
    phone: '(725) 204-9655',
    reservationPhone: '(702) 546-6394',
    coordinates: { lat: 36.1622, lng: -115.1505 },
    image: 'https://images.unsplash.com/photo-1514683877543-bffef8e73001?w=800&q=80',
    hours: {
      monday: '11am-12am',
      tuesday: '11am-12am',
      wednesday: '11am-12am',
      thursday: '11am-12am',
      friday: '11am-2am',
      saturday: '10am-2am',
      sunday: '10am-12am'
    },
    locationUrl: '/location/las-vegas/',
    onlineOrdering: '/location/las-vegas/',
    reservations: 'sms:17025466394?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/las-vegas/',
    socialMedia: {
      instagram: 'https://instagram.com/finandfeathersrestaurants',
      facebook: 'https://facebook.com/finandfeathersrestaurants',
      twitter: 'https://twitter.com/finandfeathers'
    },
    weeklySpecials: [
      { day: 'Monday', special: 'Monday Night Madness - $20 All You Can Eat Wings', image: '/videos/6.mp4' },
      { day: 'Tuesday', special: 'Taco Tuesday Vegas Style', image: '/videos/10.mp4' },
      { day: 'Wednesday', special: 'Wine & Dine - Premium Bottles $30', image: '/videos/14.mp4' },
      { day: 'Thursday', special: 'Vegas Thursday - Champagne Brunch', image: '/videos/18.mp4' },
      { day: 'Friday', special: 'High Roller Friday - Lobster & Steak', image: '/videos/22.mp4' },
      { day: 'Saturday', special: 'Saturday Night Party - DJ & Specials', image: '/videos/29.mp4' },
      { day: 'Sunday', special: 'Recovery Sunday - Hangover Brunch', image: '/videos/2.mp4' }
    ]
  }
];

