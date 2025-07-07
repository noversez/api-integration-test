// Импортируем типы Fastify для типизации request/reply объектов
import { FastifyRequest, FastifyReply } from 'fastify';
// Импортируем клиент Prisma для работы с БД
import { PrismaClient } from '@prisma/client';
// Кастомный тип для user payload из JWT
import { JwtUserPayload } from '../types/fastify';
// DTO для ответа по балансу
import { BalanceResponseDto } from '../types/balance';

// Инициализируем Prisma клиент — обычно лучше делать это один раз на уровне приложения, а не в каждом файле
const prisma = new PrismaClient();

/**
 * Хендлер для получения баланса пользователя.
 * Ожидает аутентифицированного пользователя (request.user).
 * Возвращает объект с балансом и датой последнего обновления.
 * В случае отсутствия баланса — возвращает 404.
 */
export async function getBalanceHandler(request: FastifyRequest, reply: FastifyReply) {
  // Получаем payload пользователя из JWT (будет добавлен через pre-handler, например, fastify-auth)
  const user = request.user as JwtUserPayload;

  // Ищем баланс пользователя в базе
  const userBalance = await prisma.userBalance.findUnique({
    where: { user_id: user.id }
  });

  // Если баланса нет — возвращаем 404
  if (!userBalance) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Balance not found'
    });
  }

  // Формируем DTO для ответа (приводим balance к числу, last_updated — к ISO строке)
  const response: BalanceResponseDto = {
    balance: Number(userBalance.balance),
    last_updated: userBalance.last_checked_at
      ? userBalance.last_checked_at.toISOString()
      : null
  };

  // Отправляем ответ клиенту
  return reply.send(response);
}
