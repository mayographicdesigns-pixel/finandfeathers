import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Edit2, ZoomIn } from 'lucide-react';

const MenuCard = ({ item, variant = 'default', editMode = false, onEdit, onImageClick, isExpanded = false, onToggleExpand }) => {
  const isCompact = variant === 'compact';
  const isExpandedState = isExpanded;
  // Support both image and image_url properties
  const imageUrl = item.image_url || item.image;
  const hasImage = imageUrl && imageUrl.trim() !== '';
  const isLineLayout = item.layout === 'line';

  const handleImageClick = (e) => {
    if (editMode && onEdit) {
      onEdit(item);
    } else if (onImageClick && hasImage) {
      e.stopPropagation();
      onImageClick(item);
    }
  };

  const handleToggle = () => {
    if (editMode && onEdit) {
      onEdit(item);
      return;
    }
    if (onToggleExpand) {
      onToggleExpand(item);
    }
  };
  
  // If it's marked as line layout or has no image, render as line item
  if (isLineLayout || !hasImage) {
    return (
      <div 
        className={`flex items-center justify-between py-3 px-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all duration-200 border border-slate-700/30 ${editMode ? 'cursor-pointer ring-2 ring-red-500/50 ring-dashed' : 'cursor-pointer'}`}
        onClick={handleToggle}
        data-testid={`menu-line-card-${item.id}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {editMode && <Edit2 className="w-3 h-3 text-red-400" />}
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
  }

  return (
    <Card 
      className={`overflow-hidden bg-slate-800/80 border-slate-700/50 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${editMode ? 'cursor-pointer ring-2 ring-red-500/50 ring-dashed' : ''}`}
      onClick={editMode && onEdit ? () => onEdit(item) : undefined}
    >
      <div 
        className={`relative ${isCompact ? 'h-44' : 'h-56'} overflow-hidden ${!editMode ? 'cursor-pointer' : ''}`}
        onClick={handleImageClick}
      >
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-3 right-3 bg-red-500 text-white ${isCompact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-full font-bold ${isCompact ? 'text-xs' : 'text-sm'} shadow-lg`}>
          {item.priceLabel ? item.priceLabel : item.price !== null ? `$${item.price}` : 'MKT'}
        </div>
        {editMode ? (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Edit2 className="w-3 h-3" />
            Click to Edit
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 rounded-full p-2">
              <ZoomIn className="w-5 h-5 text-slate-800" />
            </div>
          </div>
        )}
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
                badge === "Chef's Special"
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
