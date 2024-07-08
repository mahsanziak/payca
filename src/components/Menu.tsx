import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link as ScrollLink, Element } from 'react-scroll';
import Image from 'next/image';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';

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

type MenuProps = {
  menuId: string;
  tableId: string;
  isCartOpen: boolean;
  onCloseCart: () => void;
};

const Menu: React.FC<MenuProps> = ({ menuId, tableId, isCartOpen, onCloseCart }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!menuId) return;

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId);

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

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
    openCart();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-gray-50 font-roboto">
      <div className="pattern-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex overflow-x-auto space-x-4 hide-scrollbar">
            {categories.map((category) => (
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
        {categories.map((category) => (
          <Element key={category.id} name={category.name} className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl">{category.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {menuItems
                .filter((item) => item.category_id === category.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center bg-white shadow-md rounded-lg p-4"
                  >
                    <Image
                      src={item.image_url || 'https://placehold.co/100x100'}
                      alt={item.name}
                      width={100}
                      height={100}
                      className="rounded-full w-24 h-24 object-cover mr-4"
                    />
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold">
                        {item.name}{' '}
                        <span className="text-md font-bold text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="ml-4 p-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition"
                      aria-label="Add to Cart"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                ))}
            </div>
          </Element>
        ))}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={onCloseCart} />
    </div>
  );
};

export default Menu;
