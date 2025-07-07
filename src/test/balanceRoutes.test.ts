import registerBalanceRoutes from '../routes/balanceRoutes';

describe('balanceRoutes', () => {
  it('should register GET /api/balance route with preHandler', async () => {
    const app: any = { get: jest.fn() };
    await registerBalanceRoutes(app);

    expect(app.get).toHaveBeenCalled();
    const call = app.get.mock.calls[0];
    // Проверяем путь и структуру второго аргумента (middleware + handler)
    expect(call[0]).toBe('/api/balance');
    expect(call[1]).toEqual({ preHandler: [expect.any(Function)] });
    expect(typeof call[2]).toBe('function');
  });
});
