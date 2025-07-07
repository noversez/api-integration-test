import registerTransactionsRoutes from '../routes/transactionRoutes';

describe('transactionsRoutes', () => {
  it('should register GET /api/transactions route with preHandler', async () => {
    const app: any = { get: jest.fn() };
    await registerTransactionsRoutes(app);

    expect(app.get).toHaveBeenCalled();
    const call = app.get.mock.calls[0];
    expect(call[0]).toBe('/api/transactions');
    expect(call[1]).toEqual({ preHandler: [expect.any(Function)] });
    expect(typeof call[2]).toBe('function');
  });
});
