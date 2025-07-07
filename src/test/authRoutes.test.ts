import registerAuthRoutes from '../routes/authRoutes';

describe('authRoutes', () => {
  it('should register POST /api/auth/login route', async () => {
    const app: any = { post: jest.fn() };
    await registerAuthRoutes(app);

    expect(app.post).toHaveBeenCalled();
    const call = app.post.mock.calls[0];
    expect(call[0]).toBe('/api/auth/login');
    expect(typeof call[1]).toBe('function');
  });
});
