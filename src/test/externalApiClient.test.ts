jest.mock('axios');
jest.mock('../services/apiLogService', () => ({
  logApiCall: jest.fn(),
}));

import axios from 'axios';
import { externalApiAuth } from '../externalApi/externalApiClient';

describe('externalApiAuth', () => {
  it('should send auth request and return response data', async () => {
    // Arrange
    (axios as any).mockResolvedValueOnce({
      status: 200,
      data: { message: 'Authenticated!' }
    });
    const credentials = { externalUserId: 'ext-1', secretKey: 'abc' };

    // Act
    const result = await externalApiAuth(credentials, 42);

    // Assert
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/auth'),
        method: 'POST',
        headers: expect.objectContaining({
          'user-id': credentials.externalUserId,
        }),
      })
    );
    expect(result).toEqual({ message: 'Authenticated!' });
  });
});
