jest.mock('@prisma/client', () => {
  const { Decimal } = require('@prisma/client/runtime/library');
  const mTransaction = {
    count: jest.fn().mockResolvedValue(2),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        type: 'bet_win',
        amount: new Decimal(10),
        balance_before: new Decimal(100),
        balance_after: new Decimal(110),
        description: 'Win for bet #123',
        created_at: new Date('2024-07-01T12:00:00Z'),
      },
      {
        id: 2,
        type: 'bet_place',
        amount: new Decimal(-3),
        balance_before: new Decimal(110),
        balance_after: new Decimal(107),
        description: 'Placed bet #124',
        created_at: new Date('2024-07-01T11:00:00Z'),
      },
    ])
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      transaction: mTransaction,
    })),
  };
});

import { getTransactionsHandler } from '../controllers/transactionController';

describe('getTransactionsHandler', () => {
  it('should return paginated transactions list', async () => {
    const mockSend = jest.fn();
    const mockReply = { send: mockSend, status: jest.fn().mockReturnThis() } as any;
    const mockRequest: any = { 
      user: { id: 123 },
      query: { page: '1', limit: '10' }
    };

    await getTransactionsHandler(mockRequest, mockReply);

    expect(mockSend).toHaveBeenCalledWith({
      transactions: [
        {
          id: 1,
          type: 'bet_win',
          amount: 10,
          balance_before: 100,
          balance_after: 110,
          description: 'Win for bet #123',
          created_at: '2024-07-01T12:00:00.000Z',
        },
        {
          id: 2,
          type: 'bet_place',
          amount: -3,
          balance_before: 110,
          balance_after: 107,
          description: 'Placed bet #124',
          created_at: '2024-07-01T11:00:00.000Z',
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
  });
});
