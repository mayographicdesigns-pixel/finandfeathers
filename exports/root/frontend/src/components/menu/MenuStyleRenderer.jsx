import React from 'react';
import { MenuStyleOne } from './MenuStyleOne';
import { MenuStyleTwo } from './MenuStyleTwo';
import { MenuStyleThree } from './MenuStyleThree';
import { MenuStyleFour } from './MenuStyleFour';
import { MENU_STYLES, DEFAULT_CATEGORY_STYLES } from './index';
import MenuCard from '../MenuCard';

// Menu Style Renderer - renders menu items with the appropriate style
export const MenuStyleRenderer = ({ 
  items, 
  category,
  styleOverride, // Allow manual style override
  categoryStyles = {}, // Custom category-to-style mapping from admin
  isExpanded,
  expandedItemId,
  onToggleExpand,
  onImageClick,
  editMode = false,
  onEdit
}) => {
  // Determine which style to use
  const getStyle = () => {
    if (styleOverride) return styleOverride;
    if (categoryStyles[category]) return categoryStyles[category];
    return DEFAULT_CATEGORY_STYLES[category] || 'default';
  };
  
  const styleId = getStyle();
  const styleConfig = MENU_STYLES[styleId] || MENU_STYLES.default;
  
  // Render individual item based on style
  const renderItem = (item) => {
    const isItemExpanded = expandedItemId === item.id;
    const commonProps = {
      key: item.id,
      item,
      isExpanded: isItemExpanded,
      onToggleExpand,
      onImageClick
    };
    
    switch (styleId) {
      case 'style_one':
        return <MenuStyleOne {...commonProps} />;
      case 'style_two':
        return <MenuStyleTwo {...commonProps} />;
      case 'style_three':
        return <MenuStyleThree {...commonProps} />;
      case 'style_four':
        return <MenuStyleFour {...commonProps} />;
      default:
        return (
          <MenuCard 
            key={item.id}
            item={item}
            variant="compact"
            editMode={editMode}
            onEdit={onEdit}
            onImageClick={onImageClick}
            isExpanded={isItemExpanded}
            onToggleExpand={onToggleExpand}
          />
        );
    }
  };
  
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className={`grid ${styleConfig.gridClass}`}>
      {items.map(renderItem)}
    </div>
  );
};

export default MenuStyleRenderer;
