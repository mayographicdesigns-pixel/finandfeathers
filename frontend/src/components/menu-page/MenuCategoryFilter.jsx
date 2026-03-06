import React from 'react';
import { Button } from '../ui/button';

const MenuCategoryFilter = ({
  mainCategories,
  activeCategory,
  activeSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  foodSubCategories,
  drinksSubCategories,
  cocktailSubCategories,
  nonAlcoholicSubCategories
}) => {
  const renderSubCategories = (categories, parentCategory) => {
    if (activeCategory !== parentCategory) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3 justify-center" data-testid={`${parentCategory}-subcategories`}>
        {categories.map((sub) => (
          <Button
            key={sub.id}
            variant={activeSubCategory === sub.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSubCategoryChange(sub.id)}
            className={`
              ${activeSubCategory === sub.id 
                ? 'bg-red-600 text-white border-red-500' 
                : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700'
              }
              transition-all duration-200
            `}
            data-testid={`subcategory-${sub.id}`}
          >
            <span className="mr-1">{sub.icon}</span>
            {sub.name}
          </Button>
        ))}
      </div>
    );
  };

  const renderNestedDrinksSubCategories = () => {
    if (activeCategory !== 'drinks') return null;
    
    // If cocktails is selected, show cocktail sub-categories
    if (activeSubCategory === 'cocktails' && cocktailSubCategories) {
      return (
        <div className="flex flex-wrap gap-2 mt-2 justify-center" data-testid="cocktails-nested-subcategories">
          {cocktailSubCategories.map((sub) => (
            <Button
              key={sub.id}
              variant="ghost"
              size="sm"
              onClick={() => onSubCategoryChange(sub.id)}
              className="bg-slate-900/50 text-amber-400 border border-amber-600/30 hover:bg-amber-900/30"
              data-testid={`nested-subcategory-${sub.id}`}
            >
              <span className="mr-1">{sub.icon}</span>
              {sub.name}
            </Button>
          ))}
        </div>
      );
    }
    
    // If non-alcoholic is selected, show non-alcoholic sub-categories
    if (activeSubCategory === 'non-alcoholic' && nonAlcoholicSubCategories) {
      return (
        <div className="flex flex-wrap gap-2 mt-2 justify-center" data-testid="non-alcoholic-nested-subcategories">
          {nonAlcoholicSubCategories.map((sub) => (
            <Button
              key={sub.id}
              variant="ghost"
              size="sm"
              onClick={() => onSubCategoryChange(sub.id)}
              className="bg-slate-900/50 text-green-400 border border-green-600/30 hover:bg-green-900/30"
              data-testid={`nested-subcategory-${sub.id}`}
            >
              <span className="mr-1">{sub.icon}</span>
              {sub.name}
            </Button>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="mb-8" data-testid="menu-category-filter">
      {/* Main Categories */}
      <div className="flex flex-wrap gap-2 justify-center mb-4" data-testid="main-categories">
        {mainCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => onCategoryChange(cat.id)}
            className={`
              ${activeCategory === cat.id 
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/30' 
                : 'bg-slate-800/80 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
              }
              transition-all duration-200 text-sm md:text-base px-4 py-2
            `}
            data-testid={`category-${cat.id}`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Food Sub-Categories */}
      {renderSubCategories(foodSubCategories, 'food')}

      {/* Drinks Sub-Categories */}
      {renderSubCategories(drinksSubCategories, 'drinks')}

      {/* Nested Drinks Sub-Categories (Cocktails, Non-Alcoholic) */}
      {renderNestedDrinksSubCategories()}
    </div>
  );
};

export default MenuCategoryFilter;
