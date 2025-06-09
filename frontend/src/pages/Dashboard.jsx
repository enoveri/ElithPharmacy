import { useState, useEffect } from 'react';
import { StatCard } from '../components/ui';
import { supabase, isDevelopment } from '../lib/supabase';

// Dashboard page
function Dashboard() {
  const [stats, setStats] = useState({
    drugsAdded: 0,
    lowStockDrugs: 0,
    expiredProducts: 0,
    totalSales: 0,
    profitCurrentMonth: 0,
    totalProfit: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Skip actual data fetching if we're in development mode without proper Supabase setup
        if (isDevelopment) {
          // Check if Supabase connection is valid by making a simple query
          try {
            const { error: testError } = await supabase.from('drugs').select('id').limit(1);
            
            // If there's an error with the connection, use mock data instead
            if (testError) {
              console.warn('Using mock data due to Supabase connection error:', testError.message);
              // We'll use the default mock data from useState
              setLoading(false);
              return;
            }
          } catch (connectionError) {
            console.warn('Using mock data due to Supabase connection error:', connectionError.message);
            // We'll use the default mock data from useState
            setLoading(false);
            return;
          }
        }
        
        // If we get here, Supabase connection is working, so fetch real data
        try {
          // Fetch drugs count
          const { data: drugsData, error: drugsError } = await supabase
            .from('drugs')
            .select('id')
            .limit(1000);
            
          if (drugsError) throw drugsError;
          
          // Fetch low stock drugs
          const { data: lowStockData, error: lowStockError } = await supabase
            .from('drugs')
            .select('id')
            .lt('quantity', 10) // Assuming low stock is less than 10
            .limit(1000);
            
          if (lowStockError) throw lowStockError;
          
          // Fetch expired products
          const today = new Date().toISOString().split('T')[0];
          const { data: expiredData, error: expiredError } = await supabase
            .from('drugs')
            .select('id')
            .lt('expiry_date', today)
            .limit(1000);
            
          if (expiredError) throw expiredError;
          
          // Fetch total sales
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('amount')
            .limit(1000);
            
          if (salesError) throw salesError;
          
          const totalSales = salesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
          
          // Fetch current month profit
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const { data: profitData, error: profitError } = await supabase
            .from('sales')
            .select('profit')
            .gte('created_at', startOfMonth.toISOString())
            .limit(1000);
            
          if (profitError) throw profitError;
          
          const monthlyProfit = profitData?.reduce((sum, sale) => sum + (sale.profit || 0), 0) || 0;
          
          // Fetch total profit
          const { data: totalProfitData, error: totalProfitError } = await supabase
            .from('sales')
            .select('profit')
            .limit(1000);
            
          if (totalProfitError) throw totalProfitError;
          
          const totalProfit = totalProfitData?.reduce((sum, sale) => sum + (sale.profit || 0), 0) || 0;
          
          setStats({
            drugsAdded: drugsData?.length || 0,
            lowStockDrugs: lowStockData?.length || 0,
            expiredProducts: expiredData?.length || 0,
            totalSales: totalSales,
            profitCurrentMonth: monthlyProfit,
            totalProfit: totalProfit
          });
        } catch (dataError) {
          console.error('Error fetching specific data:', dataError);
          // We'll continue with the mock data already set in state
        }
      } catch (err) {
        console.error('Error in dashboard data fetching:', err);
        // Don't set error state, just log it - we'll use mock data
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Note</p>
          <p>Using demo data. {error}</p>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to the pharmacy management system</p>
      </div>
      
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <StatCard 
          title="Expired Products" 
          value={stats.expiredProducts}
          icon="hourglass_empty" 
          color="red" 
        />
        <StatCard 
          title="Total Sales Made" 
          value={`GH₵${stats.totalSales.toLocaleString()}`}
          icon="payments" 
          color="orange" 
        />
        <StatCard 
          title="Drugs Added" 
          value={stats.drugsAdded}
          icon="medication" 
          color="blue" 
        />
        <StatCard 
          title="Low Stock Drugs" 
          value={stats.lowStockDrugs}
          icon="inventory_2" 
          color="teal" 
        />
        <StatCard 
          title="Profit Current Month" 
          value={`GH₵${stats.profitCurrentMonth.toLocaleString()}`}
          icon="trending_up" 
          color="purple" 
        />
        <StatCard 
          title="Total Profit Made" 
          value={`GH₵${stats.totalProfit.toLocaleString()}`}
          icon="account_balance" 
          color="green" 
        />
      </div>
      
      {/* Sales charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
            <span className="material-icons mr-2 text-blue-500">bar_chart</span>
            Sales Person Sales Chart
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Chart will be implemented later */}
            <div className="text-center">
              <span className="material-icons text-5xl text-gray-300 mb-2">insert_chart</span>
              <p className="text-gray-500">Sales chart data will appear here</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 flex items-center">
            <span className="material-icons mr-2 text-blue-500">pie_chart</span>
            Sales Person Sales Chart
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            {/* Chart will be implemented later */}
            <div className="text-center">
              <span className="material-icons text-5xl text-gray-300 mb-2">donut_large</span>
              <p className="text-gray-500">Sales chart data will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
