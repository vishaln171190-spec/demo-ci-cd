const request = require('supertest');
const app = require('../src/app');

describe('API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/add returns the sum', async () => {
    const res = await request(app).get('/api/add?a=2&b=3');
    expect(res.status).toBe(200);
    expect(res.body.result).toBe(5);
  });

  test('GET /api/multiply returns the product', async () => {
    const res = await request(app).get('/api/multiply?a=4&b=5');
    expect(res.status).toBe(200);
    expect(res.body.result).toBe(20);
  });

  test('GET /api/add rejects non-numbers', async () => {
    const res = await request(app).get('/api/add?a=x&b=3');
    expect(res.status).toBe(400);
  });
});
