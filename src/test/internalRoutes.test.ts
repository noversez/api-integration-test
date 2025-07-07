jest.mock('../middlewares/adminAuth', () => ({
  adminAuth: jest.fn((req: any, reply: any) => undefined),
}));
jest.mock('../externalApi/externalApiClient', () => ({
  externalApiAuth: jest.fn().mockResolvedValue({ message: 'ok' }),
}));

const mockFindFirst = jest.fn().mockResolvedValue({
  external_user_id: 'test_uid',
  external_secret_key: 'test_secret',
  user_id: 999,
});
const mockSend = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    externalApiAccount: { findFirst: mockFindFirst },
    apiLog: { findMany: jest.fn() },
  })),
}));

import registerInternalRoutes from '../routes/internalRoutes';

describe('internalRoutes', () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockSend.mockClear();
  });

  it('should handle POST /api/internal/auth', async () => {
    const app: any = { post: jest.fn(), get: jest.fn() };
    await registerInternalRoutes(app);

    // Вызываем зарегистрированный handler вручную
    const handler = app.post.mock.calls[0][2];
    const req: any = { body: { user_id: 'test_uid' } };
    const reply: any = { send: mockSend, status: jest.fn().mockReturnThis() };

    await handler(req, reply);

    expect(mockFindFirst).toHaveBeenCalledWith({ where: { external_user_id: 'test_uid' } });
    expect(mockSend).toHaveBeenCalledWith({ success: true, external_response: { message: 'ok' } });
  });
});
