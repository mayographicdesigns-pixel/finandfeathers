import React from 'react';
import { Badge } from './ui/badge';

const MenuLineItem = ({ item, isExpanded = false, onToggleExpand }) => {
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(item);
    }
  };
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all duration-200 border border-slate-700/30 cursor-pointer" onClick={handleToggle} data-testid={`menu-line-item-${item.id}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-medium text-white">{item.name}</h3>
          {item.badges && item.badges.map((badge, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`${
                badge === "Chef's Special"
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                  : badge === 'Spicy'
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : badge === 'Vegetarian'
                  ? 'border-green-500 text-green-500 bg-green-500/10'
                  : 'border-slate-500 text-slate-400'
              } text-[10px] font-medium px-1.5 py-0.5`}
            >
              {badge}
            </Badge>
          ))}
        </div>
        {item.description && (
          <p className="text-slate-400 text-xs mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">
        <span className="text-red-500 font-bold text-base">
          {item.priceLabel ? item.priceLabel : item.price !== null ? `$${item.price}` : 'MKT'}
        </span>
      </div>
    </div>
  );
};

export default MenuLineItem;
