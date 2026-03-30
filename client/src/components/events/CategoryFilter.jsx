'use client';
import { categories } from '@/data/mockData';

export const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
  onClick={() => onSelectCategory(null)}
  className={`px-6 py-2 rounded-full font-medium transition-all duration-150 ${
    selectedCategory === null
      ? 'bg-primary text-primary-foreground shadow-md'
      : 'bg-[#050c1a] text-gray-300 hover:bg-[#112240] hover:text-white shadow-sm'
  } active:bg-blue-200 active:text-blue-900 active:shadow-inner active:scale-[0.97]`}
>
  All Events
</button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <span>{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
};
