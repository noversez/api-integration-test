import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { JwtUserPayload } from '../types/fastify';
import { TransactionsListResponse, TransactionDto } from '../types/transaction';
import { Decimal } from '@prisma/client/runtime/library';

// Создаём экземпляр Prisma для работы с транзакциями пользователя
const prisma = new PrismaClient();

/**
 * Обработчик получения истории транзакций пользователя с пагинацией.
 * - Поддерживает query-параметры: page, limit (строки, парсятся в числа)
 * - Отдаёт массив транзакций и пагинацию.
 */
export async function getTransactionsHandler(request: FastifyRequest, reply: FastifyReply) {
  // Получаем пользователя из JWT
  const user = request.user as JwtUserPayload;

  // Параметры пагинации: по умолчанию page=1, limit=10
  const { page = '1', limit = '10' } = request.query as { page?: string; limit?: string };
  // Преобразуем в числа и нормализуем (>=1)
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);

  // Считаем общее количество и выбираем страницу транзакций параллельно
  const [total, items] = await Promise.all([
    prisma.transaction.count({ where: { user_id: user.id } }),
    prisma.transaction.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        type: true,
        amount: true,
        balance_before: true,
        balance_after: true,
        description: true,
        created_at: true,
      },
    })
  ]);

  // Приводим транзакции к DTO: все Decimal значения переводим в number, даты — в строку
  const transactions: TransactionDto[] = items.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: (tx.amount as Decimal).toNumber(),
    balance_before: (tx.balance_before as Decimal).toNumber(),
    balance_after: (tx.balance_after as Decimal).toNumber(),
    description: tx.description,
    created_at: tx.created_at.toISOString(),
  }));

  // Вычисляем общее количество страниц
  const pages = Math.ceil(total / limitNum);

  // Формируем итоговый ответ по контракту API
  const response: TransactionsListResponse = {
    transactions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages,
    }
  };

  // Отправляем ответ клиенту
  return reply.send(response);
}
