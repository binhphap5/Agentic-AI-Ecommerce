/**
 * Format price to Vietnamese currency format
 * @param {number} price - Price in VND
 * @returns {string} - Formatted price string
 */
export function formatPrice(price) {
    if (price === null || price === undefined || isNaN(price)) {
        return "0₫";
    }
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Calculate discounted price
 * @param {number} originalPrice - Original price
 * @param {number} discountPercent - Discount percentage
 * @returns {number} - Discounted price
 */
export function calculateDiscountedPrice(originalPrice, discountPercent) {
    if (!originalPrice || !discountPercent) return originalPrice;
    return originalPrice - (originalPrice * discountPercent / 100);
}

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} - Discount percentage
 */
export function calculateDiscountPercentage(originalPrice, discountedPrice) {
    if (!originalPrice || !discountedPrice) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Parse price from string
 * @param {string} priceString - Price string
 * @returns {number} - Parsed price
 */
export function parsePrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;
    
    // Remove currency symbols and spaces, then parse
    const cleanPrice = priceString.replace(/[₫,\s]/g, '');
    return parseInt(cleanPrice) || 0;
}

/**
 * Format price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {string} - Formatted price range
 */
export function formatPriceRange(minPrice, maxPrice) {
    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}