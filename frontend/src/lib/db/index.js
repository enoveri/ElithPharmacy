import { supabase } from "../supabase";

// Helper functions to work with database data
export const dbHelpers = {
  // Get product by ID
  getProductById: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    return data;
  },

  // Get products by category
  getProductsByCategory: async (categoryName) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', categoryName);
    
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    return data;
  },

  // Get low stock products
  getLowStockProducts: async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .lt('quantity', supabase.rpc('min_stock_level'));
    
    if (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
    
    return products;
  },

  // Get sales by customer
  getSalesByCustomer: async (customerId) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items(*)
      `)
      .eq('customer_id', parseInt(customerId));
    
    if (error) {
      console.error('Error fetching sales by customer:', error);
      return [];
    }
    
    return data;
  },

  // Get recent sales
  getRecentSales: async (limit = 10) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(first_name, last_name),
        sale_items(*, products(name))
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent sales:', error);
      return [];
    }
    
    return data;
  },

  // Get top customers by spending
  getTopCustomers: async (limit = 5) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching top customers:', error);
      return [];
    }
    
    return data;
  },

  // Search products
  searchProducts: async (query) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,manufacturer.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    return data;
  },

  // Search customers
  searchCustomers: async (query) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }
    
    return data;
  },

  // Generate unique transaction number
  generateTransactionNumber: async () => {
    // Get the last transaction number from the database
    const { data, error } = await supabase
      .from('sales')
      .select('transaction_number')
      .order('id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error generating transaction number:', error);
      return `TXN-2024-000001`;
    }
    
    if (data && data.length > 0) {
      const lastTxn = data[0];
      const lastNumber = parseInt(lastTxn.transaction_number.split('-').pop());
      return `TXN-2024-${(lastNumber + 1).toString().padStart(6, '0')}`;
    } else {
      return `TXN-2024-000001`;
    }
  },

  // Get total revenue
  getTotalRevenue: async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('total_amount');
    
    if (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
    
    return data.reduce((total, sale) => total + sale.total_amount, 0);
  },

  // Get products needing reorder
  getProductsToReorder: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('quantity', supabase.raw('min_stock_level * 1.5'));
    
    if (error) {
      console.error('Error fetching products to reorder:', error);
      return [];
    }
    
    return data;
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Get products expiring soon
  getExpiringProducts: async (daysThreshold = 30) => {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('expiry_date', thresholdDate.toISOString().split('T')[0])
      .gt('expiry_date', today.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Error fetching expiring products:', error);
      return [];
    }
    
    return data.map(product => ({
      ...product,
      daysUntilExpiry: Math.ceil((new Date(product.expiry_date) - today) / (1000 * 60 * 60 * 24))
    }));
  },

  // Get expired products
  getExpiredProducts: async () => {
    const today = new Date();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('expiry_date', today.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Error fetching expired products:', error);
      return [];
    }
    
    return data;
  },

  // Get system notifications
  getSystemNotifications: async () => {
    // This would typically come from a notifications table
    // For now, we'll return static data similar to the mock
    return [
      {
        id: "sys-1",
        type: "info",
        title: "System Backup Complete",
        message: "Daily system backup completed successfully",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
      },
      {
        id: "sys-2",
        type: "warning",
        title: "License Renewal",
        message: "Your software license expires in 30 days",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        read: true,
      },
    ];
  },

  // Get stock notifications
  getStockNotifications: async () => {
    const lowStockProducts = await dbHelpers.getLowStockProducts();
    
    return lowStockProducts.map(product => ({
      id: `stock-${product.id}`,
      type: product.quantity === 0 ? "critical" : "warning",
      title: product.quantity === 0 ? "Out of Stock" : "Low Stock Alert",
      message: `${product.name} ${
        product.quantity === 0 
          ? "is out of stock" 
          : `has only ${product.quantity} units remaining`
      }`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
    }));
  },

  // Get sales notifications
  getSalesNotifications: async () => {
    const recentSales = await dbHelpers.getRecentSales(5);
    
    return recentSales.map(sale => ({
      id: `sale-${sale.id}`,
      type: "success",
      title: "Sale Completed",
      message: `Transaction ${sale.transaction_number} - ₦${sale.total_amount.toFixed(2)}`,
      timestamp: new Date(sale.date),
      read: Math.random() > 0.3,
      saleId: sale.id,
    }));
  },

  // Get expiry notifications
  getExpiryNotifications: async () => {
    const expiringProducts = await dbHelpers.getExpiringProducts(30);
    const expiredProducts = await dbHelpers.getExpiredProducts();

    const expiringNotifications = expiringProducts.map(product => ({
      id: `expiry-${product.id}`,
      type: product.daysUntilExpiry <= 7 ? "critical" : "warning",
      title: product.daysUntilExpiry <= 7
        ? "Product Expiring Soon"
        : "Product Expiry Warning",
      message: `${product.name} expires in ${product.daysUntilExpiry} day${
        product.daysUntilExpiry === 1 ? "" : "s"
      }`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: false,
      productId: product.id,
      expiryDate: product.expiry_date,
      daysUntilExpiry: product.daysUntilExpiry,
    }));

    const expiredNotifications = expiredProducts.map(product => ({
      id: `expired-${product.id}`,
      type: "critical",
      title: "Product Expired",
      message: `${product.name} has expired on ${new Date(product.expiry_date).toLocaleDateString()}`,
      timestamp: new Date(product.expiry_date),
      read: false,
      productId: product.id,
      expiryDate: product.expiry_date,
    }));

    return [...expiringNotifications, ...expiredNotifications];
  },

  // Get all notifications
  getAllNotifications: async () => {
    const systemNotifications = await dbHelpers.getSystemNotifications();
    const stockNotifications = await dbHelpers.getStockNotifications();
    const salesNotifications = await dbHelpers.getSalesNotifications();
    const expiryNotifications = await dbHelpers.getExpiryNotifications();

    return [
      ...systemNotifications,
      ...stockNotifications,
      ...salesNotifications,
      ...expiryNotifications,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Get unread notification count
  getUnreadNotificationCount: async () => {
    const allNotifications = await dbHelpers.getAllNotifications();
    return allNotifications.filter(n => !n.read).length;
  },

  // Create a new product
  createProduct: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        category: product.category,
        price: product.price,
        cost_price: product.costPrice,
        quantity: product.quantity,
        min_stock_level: product.minStockLevel,
        status: product.status,
        manufacturer: product.manufacturer,
        expiry_date: product.expiryDate,
        batch_number: product.batchNumber,
        barcode: product.barcode,
        description: product.description,
        synced: false
      }])
      .select();
    
    if (error) {
      console.error('Error creating product:', error);
      return null;
    }
    
    return data[0];
  },

  // Update a product
  updateProduct: async (id, updates) => {
    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = updates.minStockLevel;
    if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
    if (updates.batchNumber !== undefined) dbUpdates.batch_number = updates.batchNumber;
    
    // Add remaining fields directly
    Object.keys(updates).forEach(key => {
      if (!['costPrice', 'minStockLevel', 'expiryDate', 'batchNumber'].includes(key)) {
        dbUpdates[key] = updates[key];
      }
    });
    
    // Mark as not synced
    dbUpdates.synced = false;
    
    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    
    return data[0];
  },

  // Delete a product
  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    
    return true;
  },

  // Create a new sale
  createSale: async (sale) => {
    // Start a transaction
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{
        transaction_number: sale.transactionNumber,
        customer_id: sale.customerId,
        date: sale.date,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod,
        status: sale.status,
        cashier_id: sale.cashierId,
        synced: false
      }])
      .select();
    
    if (saleError) {
      console.error('Error creating sale:', saleError);
      return null;
    }
    
    const newSaleId = saleData[0].id;
    
    // Insert sale items
    for (const item of sale.items) {
      const { error: itemError } = await supabase
        .from('sale_items')
        .insert([{
          sale_id: newSaleId,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          synced: false
        }]);
      
      if (itemError) {
        console.error('Error creating sale item:', itemError);
        // In a real app, you might want to roll back the transaction here
      }
      
      // Update product quantity
      await supabase
        .from('products')
        .update({ 
          quantity: supabase.raw(`quantity - ${item.quantity}`),
          synced: false
        })
        .eq('id', item.productId);
    }
    
    // Update customer data
    if (sale.customerId) {
      await supabase
        .from('customers')
        .update({
          total_purchases: supabase.raw('total_purchases + 1'),
          total_spent: supabase.raw(`total_spent + ${sale.totalAmount}`),
          last_purchase: sale.date,
          synced: false
        })
        .eq('id', sale.customerId);
    }
    
    return {
      ...saleData[0],
      items: sale.items
    };
  },

  // Get app settings
  getSettings: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
    
    // Convert snake_case to camelCase for frontend
    return {
      storeName: data.store_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      currency: data.currency,
      taxRate: data.tax_rate,
      lowStockThreshold: data.low_stock_threshold
    };
  },

  // Update app settings
  updateSettings: async (settings) => {
    const { data, error } = await supabase
      .from('settings')
      .update({
        store_name: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        tax_rate: settings.taxRate,
        low_stock_threshold: settings.lowStockThreshold,
        synced: false
      })
      .eq('id', 1)
      .select();
    
    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }
    
    return data[0];
  }
};

export default dbHelpers; 