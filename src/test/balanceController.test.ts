jest.mock('@prisma/client', () => {
  const mUserBalance = {
    findUnique: jest.fn().mockResolvedValue({
      balance: 1234,
      last_checked_at: new Date('2023-07-07T12:34:56Z'),
    }),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      userBalance: mUserBalance,
    })),
  };
});

import { getBalanceHandler } from '../controllers/balanceController';

describe('getBalanceHandler', () => {
  it('should return user balance', async () => {
    const mockSend = jest.fn();
    const mockReply = { send: mockSend, status: jest.fn().mockReturnThis() } as any;
    const mockRequest: any = { user: { id: 42 } };

    await getBalanceHandler(mockRequest, mockReply);

    expect(mockSend).toHaveBeenCalledWith({
      balance: 1234,
      last_updated: '2023-07-07T12:34:56.000Z',
    });
  });
});