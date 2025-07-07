jest.mock('@prisma/client', () => {
  const mBet = {
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        amount: new (require('@prisma/client/runtime/library').Decimal)(3),
        status: 'completed',
        win_amount: new (require('@prisma/client/runtime/library').Decimal)(6),
        created_at: new Date('2024-01-01T10:00:00Z'),
        completed_at: new Date('2024-01-01T10:01:00Z'),
        external_bet_id: 'bet-1',
      },
      {
        id: 2,
        amount: new (require('@prisma/client/runtime/library').Decimal)(2),
        status: 'pending',
        win_amount: null,
        created_at: new Date('2024-01-02T11:00:00Z'),
        completed_at: null,
        external_bet_id: 'bet-2',
      },
    ]),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      bet: mBet,
    })),
  };
});


import { getUserBetsHandler } from '../controllers/betsController';

describe('getUserBetsHandler', () => {
  it('should return list of user bets', async () => {
    const mockSend = jest.fn();
    const mockReply = { send: mockSend, status: jest.fn().mockReturnThis() } as any;
    const mockRequest: any = { user: { id: 123 } };

    await getUserBetsHandler(mockRequest, mockReply);

    expect(mockSend).toHaveBeenCalledWith({
      bets: [
        {
          id: 1,
          amount: 3,
          status: 'completed',
          win_amount: 6,
          created_at: '2024-01-01T10:00:00.000Z',
          completed_at: '2024-01-01T10:01:00.000Z',
          external_bet_id: 'bet-1',
        },
        {
          id: 2,
          amount: 2,
          status: 'pending',
          win_amount: null,
          created_at: '2024-01-02T11:00:00.000Z',
          completed_at: null,
          external_bet_id: 'bet-2',
        },
      ],
    });
  });
});
