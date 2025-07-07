import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/fastify';
import { Decimal } from '@prisma/client/runtime/library';
import { createBetService } from '../services/betsService';
import { JwtUserPayload } from '../types/fastify';
import { BetsListResponse, BetDetailResponseDto, BetResponseDto, CreateBetRequestDto } from '../types/bet';
import { externalApiGetRecommendedBet, externalApiGetWin } from '../externalApi/externalApiClient';

// Создаём инстанс клиента Prisma для работы с базой данных.
// В production обычно используют DI/singleton, но для простоты — здесь локально.
const prisma = new PrismaClient();

/**
 * Обработчик получения истории ставок пользователя.
 * Возвращает массив ставок, отсортированных по дате (последние — первыми).
 * Преобразует все значения Decimal в number, даты в ISO, null если поля отсутствуют.
 */
export async function getUserBetsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Извлекаем пользователя из JWT, полученного через middleware авторизации.
  const user = request.user as JwtUserPayload;

  // Без user.id — нет доступа, возвращаем 401 (Unauthorized)
  if (!user?.id) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token required',
    });
  }

  // Запрашиваем все ставки пользователя, сортируем по дате создания (от новых к старым).
  const bets = await prisma.bet.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      amount: true,
      status: true,
      win_amount: true,
      created_at: true,
      completed_at: true,
      external_bet_id: true,
    },
  });

  // Формируем ответ с приведением типов к DTO (numbers, ISO строки)
  const response: BetsListResponse = {
    bets: bets.map((bet) => ({
      ...bet,
      // Приводим Decimal к number, если это Decimal (иначе к числу).
      amount: typeof bet.amount === 'object' && bet.amount instanceof Decimal
        ? bet.amount.toNumber()
        : Number(bet.amount),
      // Если win_amount есть — приводим, иначе null.
      win_amount: bet.win_amount
        ? (typeof bet.win_amount === 'object' && bet.win_amount instanceof Decimal
            ? bet.win_amount.toNumber()
            : Number(bet.win_amount))
        : null,
      // created_at всегда приводим к ISO строке.
      created_at: bet.created_at.toISOString(),
      // completed_at может быть null, если ставка не завершена.
      completed_at: bet.completed_at ? bet.completed_at.toISOString() : null,
    })),
  };

  // Отправляем результат клиенту.
  return reply.send(response);
}

/**
 * Получить детали конкретной ставки по её ID.
 * Проверяет права доступа (ставка принадлежит пользователю), возвращает 404 если не найдена.
 */
export async function getBetByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtUserPayload;
  const { id } = request.params as { id: string };

  // Преобразуем id из строки в число и валидируем.
  const betId = Number(id);
  if (isNaN(betId) || betId <= 0) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Bet id must be a positive number'
    });
  }

  // Ищем ставку пользователя по id.
  const bet = await prisma.bet.findFirst({
    where: { id: betId, user_id: user.id },
    select: {
      id: true,
      amount: true,
      status: true,
      win_amount: true,
      created_at: true,
      completed_at: true
    }
  });

  // Если ставка не найдена — возвращаем 404.
  if (!bet) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Bet not found'
    });
  }

  // Формируем DTO для детальной информации по ставке.
  const response: BetDetailResponseDto = {
    id: bet.id,
    amount: (bet.amount as Decimal).toNumber(),
    status: bet.status,
    win_amount: bet.win_amount !== null && bet.win_amount !== undefined
      ? (bet.win_amount as Decimal).toNumber()
      : null,
    created_at: bet.created_at.toISOString(),
    completed_at: bet.completed_at ? bet.completed_at.toISOString() : null
  };

  return reply.send(response);
}

/**
 * Создание новой ставки пользователем.
 * Выполняет валидацию суммы ставки, вызывает сервис размещения ставки (createBetService),
 * обрабатывает ошибки бизнес-логики и внешних API (через try/catch).
 */
export async function createBetHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtUserPayload;
  const { amount } = request.body as CreateBetRequestDto;

  // Валидация суммы ставки: только числа в диапазоне 1-5 (включительно)
  if (typeof amount !== 'number' || amount < 1 || amount > 5) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid bet amount. Must be between 1 and 5.',
    });
  }

  try {
    // Логика создания ставки вынесена в сервис.
    const result = await createBetService(user.id, amount);
    // Возвращаем статус 201 (Created) и DTO.
    return reply.status(201).send(result);
  } catch (error: any) {
    // Обработка ошибок от сервиса и сторонних API.
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.error || 'Internal Server Error',
      message: error.message || 'Unknown error',
    });
  }
}

/**
 * Получить рекомендуемую сумму ставки для пользователя через внешний API.
 * Требует привязки внешнего аккаунта (externalApiAccount).
 */
export async function getRecommendedBetHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtUserPayload;

  // Получаем внешний аккаунт пользователя, без него — ошибка.
  const account = await prisma.externalApiAccount.findFirst({
    where: { user_id: user.id, is_active: true }
  });
  if (!account) {
    return reply.status(400).send({ error: 'No external account' });
  }

  try {
    // Получаем рекомендуемую ставку через внешний API.
    const response = await externalApiGetRecommendedBet({
      externalUserId: account.external_user_id,
      secretKey: account.external_secret_key,
    }, user.id);
    // Ответ формата { recommended_amount: 3 }
    return reply.send({ recommended_amount: response.bet });
  } catch (e: any) {
    // Если внешний API не доступен или вернул ошибку — отдаём 502.
    return reply.status(502).send({ error: 'External API error', detail: e.message || e });
  }
}

/**
 * Получить и обработать результат ставки (выигрыш/проигрыш).
 * Включает обновление статуса ставки, пересчёт баланса, создание транзакции и возврат результата пользователю.
 */
export async function getWinHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtUserPayload;
  const { bet_id } = request.body as { bet_id: string };

  // Проверяем, что передан идентификатор ставки.
  if (!bet_id) {
    return reply.status(400).send({ error: 'Bet ID is required' });
  }

  // Ищем внешний аккаунт пользователя.
  const account = await prisma.externalApiAccount.findFirst({
    where: { user_id: user.id, is_active: true }
  });
  if (!account) {
    return reply.status(400).send({ error: 'No external account' });
  }

  // Ищем саму ставку по внешнему идентификатору и user_id.
  const bet = await prisma.bet.findFirst({
    where: { external_bet_id: bet_id, user_id: user.id }
  });
  if (!bet) {
    return reply.status(404).send({ error: 'Bet not found' });
  }

  try {
    // Получаем результат из внешнего API (выигрыш или проигрыш).
    const result = await externalApiGetWin({
      externalUserId: account.external_user_id,
      secretKey: account.external_secret_key,
    }, bet_id, user.id);

    const isWin = result.win > 0;

    // Обновляем статус и win_amount ставки в БД.
    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        win_amount: result.win,
        status: isWin ? 'completed' : 'lost',
        completed_at: new Date(),
      }
    });

    // Получаем текущий баланс пользователя.
    const userBalance = await prisma.userBalance.findUnique({
      where: { user_id: user.id }
    });

    // Если баланса нет — по умолчанию 0.
    const balanceBefore = userBalance ? Number(userBalance.balance) : 0;
    let balanceAfter: number;

    // Если выиграл — прибавляем win к балансу, иначе — вычитаем сумму ставки.
    if (isWin) {
      balanceAfter = balanceBefore + result.win;
    } else {
      balanceAfter = balanceBefore - Number(bet.amount);
    }

    // Обновляем баланс пользователя.
    await prisma.userBalance.update({
      where: { user_id: user.id },
      data: {
        balance: balanceAfter,
        external_balance: balanceAfter,
        last_checked_at: new Date()
      }
    });

    // Создаём запись в истории транзакций.
    await prisma.transaction.create({
      data: {
        user_id: user.id,
        bet_id: bet.id,
        type: isWin ? 'bet_win' : 'bet_lose',
        amount: isWin ? result.win : -Number(bet.amount),
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        created_at: new Date(),
        description: result.message
      }
    });

    // Возвращаем пользователю результат.
    return reply.send({
      win: result.win,
      message: result.message
    });

  } catch (e: any) {
    // Любая ошибка при общении с внешним API — отдаём 502.
    return reply.status(502).send({ error: 'External API error', detail: e?.response?.data || e?.message || e });
  }
}
