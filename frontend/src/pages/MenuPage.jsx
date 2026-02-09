import React, { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import CategoryFilter from '../components/CategoryFilter';
import MenuCard from '../components/MenuCard';
import { categories, menuItems } from '../mockData';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  // Separate large items (entrees & seafood-grits) from other items
  const largeItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'entrees' || item.category === 'seafood-grits'),
    [filteredItems]
  );

  const smallItems = useMemo(() => 
    filteredItems.filter(item => item.category !== 'entrees' && item.category !== 'seafood-grits'),
    [filteredItems]
  );

  // For daily specials, separate drinks (cocktails) from food
  const dailySpecialFood = useMemo(() => 
    smallItems.filter(item => item.category === 'daily-specials'),
    [smallItems]
  );

  const dailySpecialDrinks = useMemo(() => 
    filteredItems.filter(item => item.category === 'cocktails' && activeCategory === 'daily-specials'),
    [filteredItems, activeCategory]
  );

  const otherSmallItems = useMemo(() => 
    smallItems.filter(item => item.category !== 'daily-specials'),
    [smallItems]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with location */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="flex justify-center">
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
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Our Menu
        </h1>
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
        {/* Large items - Entrees & Seafood & Grits - 3 columns */}
        {largeItems.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {largeItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Daily Specials Food - 4 columns (smaller cards) */}
        {activeCategory === 'daily-specials' && dailySpecialFood.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Food</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {dailySpecialFood.map((item) => (
                <MenuCard key={item.id} item={item} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Daily Specials Drinks - 4 columns (smaller cards) */}
        {activeCategory === 'daily-specials' && dailySpecialDrinks.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Drinks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {dailySpecialDrinks.map((item) => (
                <MenuCard key={item.id} item={item} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Other small items - 4 columns (smaller cards) */}
        {activeCategory !== 'daily-specials' && otherSmallItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {otherSmallItems.map((item) => (
              <MenuCard key={item.id} item={item} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
