import React from 'react';
import { Button } from './ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="mb-8">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 py-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              className={`${
                activeCategory === category.id
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700/70 hover:text-white'
              } px-6 py-2 rounded-full transition-all duration-300 whitespace-nowrap font-medium`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
};

export default CategoryFilter;
