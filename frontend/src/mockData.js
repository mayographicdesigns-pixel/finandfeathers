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
  // $5 DAILY SPECIALS - FOOD (Line items - no images)
  {
    id: 'ds1',
    name: '4 Party Wings & Fries',
    description: 'Four wings in your choice of flavor: lemon pepper, BBQ, mild, hot, or honey hot. Served with fries',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  {
    id: 'ds2',
    name: '2 Chicken Tenders & Fries',
    description: 'Two crispy chicken tenders served with fries',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  {
    id: 'ds3',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken, romaine lettuce, parmesan cheese, and Caesar dressing wrapped in a flour tortilla',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  {
    id: 'ds4',
    name: 'Chicken Thigh Nuggets & Fries',
    description: 'Crispy chicken thigh nuggets served with fries',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  {
    id: 'ds5',
    name: '2 Tacos',
    description: 'Two tacos with your choice of chicken, fish, or veggie',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  {
    id: 'ds6',
    name: 'Catfish Nuggets & Fries',
    description: 'Crispy catfish nuggets served with fries',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'food',
    layout: 'line'
  },
  
  // $5 DAILY SPECIALS - DRINKS (Line items)
  {
    id: 'ds7',
    name: 'Margarita',
    description: 'Tequila Blanco, fresh lime juice, agave nectar with sugar, salt or tajin rim',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  {
    id: 'ds8',
    name: 'Rum Punch',
    description: 'White rum, pineapple juice, grenadine & a splash of club soda',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  {
    id: 'ds9',
    name: 'Whiskey Sour',
    description: 'Whiskey, lemon juice, and simple syrup served over ice with a cherry garnish',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  {
    id: 'ds10',
    name: 'Long Island Iced Tea',
    description: 'Vodka, rum, gin, tequila, triple sec, and sour mix over ice with a splash of cola',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  {
    id: 'ds11',
    name: 'White Wine',
    description: 'Chardonnay, Moscato, or Pinot Grigio',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  {
    id: 'ds12',
    name: 'Red Wine',
    description: 'Cabernet or Merlot',
    price: 5,
    category: 'daily-specials',
    badges: [],
    type: 'drink',
    layout: 'line'
  },
  
  // STARTERS (With actual F&F images)
  {
    id: '1',
    name: 'F&F Signature Wings',
    description: 'Our delicious fried wings in five different flavors (plain, lemon pepper, BBQ, honey hot, mild, fire) with the option of ranch or bleu cheese dressing',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6608.jpg',
    category: 'starters',
    badges: []
  },
  {
    id: '2',
    name: 'Chicken Thigh Nuggets',
    description: 'Delicious deep-fried thigh nuggets cooked perfectly. Toss in lemon pepper, BBQ, mild, hot, or honey hot for $1',
    price: 12,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/05/d5a5b6d60bb345848208733aad759bad.jpeg',
    category: 'starters',
    badges: []
  },
  {
    id: '3',
    name: "Fin's Tacos",
    description: 'Corn tortillas, pickled cabbage salad, house made peach & pineapple salsa, jack cheese, topped with herb sour cream. Sautéed veggies, chicken, catfish, shrimp (+$4) or steak (+$4)',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC05965_edited-1.jpg',
    category: 'starters',
    badges: ['Spicy']
  },
  {
    id: '4',
    name: 'Catfish Nuggets',
    description: 'Fresh caught deep-fried catfish nuggets, served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/72c955de55dd4c3996e3fe0039742714-1.jpeg',
    category: 'starters',
    badges: []
  },
  {
    id: '5',
    name: 'Jerk Chicken Egg Rolls',
    description: 'Jerk chicken egg rolls filled with jerk chicken, veggies, and deep-fried to crispy perfection. Served with a sweet chili pineapple sauce',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Jerk-Chicken-Egg-Roll-scaled.jpg',
    category: 'starters',
    badges: ['Spicy']
  },
  {
    id: '6',
    name: 'Dynamite Pepper Shrimp',
    description: 'Hand-battered deep-fried shrimp tossed in homemade sweet pepper sauce with jalapeño and tropical banana peppers. Served with chipotle ranch dipping sauce',
    price: 17,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC05963_edited-1.jpg',
    category: 'starters',
    badges: ['Spicy', "Chef's Special"]
  },
  {
    id: '7',
    name: 'Chicken Tenders & Fries',
    description: 'Chicken tenders battered in our in-house seasoning served with fries and your choice of ranch, honey mustard or BBQ sauce',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/FinsAndFeathers-24_edited-1.jpg',
    category: 'starters',
    badges: []
  },
  {
    id: '8',
    name: 'Fried Pickles',
    description: 'Dill pickles, hand battered and deep fried served with chipotle ranch',
    price: 11,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6577.jpg',
    category: 'starters',
    badges: []
  },
  {
    id: '9',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken romaine lettuce, parmesan cheese, & Caesar dressing, wrapped in a flour tortilla',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6590.jpg',
    category: 'starters',
    badges: []
  },
  
  // ENTREES (With actual F&F images)
  {
    id: '10',
    name: 'New Zealand Lamb Chops',
    description: 'Four perfectly grilled chops, covered in our one-of-a-kind lamb sauce. Pick any two delicious side dishes',
    price: 43,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/IMG_1574-e1666013652186.jpg',
    category: 'entrees',
    badges: ["Chef's Special"]
  },
  {
    id: '11',
    name: 'Marinated Malibu Ribeye',
    description: '10 oz hand-cut ribeye steak marinated in the essence of California, grilled to order and served with two sides',
    price: 41,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg',
    category: 'entrees',
    badges: ["Chef's Special"]
  },
  {
    id: '12',
    name: 'Deep Fried Catfish',
    description: 'Seasoned deep fried catfish, served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce and served with two sides',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/8f476b4bb04a4bb0b30b75a0e8271189-e1665919417568.jpeg',
    category: 'entrees',
    badges: []
  },
  {
    id: '13',
    name: 'Grilled Blackened Catfish',
    description: 'Fresh caught catfish, grilled and served with your choice of our homemade remoulade sauce, tartar sauce or hot sauce and served with two sides',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Grilled-Catfish-scaled.jpg',
    category: 'entrees',
    badges: []
  },
  {
    id: '14',
    name: 'Stuffed Chicken Breast',
    description: 'Boneless chicken breasts with herb-filled roasted vegetables, topped with a special cheese blend, homemade lemon cream sauce, and garnished with broccoli and diced tomatoes. Served with two sides',
    price: 25,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/fin_and_feathers_fried_stuffed_chicken_breast_3-e1665919636508.jpg',
    category: 'entrees',
    badges: []
  },
  {
    id: '15',
    name: 'Roasted Chicken Thighs',
    description: 'Juicy Roasted Chicken Thighs pan-seared to lock in natural flavors and drizzled with savory orange au jus sauce. Served with two sides',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Roasted-Chicken-Thighs-scaled.jpg',
    category: 'entrees',
    badges: []
  },
  {
    id: '16',
    name: 'Southern Fried Chicken',
    description: 'Three whole wings or one thigh prepared with our own seasoned battered and fried to perfection and served with two sides',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC06011_edited.jpg',
    category: 'entrees',
    badges: []
  },
  {
    id: '17',
    name: 'Honey Bourbon Salmon',
    description: '8 oz fresh Atlantic salmon glazed in a house made honey bourbon sauce served with choice of two sides',
    price: 30,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Honey-Bourbon-Salmon-scaled.jpg',
    category: 'entrees',
    badges: ["Chef's Special"]
  },
  {
    id: '18',
    name: 'Lobster Tails',
    description: 'Two succulent Lobster Tails perfectly cooked to order with 2 sides of your choice',
    price: null,
    priceLabel: 'MKT',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6624.jpg',
    category: 'entrees',
    badges: ["Chef's Special"]
  },
  {
    id: '19',
    name: 'Chicken & Waffle',
    description: 'Golden-brown buttermilk waffle with your choice of crispy fried chicken: three juicy wings OR one tender thigh. Served with your favorite syrup (No sides included)',
    price: 18,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/a3e08521f140462cbedf10dedd32f879.jpeg',
    category: 'entrees',
    badges: []
  },
  {
    id: '20',
    name: 'Veggie Bowl',
    description: 'Sautéed vegetables with sweet chili glaze - tender broccoli, carrots, tomatoes, and spinach sautéed in garlic butter, served over rice pilaf (No sides included)',
    price: 19,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Veggie-Bowl-scaled.jpg',
    category: 'entrees',
    badges: ['Vegetarian']
  },
  
  // SEAFOOD & GRITS (With actual F&F images)
  {
    id: '21',
    name: 'Catfish & Grits',
    description: 'Fried Catfish & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/7-1.png',
    category: 'seafood-grits',
    badges: ["Chef's Special"]
  },
  {
    id: '22',
    name: 'Shrimp & Grits',
    description: 'Grilled Shrimp & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 25,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg',
    category: 'seafood-grits',
    badges: ["Chef's Special"]
  },
  {
    id: '23',
    name: 'Salmon & Grits',
    description: 'Grilled Salmon & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: 27,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/salmon-grits.png',
    category: 'seafood-grits',
    badges: ["Chef's Special"]
  },
  {
    id: '24',
    name: 'Lobster & Grits',
    description: 'Grilled Lobster & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce',
    price: null,
    priceLabel: 'MKT',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/100_0223-scaled-e1696349523450.jpg',
    category: 'seafood-grits',
    badges: ["Chef's Special"]
  },
  
  // SANDWICHES (With actual F&F images)
  {
    id: '25',
    name: 'F&F Jerk Turkey Burger',
    description: 'Our signature jerk patty with pickled cabbage, garlic aioli, Monterey jack cheese & topped with house made peach and pineapple salsa',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Jerk-Turkey-Burger-scaled.jpg',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '26',
    name: 'Fire Chicken Sandwich',
    description: 'Grilled or deep-fried chicken breast, drizzled with our housemade fire sauce with melted jack cheese, sautéed jalapeños and blue cheese',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Fire-Chicken-Sandwhich-scaled.jpg',
    category: 'sandwiches',
    badges: ['Spicy']
  },
  {
    id: '27',
    name: 'BBQ Chicken Sandwich',
    description: 'Grilled or deep-fried chicken breast topped with BBQ sauce & melted jack cheese with romaine lettuce, tomatoes and pickles',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-BBQ-Chicken-Sandwich-1-scaled.jpg',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '28',
    name: 'Catfish Filet Sandwich',
    description: 'Deep-fried catfish topped with option of parmesan sauce, tartar or rémoulade sauce & romaine lettuce, tomatoes and pickles. Add cheese +$1',
    price: 16,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/12/b810a1585baa482a8a40aa2fba4111e9-e1671233952540.jpeg',
    category: 'sandwiches',
    badges: []
  },
  {
    id: '29',
    name: 'Salmon Burger',
    description: 'Perfectly cooked 4oz salmon fillet, seasoned and garnished with your choice of parmesan, tartar, or rémoulade sauce. Served with romaine lettuce, tomatoes, and pickles. Add cheese +$1',
    price: 18,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/Screenshot_7-e1666177138547.jpg',
    category: 'sandwiches',
    badges: []
  },
  // Sandwich Add-ons (Line items)
  {
    id: '30',
    name: 'Add Bacon to Any Sandwich',
    description: 'Crispy bacon strips',
    price: 4,
    category: 'sandwiches',
    badges: [],
    layout: 'line'
  },
  {
    id: '31',
    name: 'Add Cheese to Any Sandwich',
    description: 'Your choice of cheese',
    price: 2,
    category: 'sandwiches',
    badges: [],
    layout: 'line'
  },
  
  // SALADS (With actual F&F images)
  {
    id: '32',
    name: 'Chef Salad',
    description: 'An all-American salad with lettuce, tomatoes, cucumbers, croutons, cheese and topped with dressing',
    price: 15,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Chef-Salad-1-scaled.jpg',
    category: 'salads',
    badges: []
  },
  {
    id: '33',
    name: 'Caesar Salad',
    description: 'A green salad of romaine lettuce and croutons dressed with Parmesan cheese, black pepper and Caesar salad dressing',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Caesar-Salad-scaled.jpg',
    category: 'salads',
    badges: []
  },
  // Side Salads (Line items)
  {
    id: '34',
    name: 'Side Chef Salad',
    description: 'Lettuce, tomatoes, cucumbers, croutons, cheese and dressing',
    price: 8,
    category: 'salads',
    badges: [],
    layout: 'line'
  },
  {
    id: '35',
    name: 'Side Caesar Salad',
    description: 'Romaine lettuce, croutons, Parmesan cheese and Caesar dressing',
    price: 8,
    category: 'salads',
    badges: [],
    layout: 'line'
  },
  
  // SIDES (Line items - no images)
  {
    id: '36',
    name: 'Mac & Cheese',
    description: 'Creamy, rich macaroni and cheese',
    price: 8,
    category: 'sides',
    badges: [],
    layout: 'line'
  },
  {
    id: '37',
    name: 'Whipped Potatoes',
    description: 'Creamy whipped potatoes',
    price: 7,
    category: 'sides',
    badges: [],
    layout: 'line'
  },
  {
    id: '38',
    name: 'Sautéed Garlic Spinach',
    description: 'Fresh spinach sautéed with garlic',
    price: 7,
    category: 'sides',
    badges: ['Vegetarian'],
    layout: 'line'
  },
  {
    id: '39',
    name: 'Lemon Butter Broccoli',
    description: 'Fresh broccoli with lemon butter',
    price: 7,
    category: 'sides',
    badges: ['Vegetarian'],
    layout: 'line'
  },
  {
    id: '40',
    name: 'Jalapeño Roasted Corn',
    description: 'Roasted corn with jalapeños',
    price: 7,
    category: 'sides',
    badges: ['Vegetarian', 'Spicy'],
    layout: 'line'
  },
  {
    id: '41',
    name: 'Crispy Fries',
    description: 'Golden crispy fries',
    price: 6,
    category: 'sides',
    badges: ['Vegetarian'],
    layout: 'line'
  },
  {
    id: '42',
    name: 'Rice Pilaf',
    description: 'Seasoned rice pilaf',
    price: 7,
    category: 'sides',
    badges: ['Vegetarian'],
    layout: 'line'
  },
  {
    id: '43',
    name: 'Cheese Grits',
    description: 'Creamy cheese grits',
    price: 6,
    category: 'sides',
    badges: ['Vegetarian'],
    layout: 'line'
  },
  
  // SIGNATURE COCKTAILS (Line items - no images)
  {
    id: 'c1',
    name: 'California Dreaming',
    description: 'A colorful punch with island vibes. Made with Malibu Rum, Captain Morgan Spiced Rum, pineapple juice, melon liqueur, sour mix & a splash of blue curaçao',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c2',
    name: 'Sunset Blvd',
    description: "F&F's most popular drink! Hennessey, agave, muddled lemon, & simple syrup",
    price: 15,
    category: 'cocktails',
    badges: ["Chef's Special"],
    layout: 'line'
  },
  {
    id: 'c3',
    name: 'LAX Sidecar',
    description: 'A slightly sweet twist on the classic sidecar martini! Made with Remy Martin VSOP, muddled citrus & a dash of simple syrup',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c4',
    name: 'Marina Del Rey',
    description: 'Our version of rum punch made with Malibu Rum, pineapple juice, cranberry juice, lime juice, & grenadine',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c5',
    name: 'The 405',
    description: 'A boozy drink everyone loves! Uncle Nearest 100-proof whiskey blended with a splash of lemon juice & agave',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c6',
    name: 'Baldwin Hills',
    description: 'An exotic cocktail only found here! Made with Island Jon Apple Guava Vodka, strawberry puree, & pineapple juice',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c7',
    name: 'East LA',
    description: 'A little sweet, a little tart and totally delicious! Made with Coramino Blanco tequila, fresh lime & a red wine float',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c8',
    name: 'Melrose Ave',
    description: 'A fruity summer cocktail made with Peach Cîroc, pineapple juice, & a splash of grenadine',
    price: 15,
    category: 'cocktails',
    badges: [],
    layout: 'line'
  },
  {
    id: 'c9',
    name: 'Pacific Coast Hwy',
    description: "A sophisticated Hennessy Margarita. A popular cocktail & a favorite of Fin & Feathers' socialites!",
    price: 17,
    category: 'cocktails',
    badges: ["Chef's Special"],
    layout: 'line'
  },
  
  // BRUNCH (With actual F&F images)
  {
    id: 'b1',
    name: 'Chicken & Waffle',
    description: 'Three whole wings or one thigh seasoned, battered & fried to perfection served with a buttermilk waffle topped with powder sugar, blueberries & strawberries',
    price: 18,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/5.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b2',
    name: 'Breakfast Burrito',
    description: 'Flour tortilla filled with three eggs, green peppers, red peppers, mushrooms, spinach, tomatoes & cheese with bacon or chicken sausage',
    price: 16,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Breakfast-Burrito-1-scaled.jpg',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b3',
    name: 'Edgewood Breakfast',
    description: 'Two eggs (any style), choice of bacon or chicken sausage & pancakes or a waffle topped with powder sugar, blueberries & strawberries',
    price: 16,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/1.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b4',
    name: 'All Star Breakfast',
    description: 'Two eggs (any style), breakfast potatoes or cheese grits, choice of bacon or sausage and a biscuit',
    price: 14,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/All-star-break.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b5',
    name: 'French Toast',
    description: 'Fresh challah bread, drizzled with a triple sec sugar glaze topped with powdered sugar, blueberries & strawberries with your choice of bacon, chicken sausage or 3 whole wings (+$6)',
    price: 16,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/3.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b6',
    name: 'Steak & Eggs',
    description: 'Our Malibu ribeye, two eggs (any style) with your choice of breakfast potatoes or grits & a biscuit',
    price: 29,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/steak-eggs.png',
    category: 'brunch',
    badges: ["Chef's Special"]
  },
  {
    id: 'b7',
    name: 'California Omelette',
    description: 'Three eggs, green peppers, red peppers, mushrooms, spinach, tomatoes & cheese with bacon or chicken sausage',
    price: 17,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/Untitled-design-1.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b8',
    name: 'Ultimate French Toast Sandwich',
    description: 'Fluffy frosted French toast sandwich stuffed with cheesy eggs, bacon or chicken sausage, drizzled with a triple sec sugar glaze & topped with powder sugar',
    price: 19,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-The-Ultimate-scaled.jpg',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b9',
    name: 'Veggie Breakfast Bowl',
    description: 'Choose from spinach, mushroom, tomatoes, red peppers, green peppers & cheese scrambled in two eggs over your choice of grits or breakfast potatoes',
    price: 17,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Breakfast-Bowl-1-scaled.jpg',
    category: 'brunch',
    badges: ['Vegetarian']
  },
  {
    id: 'b10',
    name: 'Lamb Chops & Eggs',
    description: 'Three Lamb Chops with signature lamb sauce, paired with eggs cooked to your preference and choice of potatoes or grits. Served with a fluffy biscuit',
    price: 31,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/IMG_1574.jpg',
    category: 'brunch',
    badges: ["Chef's Special"]
  },
  // Brunch Seafood & Grits (With images)
  {
    id: 'b11',
    name: 'Catfish & Grits (Brunch)',
    description: 'Fried Catfish & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce. *No sides included',
    price: 21,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2023/09/7-1.png',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b12',
    name: 'Shrimp & Grits (Brunch)',
    description: 'Grilled Shrimp & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce. *No sides included',
    price: 25,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Shrimp-Grits-scaled.jpg',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b13',
    name: 'Salmon & Grits (Brunch)',
    description: 'Grilled Salmon & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce. *No sides included',
    price: 27,
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Salmon-Grits-scaled.jpg',
    category: 'brunch',
    badges: []
  },
  {
    id: 'b14',
    name: 'Lobster & Grits (Brunch)',
    description: 'Grilled Lobster & roasted peppers served over cheesy grits drizzled with a spicy parmesan cheese sauce. *No sides included',
    price: null,
    priceLabel: 'MKT',
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/100_0223-scaled-e1696349523450.jpg',
    category: 'brunch',
    badges: []
  },
  
  // BRUNCH DRINKS (Line items)
  {
    id: 'bd1',
    name: 'Mimosa',
    description: 'Champagne & orange juice. Available in peach, strawberry, pineapple, cranberry or mango',
    price: 10,
    category: 'brunch',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bd2',
    name: 'Bellini',
    description: 'A cocktail made with Prosecco and peach purée',
    price: 10,
    category: 'brunch',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bd3',
    name: 'Tequila Sunrise',
    description: 'Coramino Blanco Tequila, orange juice, & a dash of grenadine. Available with tajin or salted rim',
    price: 15,
    category: 'brunch',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bd4',
    name: 'Vodka Sunrise',
    description: 'Ciroc Vodka, orange juice, & a dash of grenadine. Available with tajin or salted rim',
    price: 15,
    category: 'brunch',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bd5',
    name: 'French 75',
    description: 'Tanqueray Gin, champagne, muddled lemon & simple syrup',
    price: 15,
    category: 'brunch',
    badges: [],
    layout: 'line'
  },
  
  // BRUNCH SIDES (Line items)
  {
    id: 'bs1',
    name: '2 Eggs',
    description: 'Two eggs cooked any style',
    price: 6,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs2',
    name: 'Bacon',
    description: 'Crispy bacon strips',
    price: 6,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs3',
    name: 'Biscuit',
    description: 'Freshly baked biscuit',
    price: 4,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs4',
    name: 'Pancakes',
    description: 'Fluffy pancakes',
    price: 8,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs5',
    name: 'Breakfast Potatoes',
    description: 'Seasoned breakfast potatoes',
    price: 6,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs6',
    name: 'Waffle',
    description: 'Golden buttermilk waffle',
    price: 8,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs7',
    name: 'French Toast Only',
    description: 'Classic French toast with triple sec glaze',
    price: 12,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs8',
    name: 'Cheese Grits',
    description: 'Creamy cheese grits',
    price: 6,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs9',
    name: 'Chicken Sausage',
    description: 'Savory chicken sausage links',
    price: 6,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs10',
    name: '3 Whole Wings',
    description: 'Three crispy fried wings',
    price: 13,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs11',
    name: 'Shrimp',
    description: 'Grilled shrimp',
    price: 15,
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
  },
  {
    id: 'bs12',
    name: 'Lobster Tail',
    description: 'Grilled lobster tail',
    price: null,
    priceLabel: 'MKT',
    category: 'brunch-sides',
    badges: [],
    layout: 'line'
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6657.jpg',
    hours: {
      monday: '11am-1am',
      tuesday: '11am-1am',
      wednesday: '11am-1am',
      thursday: '11am-1am',
      friday: '11am-3am',
      saturday: '10am-3am',
      sunday: '10am-12am'
    },
    locationUrl: '/location/edgewood-atlanta',
    onlineOrdering: '/location/edgewood-atlanta',
    reservations: 'sms:14046921252?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/edgewood-atlanta',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC6656.jpg',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/midtown-atlanta',
    onlineOrdering: '/location/midtown-atlanta',
    reservations: 'sms:16784214083?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/midtown-atlanta',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/fin_and_feathers_shrimp_and_grits_2-e1666107985403.jpg',
    hours: {
      monday: '12pm-10pm',
      tuesday: '12pm-10pm',
      wednesday: '12pm-10pm',
      thursday: '12pm-11pm',
      friday: '12pm-12am',
      saturday: '11am-12am',
      sunday: '11am-9pm'
    },
    locationUrl: '/location/douglasville',
    onlineOrdering: '/location/douglasville',
    reservations: 'sms:14044581958?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/douglasville',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/augies_cafe_smb_parent__atlanta__new_business__86_hero-e1666179925108.jpg',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/riverdale',
    onlineOrdering: '/location/riverdale',
    reservations: 'sms:16783048191?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/riverdale',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Catfish-Grits-scaled.jpg',
    hours: {
      monday: '12pm-9pm',
      tuesday: '12pm-9pm',
      wednesday: '12pm-9pm',
      thursday: '12pm-10pm',
      friday: '12pm-11pm',
      saturday: '11am-11pm',
      sunday: '11am-9pm'
    },
    locationUrl: '/location/valdosta',
    onlineOrdering: '/location/valdosta',
    reservations: 'sms:2292314653?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/valdosta',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/1ddbe3ac887b406aa6277a86d551faae-1024x1024.jpeg',
    hours: {
      monday: '11am-9pm',
      tuesday: '11am-9pm',
      wednesday: '11am-9pm',
      thursday: '11am-10pm',
      friday: '11am-11pm',
      saturday: '10am-11pm',
      sunday: '10am-9pm'
    },
    locationUrl: '/location/albany',
    onlineOrdering: '/location/albany',
    reservations: 'sms:12292312101?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/albany',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2022/10/DSC06011_edited.jpg',
    hours: {
      monday: '11am-10pm',
      tuesday: '11am-10pm',
      wednesday: '11am-10pm',
      thursday: '11am-11pm',
      friday: '11am-12am',
      saturday: '10am-12am',
      sunday: '10am-10pm'
    },
    locationUrl: '/location/stone-mountain',
    onlineOrdering: '/location/stone-mountain',
    reservations: 'sms:14703348255?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/stone-mountain',
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
    image: 'https://finandfeathersrestaurants.com/wp-content/uploads/2024/07/FIN_AND_FEATHER-Malibu-Ribeye-scaled.jpg',
    hours: {
      monday: '11am-12am',
      tuesday: '11am-12am',
      wednesday: '11am-12am',
      thursday: '11am-12am',
      friday: '11am-2am',
      saturday: '10am-2am',
      sunday: '10am-12am'
    },
    locationUrl: '/location/las-vegas',
    onlineOrdering: '/location/las-vegas',
    reservations: 'sms:17025466394?&body=Include%20Full%20Name,%20Number%20in%20Party,%20Date%20and%20Time%20Requested',
    delivery: '/location/las-vegas',
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
