const mockFindFirst = jest.fn();
const mockBetCreate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    externalApiAccount: { findFirst: mockFindFirst },
    bet: { create: mockBetCreate },
  })),
}));

jest.mock('../externalApi/externalApiClient', () => ({
  externalApiAuth: jest.fn(),
  externalApiPlaceBet: jest.fn(),
}));

import { createBetService } from '../services/betsService';
import { externalApiAuth, externalApiPlaceBet } from '../externalApi/externalApiClient';

describe('createBetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue({
      external_user_id: 'ext_uid',
      external_secret_key: 'secret',
      user_id: 42,
    } as any);
    (externalApiAuth as jest.Mock).mockResolvedValue({});
    (externalApiPlaceBet as jest.Mock).mockResolvedValue({ bet_id: 'bet-100' });
    mockBetCreate.mockResolvedValue({
      id: 1,
      amount: 3,
      status: 'pending',
      created_at: new Date('2024-07-07T12:00:00Z'),
    } as any);
  });

  it('should create bet and return DTO', async () => {
    const result = await createBetService(42, 3);

    expect(mockFindFirst).toHaveBeenCalledWith({ where: { user_id: 42, is_active: true } });
    expect(externalApiAuth).toHaveBeenCalledWith({
      externalUserId: 'ext_uid',
      secretKey: 'secret',
    });
    expect(externalApiPlaceBet).toHaveBeenCalledWith(
      { externalUserId: 'ext_uid', secretKey: 'secret' },
      3,
      42
    );
    expect(mockBetCreate).toHaveBeenCalledWith({
      data: {
        user_id: 42,
        external_bet_id: 'bet-100',
        amount: 3,
        status: 'pending',
      }
    });
    expect(result).toEqual({
      id: 1,
      amount: 3,
      status: 'pending',
      created_at: '2024-07-07T12:00:00.000Z',
    });
  });
});
