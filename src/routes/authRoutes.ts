import { FastifyInstance } from 'fastify';
import { loginHandler } from '../controllers/authController';

/**
 * Регистрирует маршрут POST /api/auth/login для авторизации пользователя.
 * 
 * Использует loginHandler — контроллер, отвечающий за вход (выдачу JWT токена).
 */
export default async function (app: FastifyInstance) {
  // Регистрируем эндпоинт авторизации
  app.post('/api/auth/login', loginHandler);
}
