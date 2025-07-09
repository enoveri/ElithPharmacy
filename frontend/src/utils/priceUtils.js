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

 