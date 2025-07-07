// 1. Объявляем переменную заранее (undefined — ок)
let prismaMock: any = undefined;

// 2. Мокаем @prisma/client (до импорта loginHandler)
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

import { loginHandler } from '../controllers/authController';

// 3. Мокаем reply
const makeReply = () => {
  const data: any = {};
  return {
    status: jest.fn(function (code) { data.status = code; return this; }),
    send: jest.fn(function (payload) { data.payload = payload; return this; }),
    jwtSign: jest.fn(async function (payload, opts) {
      return `jwt-token-${payload.id}`;
    }),
    _data: data,
  };
};

describe('loginHandler', () => {
  beforeEach(() => {
    // Здесь всегда новый мок для каждого теста
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };
    jest.clearAllMocks();
  });

  it('возвращает 400 если не передан username', async () => {
    const req: any = { body: {} };
    const reply = makeReply();
    await loginHandler(req, reply as any);
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Bad Request' })
    );
  });
});
