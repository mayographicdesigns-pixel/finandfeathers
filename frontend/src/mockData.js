export const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'starters', name: 'Starters', icon: '🍤' },
  { id: 'entrees', name: 'Entrees', icon: '🍖' },
  { id: 'seafood-grits', name: 'Seafood & Grits', icon: '🦞' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'salads', name: 'Salads', icon: '🥗' },
  { id: 'sides', name: 'Sides', icon: '🍟' }
];

export const menuItems = [
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


export const menuItems = [
  // Signature Selections / Daily Specials
  {
    id: '1',
    name: 'New Zealand Lamb Chops',
    description: 'Four perfectly grilled chops, covered in our one-of-a-kind lamb sauce. Pick any two delicious side dishes to pair with it',
    price: 43,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    category: 'daily-specials',
    badges: ['Chef\'s Special']
  },
  {
    id: '2',
    name: 'Marinated Malibu Ribeye',
    description: '10 oz hand-cut ribeye steak marinated in the essence of California, grilled to order and served with two sides',
    price: 41,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'daily-specials',
    badges: ['Chef\'s Special']
  },
  {
    id: '3',
    name: 'Stuffed Chicken Breast',
    description: 'Boneless chicken breasts with herb-filled roasted vegetables, topped with a special cheese blend, homemade lemon cream sauce, and garnished with broccoli and diced tomatoes. Served with two sides',
    price: 25,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
    category: 'daily-specials',
    badges: []
  },
  {
    id: '4',
    name: 'Catfish & Grits',
    description: 'Fried catfish & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 21,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '5',
    name: 'Shrimp & Grits',
    description: 'Grilled shrimp & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 25,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '6',
    name: 'Brunch Chicken & Waffle',
    description: 'Three whole wings or one thigh seasoned, battered & fried to perfection served with a buttermilk waffle topped with powder sugar, blueberries & strawberries',
    price: 18,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '7',
    name: 'Chicken & Waffles',
    description: 'Three juicy wings or one thigh fried to perfection and served with a buttermilk waffle. A Southern classic reimagined.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '8',
    name: 'Lamb Chops',
    description: 'Succulent lamb chops seasoned to perfection with herbs and spices, grilled and served with seasonal vegetables.',
    price: 38.99,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '9',
    name: 'Stuffed Chicken Breast',
    description: 'Fresh split chicken breast stuffed with fresh veggies and our signature cream cheese sauce, topped with creamy parmesan and grilled vegetables.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '10',
    name: 'Malibu Ribeye',
    description: 'Premium steak grilled to perfection and finished with our signature Malibu glaze, a rich blend of buttery sweetness and island-inspired notes.',
    price: 42.99,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  // Starters
  {
    id: '11',
    name: 'Jerk Chicken Egg Rolls',
    description: 'Jerk chicken, veggies, deep-fried to crispy perfection with sweet chili pineapple sauce',
    price: 14,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    category: 'starters',
    badges: ['Spicy']
  },
  {
    id: '12',
    name: 'Dynamite Pepper Shrimp',
    description: 'Hand-battered deep-fried shrimp tossed in homemade sweet pepper sauce with jalapeño and tropical banana peppers. Served with chipotle ranch',
    price: 17,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    category: 'starters',
    badges: ['Spicy', 'Chef\'s Special']
  },
  {
    id: '13',
    name: 'Chicken Tenders & Fries',
    description: 'Chicken tenders battered in our in-house seasoning served with fries and your choice of ranch, honey mustard or BBQ sauce',
    price: 15,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '14',
    name: 'Fried Pickles',
    description: 'Dill pickles, hand battered and deep fried served with chipotle ranch',
    price: 11,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '15',
    name: 'F&F Signature Wings',
    description: 'Delicious fried wings in five different flavors (plain, lemon pepper, BBQ, honey hot, mild, fire) with ranch or bleu cheese dressing',
    price: 14,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'starters',
    badges: ['Chef\'s Special']
  },
  {
    id: '16',
    name: 'Catfish Nuggets',
    description: 'Fresh caught deep-fried catfish nuggets, served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce',
    price: 14,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'starters',
    badges: []
  },
  {
    id: '17',
    name: 'Fin\'s Tacos',
    description: 'Corn tortillas, pickled cabbage salad, house made peach & pineapple salsa, jack cheese, topped with herb sour cream. Choice of sautéed veggies, chicken, catfish, shrimp (+$4) or steak (+$4)',
    price: 14,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    category: 'starters',
    badges: ['Spicy']
  },
  // Entrees
  {
    id: '18',
    name: 'Deep Fried Catfish',
    description: 'Seasoned deep fried catfish, served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce and served with two sides',
    price: 21,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '19',
    name: 'Grilled Blackened Catfish',
    description: 'Fresh caught catfish, grilled and served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce and served with two sides',
    price: 21,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '20',
    name: 'Roasted Chicken Thighs',
    description: 'Juicy roasted chicken thighs pan-seared to lock in natural flavors and drizzled with savory orange au jus sauce. Served with two sides',
    price: 21,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '21',
    name: 'Southern Fried Chicken',
    description: 'Three whole wings or one thigh prepared with our own seasoned batter and fried to perfection and served with two sides',
    price: 21,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80',
    category: 'entrees',
    badges: []
  },
  {
    id: '22',
    name: 'Honey Bourbon Salmon',
    description: '8 oz fresh Atlantic salmon glazed in a house made honey bourbon sauce served with choice of two sides',
    price: 30,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '23',
    name: 'Lobster Tails',
    description: 'Two succulent lobster tails perfectly cooked to order with 2 sides of your choice',
    price: 65,
    image: 'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&q=80',
    category: 'entrees',
    badges: ['Chef\'s Special']
  },
  {
    id: '24',
    name: 'Veggie Bowl',
    description: 'Sautéed vegetables with sweet chili glaze - tender broccoli, carrots, tomatoes, and spinach sautéed in garlic butter, served over rice pilaf and finished with a sweet chili glaze (No sides included)',
    price: 19,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'entrees',
    badges: ['Vegetarian']
  },
  // Seafood & Grits
  {
    id: '25',
    name: 'Salmon & Grits',
    description: 'Grilled salmon & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 27,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  {
    id: '26',
    name: 'Lobster & Grits',
    description: 'Grilled lobster & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 75,
    image: 'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&q=80',
    category: 'seafood-grits',
    badges: ['Chef\'s Special']
  },
  // Sandwiches
  {
    id: '27',
    name: 'F&F Jerk Turkey Burger',
    description: 'Our signature jerk patty with pickled cabbage, garlic aioli, Monterey jack cheese & topped with house made peach and pineapple salsa',
    price: 15,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '28',
    name: 'Fire Chicken Sandwich',
    description: 'Grilled or deep-fried chicken breast, drizzled with our housemade fire sauce with melted jack cheese, sautéed jalapeños and blue cheese',
    price: 15,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '29',
    name: 'BBQ Chicken Sandwich',
    description: 'Grilled or deep-fried chicken breast topped with BBQ sauce & melted jack cheese with romaine lettuce, tomatoes and pickles',
    price: 15,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '30',
    name: 'Catfish Filet Sandwich',
    description: 'Deep-fried catfish topped with option of parmesan sauce, tartar or rémoulade sauce & romaine lettuce, tomatoes and pickles',
    price: 16,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '31',
    name: 'Salmon Burger',
    description: '4oz salmon fillet, seasoned and garnished with your choice of toppings: parmesan, tartar, or rémoulade sauce. Served with romaine lettuce, tomatoes, and pickles',
    price: 18,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '32',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken romaine lettuce, parmesan cheese, & Caesar dressing, wrapped in a flour tortilla',
    price: 15,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    category: 'sandwiches',
    badges: []
  },
  // Salads
  {
    id: '33',
    name: 'Chef Salad',
    description: 'All-American salad with lettuce, tomatoes, cucumbers, croutons, cheese and topped with dressing',
    price: 15,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'salads',
    badges: []
  },
  {
    id: '34',
    name: 'Caesar Salad',
    description: 'Green salad of romaine lettuce and croutons dressed with Parmesan cheese, black pepper and Caesar salad dressing',
    price: 14,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
    category: 'salads',
    badges: []
  },
  // Sides
  {
    id: '35',
    name: 'Mac & Cheese',
    description: 'Creamy, rich macaroni and cheese',
    price: 8,
    image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '36',
    name: 'Whipped Potatoes',
    description: 'Creamy whipped potatoes',
    price: 7,
    image: 'https://images.unsplash.com/photo-1585307833696-98baee8f8fc9?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '37',
    name: 'Sautéed Garlic Spinach',
    description: 'Fresh spinach sautéed with garlic',
    price: 7,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '38',
    name: 'Lemon Butter Broccoli',
    description: 'Fresh broccoli with lemon butter',
    price: 7,
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '39',
    name: 'Jalapeño Roasted Corn',
    description: 'Roasted corn with jalapeños',
    price: 7,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian', 'Spicy']
  },
  {
    id: '40',
    name: 'Crispy Fries',
    description: 'Golden crispy fries',
    price: 6,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '41',
    name: 'Rice Pilaf',
    description: 'Seasoned rice pilaf',
    price: 7,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '42',
    name: 'Cheese Grits',
    description: 'Creamy cheese grits',
    price: 6,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  {
    id: '43',
    name: 'Collard Greens',
    description: 'Slow-cooked collard greens with smoked turkey, perfectly seasoned with Southern spices.',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=800&q=80',
    category: 'sides',
    badges: []
  },
  {
    id: '44',
    name: 'Candied Yams',
    description: 'Sweet potatoes glazed with butter, brown sugar, and warm spices.',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1604669860368-29fa1f93c756?w=800&q=80',
    category: 'sides',
    badges: ['Vegetarian']
  },
  // Brunch
  {
    id: '45',
    name: 'Breakfast Burrito',
    description: 'Flour tortilla filled with three eggs, green peppers, red peppers, mushrooms, spinach, tomatoes & cheese with bacon or chicken sausage',
    price: 16,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '46',
    name: 'Edgewood Breakfast',
    description: 'Two eggs (any style), choice of bacon or chicken sausage & pancakes or a waffle topped with powder sugar, blueberries & strawberries',
    price: 16,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '47',
    name: 'All Star Breakfast',
    description: 'Two eggs (any style), breakfast potatoes or cheese grits, choice of bacon or sausage and a biscuit',
    price: 14,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '48',
    name: 'French Toast',
    description: 'Fresh challah bread, drizzled with a triple sec sugar glaze topped with powdered sugar, blueberries and strawberries with your choice of bacon, chicken sausage or 3 whole wings (+$6)',
    price: 16,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '49',
    name: 'Steak & Eggs',
    description: 'Our Malibu ribeye, two eggs (any style) with your choice of breakfast potatoes or grits & a biscuit',
    price: 29,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '50',
    name: 'California Omelette',
    description: 'Three eggs, green peppers, red peppers, mushrooms, spinach, tomatoes & cheese with bacon or chicken sausage',
    price: 17,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '51',
    name: 'Ultimate French Toast Sandwich',
    description: 'Fluffy frosted French toast sandwich stuffed with cheesy eggs, bacon or chicken sausage, drizzled with a triple sec sugar glaze & topped with powder sugar',
    price: 19,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    category: 'brunch',
    badges: []
  },
  {
    id: '52',
    name: 'Veggie Breakfast Bowl',
    description: 'Spinach, mushroom, tomatoes, red peppers, green peppers & cheese scrambled in two eggs over your choice of grits or breakfast potatoes',
    price: 17,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    category: 'brunch',
    badges: ['Vegetarian']
  },
  {
    id: '53',
    name: 'Lamb Chops & Eggs',
    description: 'Three lamb chops with signature lamb sauce, paired with eggs cooked to your preference and choice of potatoes or grits. A fluffy biscuit included',
    price: 31,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    category: 'brunch',
    badges: ['Chef\'s Special']
  },
  // Brunch Sides
  {
    id: '54',
    name: '2 Eggs',
    description: 'Two eggs cooked any style',
    price: 6,
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: '55',
    name: 'Bacon',
    description: 'Crispy bacon strips',
    price: 6,
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: '56',
    name: 'Biscuit',
    description: 'Fresh baked biscuit',
    price: 4,
    image: 'https://images.unsplash.com/photo-1585238341710-7a9b68c097b5?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: '57',
    name: 'Pancakes',
    description: 'Fluffy pancakes',
    price: 8,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: '58',
    name: 'Breakfast Potatoes',
    description: 'Seasoned breakfast potatoes',
    price: 6,
    image: 'https://images.unsplash.com/photo-1585307833696-98baee8f8fc9?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  {
    id: '59',
    name: 'Waffle',
    description: 'Golden waffle',
    price: 8,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80',
    category: 'brunch-sides',
    badges: []
  },
  // Cocktails
  {
    id: '60',
    name: 'Mimosa',
    description: 'Champagne & orange juice available in a variety of flavors: peach, strawberry, pineapple, cranberry or mango',
    price: 10,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '61',
    name: 'Bellini',
    description: 'A cocktail made with Prosecco and peach purée',
    price: 10,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '62',
    name: 'Tequila Sunrise',
    description: 'Coramino Blanco Tequila, orange juice, & a dash of grenadine in a glass with a Tajin or salted rim',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '63',
    name: 'Vodka Sunrise',
    description: 'Ciroc Vodka, orange juice, & a dash of grenadine in a glass with a Tajin or salted rim',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '64',
    name: 'Sunset Blvd',
    description: 'F&F\'s most popular drink! Hennessey, agave, muddled lemon, & simple syrup',
    price: 15,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: ['Chef\'s Special']
  },
  {
    id: '65',
    name: 'Pacific Coast Hwy',
    description: 'A sophisticated Hennessy Margarita. A popular cocktail & a favorite of Fin & Feathers\' socialites!',
    price: 17,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: ['Chef\'s Special']
  },
  {
    id: '66',
    name: 'Margarita',
    description: 'Tequila Blanco, fresh lime juice, agave nectar garnished with a lime wedge. Available with a sugar, salt or tajin rim',
    price: 12,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '67',
    name: 'Whiskey Sour',
    description: 'Whiskey, lemon juice, and simple syrup served over ice with a cherry garnish',
    price: 12,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  },
  {
    id: '68',
    name: 'Long Island Iced Tea',
    description: 'Vodka, rum, gin, tequila, triple sec, and sour mix over ice with a splash of cola',
    price: 14,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    category: 'cocktails',
    badges: []
  }
];
