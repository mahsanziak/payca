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
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    const validateTableAndFetchMenu = async () => {
      if (!restaurantId || !tableId) return;

      try {
        // Validate if the table exists
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('id', tableId)
          .single();

        if (tableError || !tableData) {
          console.error('Invalid table ID:', tableError);
          setTableExists(false);
          setLoading(false);
          return;
        }

        setTableExists(true);

        // Fetch restaurant name
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;

        // Fetch the enabled menu for the restaurant
        const { data: menuData, error: menuError } = await supabase
          .from('menus')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('enabled', true)
          .single();

        if (menuError) throw menuError;

        // Set the state with restaurant name and menu ID
        setRestaurantName(restaurantData?.name || '');
        setMenuId(menuData?.id || null);
      } catch (error) {
        console.error('Error fetching menu or restaurant:', error);
      } finally {
        setLoading(false);
      }
    };

    validateTableAndFetchMenu();
  }, [restaurantId, tableId]);

  if (loading) return <Loading restaurantName={restaurantName || 'Loading...'} />;
  if (!tableExists) return <p>Invalid table ID. Please check the URL.</p>;
  if (!menuId) return <p>No active menu found for this restaurant.</p>;

  return (
    <CartProvider>
      <main className="container mx-auto py-8 px-6">
        <div className="text-center mb-8">
          <h1 className="text-7xl font-bold">{restaurantName}</h1>
        </div>
        <Menu
          menuId={menuId}
          tableId={tableId as string}
          isCartOpen={isCartOpen}
          onCloseCart={() => setIsCartOpen(false)}
        />
      </main>
    </CartProvider>
  );
};

export default TableMenu;
