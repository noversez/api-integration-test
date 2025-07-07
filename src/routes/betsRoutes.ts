import { FastifyInstance } from 'fastify';
import {
  getUserBetsHandler,
  getBetByIdHandler,
  createBetHandler,
  getRecommendedBetHandler,
  getWinHandler,
} from '../controllers/betsController';
import { authenticate } from '../middlewares/authMiddleware';

/**
 * Регистрирует все основные маршруты работы со ставками пользователя:
 * - GET    /api/bets            — история ставок пользователя
 * - GET    /api/bets/:id        — детали конкретной ставки
 * - POST   /api/bets            — размещение новой ставки
 * - GET    /api/bets/recommended— рекомендуемая ставка (AI)
 * - POST   /api/win             — получить/записать результат по ставке
 * 
 */
export default async function (app: FastifyInstance) {
  // История ставок
  app.get('/api/bets', { preHandler: [authenticate] }, getUserBetsHandler);
  // Детали конкретной ставки
  app.get('/api/bets/:id', { preHandler: [authenticate] }, getBetByIdHandler);
  // Создать ставку
  app.post('/api/bets', { preHandler: [authenticate] }, createBetHandler);
  // Получить рекомендуемую ставку (например, с AI)
  app.get('/api/bets/recommended', { preHandler: [authenticate] }, getRecommendedBetHandler);
  // Получить/записать результат по ставке (выигрыш/проигрыш)
  app.post('/api/win', { preHandler: [authenticate] }, getWinHandler);
}
