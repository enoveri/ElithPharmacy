/**
 * Revenue calculation utilities
 * Ensures consistent revenue calculations without tax across the application
 */

/**
 * Calculate revenue from a sale record, prioritizing subtotal over totalAmount
 * @param {Object} sale - Sale record
 * @returns {number} - Revenue amount without tax
 */
export const getSaleRevenue = (sale) => {
  if (!sale) return 0;
  
  // Priority: subtotal (without tax) > totalAmount (may include tax) > total (legacy)
  return sale.subtotal || sale.totalAmount || sale.total_amount || sale.total || 0;
};

/**
 * Calculate total revenue from an array of sales
 * @param {Array} sales - Array of sale records
 * @param {string} statusFilter - Filter by status (optional)
 * @returns {number} - Total revenue without tax
 */
export const calculateTotalRevenue = (sales, statusFilter = null) => {
  if (!Array.isArray(sales)) return 0;
  
  return sales.reduce((sum, sale) => {
    // Filter by status if provided
    if (statusFilter && sale.status !== statusFilter) return sum;
    
    return sum + getSaleRevenue(sale);
  }, 0);
};

/**
 * Calculate revenue statistics for a given sales array
 * @param {Array} sales - Array of sale records
 * @returns {Object} - Revenue statistics
 */
export const calculateRevenueStats = (sales) => {
  if (!Array.isArray(sales)) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0
    };
  }
  
  const completedSales = sales.filter(sale => sale.status === 'completed' || !sale.status);
  const totalRevenue = calculateTotalRevenue(completedSales);
  const totalTransactions = completedSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  return {
    totalRevenue,
    totalTransactions,
    averageOrderValue
  };
};

/**
 * Calculate today's revenue from sales array
 * @param {Array} sales - Array of sale records
 * @returns {number} - Today's revenue without tax
 */
export const calculateTodaysRevenue = (sales) => {
  if (!Array.isArray(sales)) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  
  const todaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.date || sale.saleDate || sale.sale_date);
    return saleDate.toISOString().split('T')[0] === today;
  });
  
  return calculateTotalRevenue(todaysSales, 'completed');
}; 