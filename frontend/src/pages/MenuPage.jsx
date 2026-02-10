import React, { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import CategoryFilter from '../components/CategoryFilter';
import MenuCard from '../components/MenuCard';
import MenuLineItem from '../components/MenuLineItem';
import { categories, menuItems } from '../mockData';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  // Group items by category for "All" view
  const itemsByCategory = useMemo(() => {
    if (activeCategory !== 'all') {
      return null;
    }

    const grouped = {
      'daily-specials': [],
      'starters': [],
      'entrees': [],
      'seafood-grits': [],
      'sandwiches': [],
      'salads': [],
      'sides': [],
      'brunch': [],
      'brunch-sides': []
    };

    menuItems.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });

    return grouped;
  }, [activeCategory]);

  // Category display names
  const categoryNames = {
    'daily-specials': '$5 Daily Specials',
    'starters': 'Starters',
    'entrees': 'Entrees',
    'seafood-grits': 'Seafood & Grits',
    'sandwiches': 'Sandwiches',
    'salads': 'Salads',
    'sides': 'Sides',
    'brunch': 'Brunch',
    'brunch-sides': 'Brunch Sides'
  };

  // Separate large items (entrees & seafood-grits) from other items
  const largeItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'entrees' || item.category === 'seafood-grits'),
    [filteredItems]
  );

  // Line items (sides and brunch-sides)
  const lineItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'sides' || item.category === 'brunch-sides'),
    [filteredItems]
  );

  const smallItems = useMemo(() => 
    filteredItems.filter(item => 
      item.category !== 'entrees' && 
      item.category !== 'seafood-grits' &&
      item.category !== 'sides' &&
      item.category !== 'brunch-sides'
    ),
    [filteredItems]
  );

  const otherSmallItems = useMemo(() => 
    smallItems,
    [smallItems]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with logo and location */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 tracking-wide">
              Fin & Feathers
            </h1>
            <p className="text-amber-500 text-lg font-semibold tracking-wider">RESTAURANTS</p>
          </div>
          
          {/* Location Button */}
          <Button
            variant="outline"
            className="bg-slate-800/70 border-amber-600/50 text-amber-500 hover:bg-slate-700 hover:text-amber-400 hover:border-amber-500 transition-all duration-300 px-6 py-2.5 rounded-lg"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Select a location to view availability and place orders
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Our Menu
        </h2>
        <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Elevated dining meets Southern soul. Every dish crafted with fresh
          ingredients and genuine hospitality.
        </p>
      </div>

      {/* Signature Selections Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-2xl">✨</span>
          <h2 className="text-3xl font-bold text-white">Signature Selections</h2>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto px-4">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 pb-16">
        {/* If "All" tab is selected, show items grouped by category with headers */}
        {activeCategory === 'all' && itemsByCategory && (
          <div className="space-y-12">
            {/* $5 Daily Specials - At the top */}
            {itemsByCategory['daily-specials'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 border-b border-slate-700 pb-3">
                  {categoryNames['daily-specials']}
                </h3>
                <p className="text-slate-400 text-sm mb-5">Monday-Friday 12pm-8pm • Saturday 5pm-8pm • Sunday 6pm-12am</p>
                
                {/* Food Items */}
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-300 mb-4">Food</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {itemsByCategory['daily-specials']
                      .filter(item => item.type === 'food')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" />
                      ))}
                  </div>
                </div>
                
                {/* Drink Items */}
                <div>
                  <h4 className="text-xl font-semibold text-slate-300 mb-4">Drinks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {itemsByCategory['daily-specials']
                      .filter(item => item.type === 'drink')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Starters */}
            {itemsByCategory['starters'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['starters']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['starters'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Entrees */}
            {itemsByCategory['entrees'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['entrees']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsByCategory['entrees'].map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Seafood & Grits */}
            {itemsByCategory['seafood-grits'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['seafood-grits']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itemsByCategory['seafood-grits'].map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Sandwiches */}
            {itemsByCategory['sandwiches'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['sandwiches']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['sandwiches'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Salads */}
            {itemsByCategory['salads'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['salads']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {itemsByCategory['salads'].map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Sides - Line items in 4 columns */}
            {itemsByCategory['sides'].length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-5 border-b border-slate-700 pb-3">
                  {categoryNames['sides']}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {itemsByCategory['sides'].map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single category view */}
        {activeCategory !== 'all' && (
          <>
            {/* Daily Specials Category - Split into Food and Drinks */}
            {activeCategory === 'daily-specials' && (
              <>
                <div className="mb-2">
                  <p className="text-slate-400 text-sm mb-6">Monday-Friday 12pm-8pm • Saturday 5pm-8pm • Sunday 6pm-12am</p>
                </div>
                
                {/* Food section */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Food</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredItems
                      .filter(item => item.type === 'food')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" />
                      ))}
                  </div>
                </div>
                
                {/* Drinks section */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Drinks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredItems
                      .filter(item => item.type === 'drink')
                      .map((item) => (
                        <MenuCard key={item.id} item={item} variant="compact" />
                      ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Large items - Entrees & Seafood & Grits - 3 columns */}
            {activeCategory !== 'daily-specials' && largeItems.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {largeItems.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Other small items - 4 columns (smaller cards) */}
            {activeCategory !== 'daily-specials' && otherSmallItems.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {otherSmallItems.map((item) => (
                    <MenuCard key={item.id} item={item} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Line items - Sides - Simple list in 4 columns */}
            {activeCategory !== 'daily-specials' && lineItems.length > 0 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {lineItems.map((item) => (
                    <MenuLineItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
