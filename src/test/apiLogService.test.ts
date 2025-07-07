jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    apiLog: {
      create: jest.fn().mockResolvedValue({ id: 1 })
    }
  }))
}));

import { logApiCall } from '../services/apiLogService';

describe('logApiCall', () => {
  it('should call prisma.apiLog.create with correct data', async () => {
    const params = {
      user_id: 123,
      endpoint: '/api/bet',
      method: 'POST',
      request_body: { bet: 3 },
      response_body: { status: 'ok' },
      status_code: 200,
      request_duration_ms: 120,
      ip_address: '127.0.0.1',
    };

    await logApiCall(params);

    // Проверяем, что apiLog.create был вызван с нужными данными
    const prisma = require('@prisma/client').PrismaClient.mock.results[0].value;
    expect(prisma.apiLog.create).toHaveBeenCalledWith({ data: params });
  });

  it('should not throw if prisma throws', async () => {
    const prisma = require('@prisma/client').PrismaClient.mock.results[0].value;
    prisma.apiLog.create.mockRejectedValueOnce(new Error('db error'));
    // Не должно выбрасывать исключение наружу
    await expect(logApiCall({ endpoint: '/api', method: 'GET' })).resolves.toBeUndefined();
  });
});
