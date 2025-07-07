import { authenticate } from '../middlewares/authMiddleware';

describe('authenticate', () => {
  it('should pass and cast user if jwtVerify succeeds', async () => {
    const mockUser = { id: 42, username: 'john' };
    const mockRequest: any = {
      user: mockUser,
      jwtVerify: jest.fn().mockResolvedValue(undefined),
    };
    const mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await authenticate(mockRequest, mockReply);

    // Проверяем что jwtVerify вызван
    expect(mockRequest.jwtVerify).toHaveBeenCalled();
    // Проверяем, что user остался
    expect(mockRequest.user).toEqual(mockUser);
    // Не должно быть вызова status/send (ошибки нет)
    expect(mockReply.status).not.toHaveBeenCalled();
  });

  it('should return 401 if jwtVerify throws', async () => {
    const mockRequest: any = {
      jwtVerify: jest.fn().mockRejectedValue(new Error('fail')),
    };
    const mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;

    await authenticate(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  });
});
