import React from 'react';
import { ExternalLink, Flame, Utensils } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

/**
 * Hibachi Menu Component for the Food Truck location
 * Displays the hibachi-specific menu with combos, à la carte, sides, and sauces
 */
const HibachiMenu = ({ onlineOrderLink }) => {
  // Combo packages
  const combos = [
    {
      name: 'Single',
      description: 'Choose 1 protein with fried rice and vegetables',
      icon: '🍱',
      proteins: ['Chicken', 'Steak', 'Shrimp', 'Salmon', 'Lobster']
    },
    {
      name: 'Duet',
      description: 'Choose 2 proteins with fried rice and vegetables',
      icon: '🍱🍱',
      proteins: ['Any 2 proteins of your choice']
    },
    {
      name: 'Trio',
      description: 'Choose 3 proteins with fried rice and vegetables',
      icon: '🍱🍱🍱',
      proteins: ['Any 3 proteins of your choice'],
      popular: true
    }
  ];

  // À la carte proteins
  const proteins = [
    { name: 'Chicken', price: 7, icon: '🍗' },
    { name: 'Steak', price: 10, icon: '🥩' },
    { name: 'Shrimp', price: 10, icon: '🍤' },
    { name: 'Salmon', price: 12, icon: '🐟' },
    { name: 'Lobster', price: 14, icon: '🦞', premium: true }
  ];

  // Sides
  const sides = [
    { name: 'Fried Rice', price: 5 },
    { name: 'Chicken Fried Rice', price: 7 },
    { name: 'Side Vegetables', price: 4 },
    { name: 'Steamed White Rice', price: 3 }
  ];

  // Sauces & Extras
  const sauces = [
    { name: 'Yum Yum Sauce', price: 0.50 },
    { name: 'Soy Sauce', price: 0.50 },
    { name: 'Garlic Butter', price: 0.50 },
    { name: 'Teriyaki Sauce', price: 0.75 },
    { name: 'Lemon Wedge', price: 0.25 }
  ];

  // Beverages
  const beverages = [
    { name: 'Water', price: 2 },
    { name: 'Sprite', price: 2 },
    { name: 'Coca-Cola', price: 2 },
    { name: 'Diet Coke', price: 2 },
    { name: 'Grape Soda', price: 2 },
    { name: 'Orange Soda', price: 2 },
    { name: 'Strawberry Soda', price: 2 }
  ];

  return (
    <div className="space-y-8" data-testid="hibachi-menu">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Flame className="w-8 h-8 text-orange-500" />
          <h2 className="text-3xl font-bold text-white">Hibachi Menu</h2>
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <p className="text-slate-400">Fresh hibachi cooked to order on our mobile grill</p>
      </div>

      {/* Order Online Button */}
      {onlineOrderLink && (
        <div className="flex justify-center">
          <Button 
            onClick={() => window.open(onlineOrderLink, '_blank')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg"
            data-testid="hibachi-order-online-btn"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order Online Now
          </Button>
        </div>
      )}

      {/* Combo Packages */}
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl p-6" data-testid="hibachi-combos">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Utensils className="w-6 h-6 text-orange-400" />
          Hibachi Combos
        </h3>
        <p className="text-slate-400 text-sm mb-4">All combos include fried rice and fresh vegetables</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {combos.map((combo) => (
            <Card 
              key={combo.name} 
              className={`bg-slate-800/60 border-slate-700/50 ${combo.popular ? 'ring-2 ring-orange-500/50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{combo.icon}</span>
                  {combo.popular && (
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                  )}
                </div>
                <h4 className="text-xl font-bold text-white mb-1">{combo.name}</h4>
                <p className="text-slate-400 text-sm mb-3">{combo.description}</p>
                <div className="text-xs text-slate-500">
                  {combo.proteins.join(' • ')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-orange-400 text-sm mt-4">
          <strong>Upgrades:</strong> Fried Rice (+$2) • Chicken Fried Rice (+$3)
        </p>
      </div>

      {/* À La Carte Proteins */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-proteins">
        <h3 className="text-xl font-bold text-white mb-4">🔥 À La Carte Proteins</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {proteins.map((item) => (
            <div 
              key={item.name} 
              className={`bg-slate-900/60 border rounded-lg p-4 text-center ${item.premium ? 'border-amber-500/50' : 'border-slate-700/40'}`}
            >
              <span className="text-3xl mb-2 block">{item.icon}</span>
              <h4 className="text-white font-semibold">{item.name}</h4>
              <span className={`font-bold ${item.premium ? 'text-amber-400' : 'text-orange-400'}`}>
                ${item.price}
              </span>
              {item.premium && (
                <span className="block text-xs text-amber-500 mt-1">Premium</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sides & Sauces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sides */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-sides">
          <h3 className="text-xl font-bold text-white mb-4">🍚 Sides</h3>
          <div className="space-y-2">
            {sides.map((item) => (
              <div key={item.name} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-slate-300">{item.name}</span>
                <span className="text-orange-400 font-bold">${item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sauces & Extras */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-sauces">
          <h3 className="text-xl font-bold text-white mb-4">🥢 Sauces & Extras</h3>
          <div className="space-y-2">
            {sauces.map((item) => (
              <div key={item.name} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                <span className="text-slate-300">{item.name}</span>
                <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beverages */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-beverages">
        <h3 className="text-xl font-bold text-white mb-4">🥤 Beverages</h3>
        <div className="flex flex-wrap gap-3">
          {beverages.map((item) => (
            <div key={item.name} className="bg-slate-900/60 border border-slate-700/40 rounded-lg px-4 py-2">
              <span className="text-slate-300">{item.name}</span>
              <span className="text-orange-400 font-bold ml-2">${item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-4 text-center">
        <p className="text-orange-400 text-sm">
          <strong>📍 Location varies</strong> — Follow us on social media for our current location and event schedule!
        </p>
      </div>

      {/* Order Online Button (bottom) */}
      {onlineOrderLink && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => window.open(onlineOrderLink, '_blank')}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
            data-testid="hibachi-order-online-btn-bottom"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order for Pickup
          </Button>
        </div>
      )}
    </div>
  );
};

export default HibachiMenu;
