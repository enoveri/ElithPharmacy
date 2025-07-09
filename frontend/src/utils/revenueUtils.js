/**
 * Revenue calculation utilities
 * Ensures completely tax-free revenue calculations across the application
 * CLIENT REQUIREMENT: No tax should appear anywhere in the frontend
 */

/**
 * Calculate revenue from a sale record, using only subtotal (completely ignoring tax)
 * @param {Object} sale - Sale record
 * @returns {number} - Revenue amount without any tax component
 */
export const getSaleRevenue = (sale) => {
  if (!sale) return 0;
  
  // ALWAYS use subtotal only - completely ignore tax component
  // Priority: subtotal > fallback to totalAmount only if subtotal unavailable
  return sale.subtotal || sale.total_amount || sale.totalAmount || sale.total || 0;
};

/**
 * Get the display amount for a sale (what customer sees/pays)
 * CLIENT REQUIREMENT: Show subtotal only, never include tax
 * @param {Object} sale - Sale record  
 * @returns {number} - Amount to display (subtotal only)
 */
export const getSaleDisplayAmount = (sale) => {
  if (!sale) return 0;
  
  // ALWAYS show subtotal only - completely tax-free display
  return sale.subtotal || 0;
};

/**
 * Calculate total revenue from an array of sales (tax-free)
 * @param {Array} sales - Array of sale records
 * @param {string} statusFilter - Filter by status (optional)
 * @returns {number} - Total revenue without any tax
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
 * Calculate revenue statistics for a given sales array (completely tax-free)
 * @param {Array} sales - Array of sale records
 * @returns {Object} - Revenue statistics (all tax-free)
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
 * Calculate today's revenue from sales array (tax-free)
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