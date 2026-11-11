// Shared logic: used by the Jest tests (Node) and by the web page (browser).
(function (root) {
  function add(a, b) {
    return a + b;
  }

  function multiply(a, b) {
    return a * b;
  }

  const Calculator = { add, multiply };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
  } else {
    root.Calculator = Calculator;
  }
})(typeof window !== 'undefined' ? window : globalThis);
