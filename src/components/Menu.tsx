// src/components/Menu.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link as ScrollLink, Element } from 'react-scroll';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  menu_id: string;
  category_id: string;
};

type MenuCategory = {
  id: string;
  name: string;
};

const Menu: React.FC<{ menuId: string }> = ({ menuId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!menuId) return;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId);

      // Fetch menu categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuId);

      if (itemsError || categoriesError) {
        console.error('Error fetching menu data:', itemsError || categoriesError);
      } else {
        setMenuItems(itemsData);
        setCategories(categoriesData);
      }
      setLoading(false);
    };

    fetchMenuData();
  }, [menuId]);

  if (loading) return <p>Loading...</p>;

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  return (
    <div className="bg-gray-50 font-roboto">
      <div className="pattern-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex overflow-x-auto space-x-4 hide-scrollbar">
            {categories.map(category => (
              <ScrollLink
                key={category.id}
                to={category.name}
                smooth="easeInOutQuart"
                duration={100}
                offset={-100}
                className={`cursor-pointer py-2 px-6 border rounded-full border-gray-400 hover:bg-gray-400 hover:text-white transition duration-200 whitespace-nowrap ${
                  activeCategory === category.id ? 'bg-gray-300' : ''
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </ScrollLink>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {categories.map(category => (
          <Element key={category.id} name={category.name} className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl">{category.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {menuItems.filter(item => item.category_id === category.id).map(item => (
                <div key={item.id} className="flex items-center">
                  <img
                    src={item.image_url || 'https://placehold.co/100x100'}
                    alt={item.name}
                    className="rounded-full w-24 h-24 object-cover mr-4"
                  />
                  <div>
                    <h3 className="text-lg">
                      {item.name} <span className="text-md"><b>${item.price.toFixed(2)}</b></span>
                    </h3>
                    <p className="text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Element>
        ))}
      </div>
    </div>
  );
};

export default Menu;
