import { buildApp } from '../app';

describe('buildApp', () => {
  it('should create Fastify instance with registered routes', async () => {
    const app = buildApp();

    // Проверяем, что приложение стартует и health роут отвечает
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('services');
  });
});
