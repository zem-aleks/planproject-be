export const convertPriceToDecimal = (price: string): number | null => {
  // Step 1: Remove currency symbols and whitespace
  price = price.replace(/[^\d.,]/g, '').trim();

  // Step 2: Handle different formats based on the presence of both commas and periods
  if (price.includes(',') && price.includes('.')) {
    // Handle prices like "1.234.567,89" -> remove periods (thousands) and replace commas (decimals)
    if (price.lastIndexOf(',') > price.lastIndexOf('.')) {
      price = price.replace(/\./g, '').replace(',', '.');
    } else {
      price = price.replace(/,/g, '');
    }
  } else if (price.includes(',')) {
    // If the price only has commas (likely European format), treat commas as decimal points
    if (price.split(',').length === 2 && price.split(',')[1].length === 2) {
      price = price.replace(',', '.');
    } else {
      price = price.replace(/,/g, '');
    }
  } else {
    // Remove any remaining periods if they're thousands separators (e.g., "60.001")
    price = price.replace(/\./g, '');
  }

  // Step 3: Convert to number
  const parsedPrice = parseFloat(price);

  // If the conversion to number fails, return null
  return isNaN(parsedPrice) ? null : parsedPrice;
};
