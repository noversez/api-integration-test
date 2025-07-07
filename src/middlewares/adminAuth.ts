import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware для проверки админского токена.
 * Ожидает заголовок Authorization: Bearer <ADMIN_TOKEN>.
 * Если токен не совпадает с process.env.ADMIN_TOKEN — возвращает 401 Unauthorized.
 * В случае успеха просто завершает выполнение (пропускает к следующему обработчику).
 */
export async function adminAuth(request: FastifyRequest, reply: FastifyReply) {
  // Берём секретный токен из переменных окружения
  const adminToken = process.env.ADMIN_TOKEN;
  // Извлекаем Authorization header
  const header = request.headers['authorization'];
  // Проверяем, что заголовок есть и совпадает с ожидаемым Bearer-токеном
  if (!header || header !== `Bearer ${adminToken}`) {
    // Если не совпадает — отправляем 401 и прекращаем выполнение
    return reply.status(401).send({ error: 'Unauthorized (admin)' });
  }
  // Если всё хорошо — функция завершается, Fastify продолжает обработку запроса
}
