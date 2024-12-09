import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Link as ScrollLink, Element } from 'react-scroll';
import Image from 'next/image';
import CartSidebar from './CartSidebar';
import Feedbacks from './Feedbacks'; // Import the Feedbacks component
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router'; 

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  menu_id: string;
  category_id: string;
  hide: string;
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
  const { addToCart, toggleCart, cart, isOpen, closeCart } = useCart();
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const router = useRouter();
  const { restaurantId } = router.query; // Fetch restaurantId from the query
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!menuId) return;

      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId)
        .neq('hide', 'Yes');

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

    const intervalId = setInterval(fetchMenuData, 5000);

    return () => clearInterval(intervalId);
  }, [menuId]);

  if (loading) return <p>Loading...</p>;

  const filteredCategories = categories.filter((category) =>
    menuItems.some((item) => item.category_id === category.id && item.hide !== 'Yes')
  );

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
    setAddedItem(item.id);
    toggleCart();
    setTimeout(() => setAddedItem(null), 500);
  };
  

  return (
    <div className="bg-black text-gold font-cormorant relative">
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
                .filter((item) => item.category_id === category.id && item.hide !== 'Yes')
                .map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex justify-between items-center bg-black shadow-md rounded-lg p-4 border-b border-gold cursor-pointer"
                    onClick={() => handleAddToCart(item)}
                    animate={addedItem === item.id ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center">
                      <Image
                        src={item.image_url || 'https://placehold.co/100x100'}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="rounded-full w-24 h-24 object-cover mr-4"
                      />
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-end ml-auto">
                      <span className="text-md font-bold text-gold">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </Element>
        ))}
      </div>

      <CartSidebar isOpen={isOpen} onClose={closeCart} />

      {/* Add Feedbacks Component */}
      {restaurantId && (
        <div className="max-w-7xl mx-auto p-6">
          <Feedbacks restaurantId={restaurantId as string} />
        </div>
      )}
    </div>
  );
};

export default Menu;
