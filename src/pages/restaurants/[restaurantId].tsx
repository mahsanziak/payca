import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Menu from '../../components/Menu';
import Loading from '../../components/Loading';

const RestaurantMenu: React.FC = () => {
  const router = useRouter();
  const { restaurantId } = router.query;
  const [menuId, setMenuId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!restaurantId) return;

      try {
        // Fetch restaurant name
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;

        // Fetch the enabled menu
        const { data: menuData, error: menuError } = await supabase
          .from('menus')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('enabled', true)
          .single();

        if (menuError) throw menuError;

        setRestaurantName(restaurantData?.name || '');
        setMenuId(menuData?.id || '');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId]);

  if (loading) return <Loading restaurantName={restaurantName || 'Loading...'} />;
  if (!menuId) return <p>No active menu found for this restaurant.</p>;

  return (
    <main className="container mx-auto py-8 px-6">
      <div className="text-center mb-8">
        <h1 className="text-7xl font-bold">{restaurantName}</h1>
      </div>
      <Menu menuId={menuId} tableId={''} isCartOpen={false} onCloseCart={() => {}} />
    </main>
  );
};

export default RestaurantMenu;
