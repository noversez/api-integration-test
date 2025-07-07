import { FastifyInstance } from 'fastify';
import { getTransactionsHandler } from '../controllers/transactionController';
import { authenticate } from '../middlewares/authMiddleware';

/**
 * Регистрирует защищённый маршрут GET /api/transactions.
 * preHandler: [authenticate] — требует JWT-токен (авторизация).
 * getTransactionsHandler — контроллер, который возвращает список транзакций с пагинацией.
 */
export default async function (app: FastifyInstance) {
  // Регистрируем маршрут для получения истории транзакций пользователя
  app.get('/api/transactions', { preHandler: [authenticate] }, getTransactionsHandler);
}
