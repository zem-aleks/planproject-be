import { convertPriceToDecimal } from './convertPriceToDecimal';

describe('convertPriceToDecimal', () => {
  it('converts prices into decimal numbers', async () => {
    const prices = [
      '$21,210.00',
      '€50,000.00',
      '60,001€',
      '$121,444.00',
      '121.444,00 USD',
      '50.000 Euro',
      '10.777,00€',
      '$60.001,00',
      '122 000€',
      '$122 000',
    ];

    console.log(prices);
    expect(prices.map(convertPriceToDecimal)).toEqual([
      21210, 50000, 60001, 121444, 121444, 50000, 10777, 60001, 122000, 122000,
    ]);
  });
});
