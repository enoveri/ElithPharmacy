/**
 * Product price utilities
 * Detects and fixes tax-contaminated product pricing
 */

/**
 * Check if a price value appears to have tax included (18% Uganda VAT)
 * @param {number} price - Price to check
 * @returns {boolean} - True if price likely includes 18% tax
 */
export const hasTaxContamination = (price) => {
  if (!price || price % 1 === 0) return false; // No decimals = likely clean
  
  // Check if removing 18% tax results in a round number
  const priceWithoutTax = price / 1.18;
  const roundedPriceWithoutTax = Math.round(priceWithoutTax);
  
  // If removing 18% gives us a round number, likely tax contaminated
  return Math.abs(priceWithoutTax - roundedPriceWithoutTax) < 0.01;
};

/**
 * Remove 18% tax from a price if it appears to be tax-contaminated
 * @param {number} price - Price to clean
 * @returns {number} - Clean price without tax
 */
export const removeTaxContamination = (price) => {
  if (!price || !hasTaxContamination(price)) return price;
  
  return Math.round(price / 1.18);
};

/**
 * Analyze products for tax contamination
 * @param {Array} products - Array of product objects
 * @returns {Object} - Analysis results
 */
export const analyzeProductTaxContamination = (products) => {
  const contaminated = [];
  const clean = [];
  
  products.forEach(product => {
    const costPrice = product.costPrice || product.cost_price || 0;
    const sellingPrice = product.price || 0;
    
    const costContaminated = hasTaxContamination(costPrice);
    const priceContaminated = hasTaxContamination(sellingPrice);
    
    if (costContaminated || priceContaminated) {
      contaminated.push({
        id: product.id,
        name: product.name,
        originalCostPrice: costPrice,
        originalSellingPrice: sellingPrice,
        cleanCostPrice: removeTaxContamination(costPrice),
        cleanSellingPrice: removeTaxContamination(sellingPrice),
        costContaminated,
        priceContaminated
      });
    } else {
      clean.push(product.id);
    }
  });
  
  return {
    totalProducts: products.length,
    cleanProducts: clean.length,
    contaminatedProducts: contaminated.length,
    contaminated,
    summary: {
      needsCostPriceCleanup: contaminated.filter(p => p.costContaminated).length,
      needsSellingPriceCleanup: contaminated.filter(p => p.priceContaminated).length
    }
  };
};

/**
 * Generate SQL commands to fix tax-contaminated products
 * @param {Array} contaminatedProducts - Products needing cleanup
 * @returns {string} - SQL UPDATE statements
 */
export const generateTaxCleanupSQL = (contaminatedProducts) => {
  const sqlCommands = contaminatedProducts.map(product => {
    const updates = [];
    
    if (product.costContaminated) {
      updates.push(`cost_price = ${product.cleanCostPrice}`);
    }
    
    if (product.priceContaminated) {
      updates.push(`price = ${product.cleanSellingPrice}`);
    }
    
    if (updates.length > 0) {
      return `UPDATE products SET ${updates.join(', ')} WHERE id = ${product.id}; -- ${product.name}`;
    }
    return null;
  }).filter(Boolean);
  
  return sqlCommands.join('\n');
}; 