import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../utils/supabaseClient';
import Menu from '../../../../components/Menu';
import Loading from '../../../../components/Loading';
import { CartProvider } from '../../../../context/CartContext';

const TableMenu: React.FC = () => {
  const router = useRouter();
  const { restaurantId, tableId } = router.query;
  const [menuId, setMenuId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchMenuId = async () => {
      if (!restaurantId) return;

      // Fetch restaurant name
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', restaurantId)
        .single();

      // Fetch menu ID
      const { data: menuData, error: menuError } = await supabase
        .from('menus')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .single();

      if (restaurantError || menuError) {
        console.error('Error fetching data:', restaurantError || menuError);
        setLoading(false);
      } else {
        setRestaurantName(restaurantData?.name || '');
        setMenuId(menuData?.id || '');
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchMenuId();
    }
  }, [restaurantId]);

  if (loading) return <Loading restaurantName={restaurantName || 'Loading...'} />;
  if (!menuId) return <p>No menu found for this restaurant.</p>;

  return (
    <CartProvider tableId={tableId as string}>
      <main className="container mx-auto py-8 px-6">
        <div className="text-center mb-8">
          <h1 className="text-7xl font-bold">{restaurantName}</h1>
        </div>
        <Menu menuId={menuId} tableId={tableId as string} isCartOpen={isCartOpen} onCloseCart={() => setIsCartOpen(false)} />
      </main>
    </CartProvider>
  );
};

export default TableMenu;
