import React from 'react';
import { ExternalLink, Flame, Utensils } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

/**
 * Hibachi Menu Component for the Food Truck location
 * Displays the hibachi-specific menu with combos, à la carte, sides, and sauces
 */
const HibachiMenu = ({ onlineOrderLink }) => {
  // Food gallery images
  const galleryImages = [
    { 
      url: 'https://customer-assets.emergentagent.com/job_11cd3604-2f5a-48c3-ba14-b46e5b99da28/artifacts/oj7rjhpp_image.png',
      alt: 'Hibachi grill with flames'
    },
    { 
      url: 'https://customer-assets.emergentagent.com/job_11cd3604-2f5a-48c3-ba14-b46e5b99da28/artifacts/j7nr3qtj_image.png',
      alt: 'Hibachi chicken and vegetables'
    },
    { 
      url: 'https://customer-assets.emergentagent.com/job_11cd3604-2f5a-48c3-ba14-b46e5b99da28/artifacts/1q21lyw4_image.png',
      alt: 'Lobster hibachi takeout'
    },
    { 
      url: 'https://customer-assets.emergentagent.com/job_11cd3604-2f5a-48c3-ba14-b46e5b99da28/artifacts/zcclajof_image.png',
      alt: 'Grilled shrimp'
    },
    { 
      url: 'https://customer-assets.emergentagent.com/job_11cd3604-2f5a-48c3-ba14-b46e5b99da28/artifacts/eq2k4x2y_image.png',
      alt: 'Hibachi steak with fried rice'
    }
  ];

  // Hibachi Singles
  const singles = [
    { name: 'Veggie Delight', price: 10, icon: '🥬' },
    { name: 'Chicken', price: 13, icon: '🍗' },
    { name: 'Steak', price: 17, icon: '🥩' },
    { name: 'Salmon', price: 18, icon: '🐟' },
    { name: 'Shrimp', price: 20, icon: '🍤' },
    { name: 'Lobster', price: 25, icon: '🦞', premium: true }
  ];

  // Hibachi Duets
  const duets = [
    { name: 'Chicken & Shrimp', price: 21 },
    { name: 'Steak & Chicken', price: 22 },
    { name: 'Steak & Shrimp', price: 24 },
    { name: 'Lobster & Chicken', price: 30 },
    { name: 'Lobster & Shrimp', price: 32 }
  ];

  // Hibachi Trios
  const trios = [
    { name: 'Salmon, Chicken & Shrimp', price: 34 },
    { name: 'Lobster, Chicken & Shrimp', price: 36 },
    { name: 'Lobster, Steak & Shrimp', price: 38 },
    { name: 'Salmon, Lobster & Shrimp', price: 39 },
    { name: 'Salmon, Lobster & Steak', price: 40, popular: true }
  ];

  // À la carte proteins
  const proteins = [
    { name: 'Steak', price: 10, icon: '🥩' },
    { name: 'Salmon', price: 12, icon: '🐟' },
    { name: 'Lobster', price: 14, icon: '🦞', premium: true }
  ];

  // Sides
  const sides = [
    { name: 'Steamed Rice', price: 3 },
    { name: 'Side Vegetables', price: 4 },
    { name: 'Chicken Fried Rice', price: 7 }
  ];

  // Sauces
  const sauces = [
    { name: 'Yum Yum Sauce', price: 0.50 }
  ];

  // Beverages - Canned Sodas
  const beverages = [
    { name: 'Coke', price: 2 },
    { name: 'Sprite', price: 2 },
    { name: 'Grape Soda', price: 2 },
    { name: 'Orange Soda', price: 2 },
    { name: 'Lemonade', price: 6 }
  ];

  return (
    <div className="space-y-6" data-testid="hibachi-menu">
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

      {/* Food Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="hibachi-gallery">
        {galleryImages.map((image, index) => (
          <div 
            key={index} 
            className={`relative overflow-hidden rounded-xl ${index === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}`}
          >
            <img 
              src={image.url} 
              alt={image.alt}
              className="w-full h-full object-cover aspect-square hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>

      {/* Hibachi Singles */}
      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl p-6" data-testid="hibachi-singles">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🍱</span>
          Hibachi Single
        </h3>
        <p className="text-slate-400 text-sm mb-4">Includes fried rice and fresh vegetables • Large +$3.25</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {singles.map((item) => (
            <div 
              key={item.name} 
              className={`bg-slate-800/60 border rounded-lg p-4 flex items-center justify-between ${item.premium ? 'border-amber-500/50' : 'border-slate-700/50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white font-semibold">{item.name}</span>
              </div>
              <span className={`font-bold text-lg ${item.premium ? 'text-amber-400' : 'text-orange-400'}`}>
                ${item.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hibachi Duets */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-duets">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🍱🍱</span>
          Hibachi Duet
        </h3>
        <p className="text-slate-400 text-sm mb-4">Choose 2 proteins with fried rice and vegetables</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {duets.map((item) => (
            <div 
              key={item.name} 
              className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 flex items-center justify-between"
            >
              <span className="text-slate-300">{item.name}</span>
              <span className="text-orange-400 font-bold">${item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hibachi Trios */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-6" data-testid="hibachi-trios">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🍱🍱🍱</span>
          Hibachi Trio
          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full ml-2">Best Value</span>
        </h3>
        <p className="text-slate-400 text-sm mb-4">Choose 3 proteins with fried rice and vegetables</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trios.map((item) => (
            <div 
              key={item.name} 
              className={`bg-slate-900/60 border rounded-lg p-4 flex items-center justify-between ${item.popular ? 'border-orange-500/50 ring-1 ring-orange-500/30' : 'border-slate-700/40'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-300">{item.name}</span>
                {item.popular && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
                )}
              </div>
              <span className="text-orange-400 font-bold text-lg">${item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* À La Carte Proteins */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-proteins">
        <h3 className="text-xl font-bold text-white mb-4">🔥 À La Carte</h3>
        <p className="text-slate-400 text-sm mb-4">Add extra protein to any order</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* Sauces */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hibachi-sauces">
          <h3 className="text-xl font-bold text-white mb-4">🥢 Sauces</h3>
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
        <h3 className="text-xl font-bold text-white mb-4">🥤 Beverages - Canned Sodas</h3>
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
