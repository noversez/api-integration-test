import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma ORM instance для работы с БД пользователей.
 * В реальных проектах рекомендуется использовать singleton или DI,
 * чтобы не создавать новый клиент на каждый импорт (для тестового допустимо).
 */
const prisma = new PrismaClient();

/**
 * Fastify handler для логина пользователя через username.
 * Поиск пользователя по username, генерация JWT-токена (без пароля — только демо!).
 * @param request FastifyRequest (ожидает body { username })
 * @param reply FastifyReply
 */
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  // Валидация входных данных — username обязателен
  const { username } = request.body as { username: string };

  if (!username) {
    // Возврат 400 Bad Request, если не передан username
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Username is required',
    });
  }

  // Поиск пользователя в базе по username
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    // Возврат 404 Not Found, если пользователя нет
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found',
    });
  }

  // Генерация JWT-токена через Fastify JWT (на 83600 секунд = ~23 часа)
  // В реальной системе обычно ещё добавляют refresh-токены, 2FA и т.п.
  const token = await reply.jwtSign(
    { id: user.id, username: user.username },
    { expiresIn: 83600 }
  );

  // Возврат токена и времени жизни
  return reply.send({
    token,
    expiresIn: 83600,
  });
}
