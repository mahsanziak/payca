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

  if (loading) return <p>Loading...</p>;

  // Filter out categories with no items
  const filteredCategories = categories.filter(category =>
    menuItems.some(item => item.category_id === category.id)
  );

  return (
    <div className="bg-black text-gold font-cormorant">
      <div className="pattern-background py-12">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold">Menu</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {filteredCategories.map((category) => (
          <Element key={category.id} name={category.name} className="mb-12">
            <div className="flex justify-center items-center mb-8">
              <div className="border-t border-gold flex-grow"></div>
              <h2 className="text-3xl font-semibold px-4">{category.name}</h2>
              <div className="border-t border-gold flex-grow"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {menuItems
                .filter((item) => item.category_id === category.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-black shadow-md rounded-lg p-4 border-b border-gold"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-md font-bold text-gold">
                        ${item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart({
                          menu_item_id: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: 1,
                        })}
                        className="ml-4 p-2 bg-gold text-black rounded-full shadow-md hover:bg-gold-dark transition"
                        aria-label="Add to Cart"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
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
