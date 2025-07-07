import { FastifyInstance } from 'fastify';
import { adminAuth } from '../middlewares/adminAuth';
import {
  externalApiAuth,
  externalApiGetRecommendedBet,
  externalApiPlaceBet,
  externalApiGetWin,
  externalApiGetBalance,
  externalApiSetBalance
} from '../externalApi/externalApiClient';
import { PrismaClient } from '@prisma/client';

// Экземпляр Prisma для работы с таблицей externalApiAccount и apiLog
const prisma = new PrismaClient();

/**
 * Регистрирует внутренние эндпоинты для интеграционного тестирования API ставок.
 * Все эндпоинты защищены middleware adminAuth (доступ по admin-токену).
 */
export default async function (app: FastifyInstance) {
  // POST /api/internal/auth — тест аутентификации во внешнем API
  app.post('/api/internal/auth', { preHandler: [adminAuth] }, async (req, reply) => {
    // user_id ожидается в теле запроса
    const { user_id } = req.body as { user_id: string };
    if (!user_id) {
      return reply.status(400).send({ error: 'user_id required' });
    }
    // Ищем внешний аккаунт по external_user_id
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      // Вызываем внешний API для аутентификации
      const external_response = await externalApiAuth({
        externalUserId: account.external_user_id,
        secretKey: account.external_secret_key,
      });
      return reply.send({ success: true, external_response });
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // GET /api/internal/bet — получить рекомендуемую ставку из внешнего API
  app.get('/api/internal/bet', { preHandler: [adminAuth] }, async (req, reply) => {
    const { user_id } = req.query as { user_id: string };
    if (!user_id) {
      return reply.status(400).send({ error: 'user_id required' });
    }
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      const external_response = await externalApiGetRecommendedBet({
        externalUserId: account.external_user_id,
        secretKey: account.external_secret_key,
      }, account.user_id);
      return reply.send({ success: true, external_response });
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // POST /api/internal/bet — разместить ставку во внешнем API
  app.post('/api/internal/bet', { preHandler: [adminAuth] }, async (req, reply) => {
    const { user_id, bet } = req.body as { user_id: string, bet: number };
    if (!user_id || typeof bet !== 'number') {
      return reply.status(400).send({ error: 'user_id and bet required' });
    }
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      const external_response = await externalApiPlaceBet({
        externalUserId: account.external_user_id,
        secretKey: account.external_secret_key,
      }, bet, account.user_id);
      return reply.send({ success: true, external_response });
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // POST /api/internal/win — получить результат по ставке (выигрыш/проигрыш)
  app.post('/api/internal/win', { preHandler: [adminAuth] }, async (req, reply) => {
    const { user_id, bet_id } = req.body as { user_id: string, bet_id: string };
    if (!user_id || !bet_id) {
      return reply.status(400).send({ error: 'user_id and bet_id required' });
    }
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      const external_response = await externalApiGetWin({
        externalUserId: account.external_user_id,
        secretKey: account.external_secret_key,
      }, bet_id, account.user_id);
      return reply.send({ success: true, external_response });
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // POST /api/internal/balance — получить или установить баланс пользователя во внешнем API
  app.post('/api/internal/balance', { preHandler: [adminAuth] }, async (req, reply) => {
    const { user_id, balance } = req.body as { user_id: string, balance?: number };
    if (!user_id) {
      return reply.status(400).send({ error: 'user_id required' });
    }
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      let external_response;
      if (typeof balance === 'number') {
        // Устанавливаем баланс
        external_response = await externalApiSetBalance({
          externalUserId: account.external_user_id,
          secretKey: account.external_secret_key,
        }, balance, account.user_id);
      } else {
        // Получаем баланс
        external_response = await externalApiGetBalance({
          externalUserId: account.external_user_id,
          secretKey: account.external_secret_key,
        }, account.user_id);
      }
      return reply.send({ success: true, external_response });
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // POST /api/internal/check-balance — проверить корректность баланса во внешнем API
  app.post('/api/internal/check-balance', { preHandler: [adminAuth] }, async (req, reply) => {
    const { user_id, expected_balance } = req.body as { user_id: string, expected_balance: number };
    if (!user_id || typeof expected_balance !== 'number') {
      return reply.status(400).send({ error: 'user_id and expected_balance required' });
    }
    const account = await prisma.externalApiAccount.findFirst({
      where: { external_user_id: user_id }
    });
    if (!account) {
      return reply.status(404).send({ error: 'External account not found' });
    }
    try {
      // Получаем фактический баланс через API
      const external_balance_resp = await externalApiGetBalance({
        externalUserId: account.external_user_id,
        secretKey: account.external_secret_key,
      }, account.user_id);
      const actual_balance = external_balance_resp.balance;
      if (actual_balance === expected_balance) {
        // Баланс совпадает — всё ок
        return reply.send({ success: true, external_response: { is_correct: true, balance: actual_balance } });
      } else {
        // Баланс не совпадает — возвращаем подробности
        return reply.send({
          success: true,
          external_response: {
            is_correct: false,
            message: `Incorrect balance. Expected: ${expected_balance}, Actual: ${actual_balance}`,
            correct_balance: actual_balance,
          }
        });
      }
    } catch (e: any) {
      return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
    }
  });

  // GET /api/internal/logs — получить последние 50 записей логов API
  app.get('/api/internal/logs', { preHandler: [adminAuth] }, async (req, reply) => {
    const logs = await prisma.apiLog.findMany({ orderBy: { created_at: 'desc' }, take: 50 });
    reply.send({ logs });
  });
}
