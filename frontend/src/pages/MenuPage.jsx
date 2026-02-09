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

  // Separate entrees from other items
  const entreeItems = useMemo(() => 
    filteredItems.filter(item => item.category === 'entrees'),
    [filteredItems]
  );

  const otherItems = useMemo(() => 
    filteredItems.filter(item => item.category !== 'entrees'),
    [filteredItems]
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
        {/* Entrees - 3 columns (larger cards) */}
        {entreeItems.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entreeItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Other items - 4 columns (smaller cards) */}
        {otherItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {otherItems.map((item) => (
              <MenuCard key={item.id} item={item} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
