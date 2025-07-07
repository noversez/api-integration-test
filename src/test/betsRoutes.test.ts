import registerBetsRoutes from '../routes/betsRoutes';

describe('betsRoutes', () => {
  it('should register all bets routes with preHandler', async () => {
    const app: any = { get: jest.fn(), post: jest.fn() };
    await registerBetsRoutes(app);

    // Проверка всех роутов GET
    expect(app.get).toHaveBeenCalledWith(
      '/api/bets',
      { preHandler: [expect.any(Function)] },
      expect.any(Function)
    );
    expect(app.get).toHaveBeenCalledWith(
      '/api/bets/:id',
      { preHandler: [expect.any(Function)] },
      expect.any(Function)
    );
    expect(app.get).toHaveBeenCalledWith(
      '/api/bets/recommended',
      { preHandler: [expect.any(Function)] },
      expect.any(Function)
    );

    // Проверка всех роутов POST
    expect(app.post).toHaveBeenCalledWith(
      '/api/bets',
      { preHandler: [expect.any(Function)] },
      expect.any(Function)
    );
    expect(app.post).toHaveBeenCalledWith(
      '/api/win',
      { preHandler: [expect.any(Function)] },
      expect.any(Function)
    );
  });
});
