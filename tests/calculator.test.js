const { add, subtract, multiply, divide } = require('../src/calculator');

describe('calculator', () => {
  test('add() adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('subtract() subtracts the second number from the first', () => {
    expect(subtract(10, 4)).toBe(6);
    expect(subtract(3, 5)).toBe(-2);
  });

  test('multiply() multiplies two numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });

  test('divide() divides the first number by the second', () => {
    expect(divide(20, 4)).toBe(5);
    expect(divide(7, 2)).toBe(3.5);
  });

  test('divide() throws when dividing by zero', () => {
    expect(() => divide(5, 0)).toThrow('Cannot divide by zero');
  });
});
