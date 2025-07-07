import { FastifyInstance } from 'fastify';
import { getBalanceHandler } from '../controllers/balanceController';
import { authenticate } from '../middlewares/authMiddleware';

/**
 * Регистрирует GET /api/balance.
 * preHandler: [authenticate] — защищает эндпоинт, требуется валидный JWT.
 * getBalanceHandler — контроллер, который возвращает текущий баланс пользователя.
 */
export default async function (app: FastifyInstance) {
  // Регистрируем защищённый маршрут для получения баланса пользователя
  app.get('/api/balance', { preHandler: [authenticate] }, getBalanceHandler);
}
