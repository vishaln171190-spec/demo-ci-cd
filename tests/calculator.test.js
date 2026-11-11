const { add, multiply } = require('../src/calculator');

describe('calculator', () => {
  test('add() adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('multiply() multiplies two numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });
});
