import { adminAuth } from '../middlewares/adminAuth';

describe('adminAuth', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ADMIN_TOKEN: 'test_secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should allow request with correct Bearer token', async () => {
    const mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const mockRequest: any = { headers: { authorization: 'Bearer test_secret' } };
    const result = await adminAuth(mockRequest, mockReply);
    // Должен пропускать дальше, не возвращать ошибку
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should reject if no token or wrong token', async () => {
    const mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
    const reqNoToken: any = { headers: {} };
    const reqWrongToken: any = { headers: { authorization: 'Bearer wrong' } };

    await adminAuth(reqNoToken, mockReply);
    await adminAuth(reqWrongToken, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized (admin)' });
  });
});
