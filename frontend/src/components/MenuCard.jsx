import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const MenuCard = ({ item, variant = 'default' }) => {
  const isCompact = variant === 'compact';

  return (
    <Card className="overflow-hidden bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
      <div className={`relative ${isCompact ? 'h-44' : 'h-56'} overflow-hidden`}>
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-3 right-3 bg-red-500 text-white ${isCompact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-full font-bold ${isCompact ? 'text-xs' : 'text-sm'} shadow-lg`}>
          ${item.price}
        </div>
      </div>
      <CardContent className={isCompact ? 'p-4' : 'p-5'}>
        <h3 className={`${isCompact ? 'text-lg' : 'text-xl'} font-semibold text-white mb-2`}>{item.name}</h3>
        <p className={`text-slate-300 ${isCompact ? 'text-xs' : 'text-sm'} leading-relaxed mb-3 line-clamp-2`}>
          {item.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {item.badges && item.badges.map((badge, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`${
                badge === 'Chef\'s Special'
                  ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                  : badge === 'Spicy'
                  ? 'border-red-500 text-red-500 bg-red-500/10'
                  : badge === 'Vegetarian'
                  ? 'border-green-500 text-green-500 bg-green-500/10'
                  : 'border-slate-500 text-slate-400'
              } ${isCompact ? 'text-[10px]' : 'text-xs'} font-medium px-2 py-0.5`}
            >
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
