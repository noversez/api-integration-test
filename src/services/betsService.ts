import { PrismaClient } from '@prisma/client';
import { CreateBetResponseDto } from '../types/bet';
import {
  externalApiAuth,
  externalApiPlaceBet,
} from '../externalApi/externalApiClient';

const prisma = new PrismaClient();

/**
 * Сервис размещения новой ставки пользователя.
 * Алгоритм:
 * 1. Проверяет наличие активного внешнего аккаунта пользователя.
 * 2. Аутентифицирует пользователя во внешнем API (выбросит ошибку, если неуспешно).
 * 3. Размещает ставку во внешнем API (выбросит ошибку, если неуспешно).
 * 4. Сохраняет ставку в базу (обрабатывает возможный дубль по external_bet_id).
 * 5. Возвращает DTO новой ставки.
 *
 * Все бизнес-ошибки выбрасываются как объекты с statusCode, error, message.
 */
export async function createBetService(userId: number, amount: number): Promise<CreateBetResponseDto> {
  // 1. Найти внешний аккаунт пользователя (без него — ошибка 400)
  const account = await prisma.externalApiAccount.findFirst({
    where: { user_id: userId, is_active: true }
  });
  if (!account) {
    throw {
      statusCode: 400,
      error: 'Bad Request',
      message: 'User does not have active external API account.'
    };
  }

  const credentials = {
    externalUserId: account.external_user_id,
    secretKey: account.external_secret_key,
  };

  // 2. Аутентификация пользователя во внешнем API
  try {
    await externalApiAuth(credentials);
  } catch (e: any) {
    throw {
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'Failed to authenticate with external betting API',
      detail: e?.response?.data || e?.message || e,
    };
  }

  // 3. Размещение ставки во внешнем API
  let apiBetResp;
  try {
    apiBetResp = await externalApiPlaceBet(credentials, amount, account.user_id);
  } catch (e: any) {
    throw {
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'Failed to place bet via external API',
      detail: e?.response?.data || e?.message || e,
    };
  }

  // Если внешний API не вернул bet_id — ошибка 502
  if (!apiBetResp.bet_id) {
    throw {
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'External API did not return a bet_id',
      detail: apiBetResp,
    };
  }

  // 4. Сохраняем ставку в БД, ловим дубли по external_bet_id
  let bet;
  try {
    bet = await prisma.bet.create({
      data: {
        user_id: userId,
        external_bet_id: String(apiBetResp.bet_id),
        amount,
        status: 'pending',
      }
    });
  } catch (error: any) {
    // Обработка случая уникальности дубля external_bet_id (P2002)
    if (error.code === 'P2002' && error.meta?.target?.includes('external_bet_id')) {
      throw {
        statusCode: 409,
        error: 'Conflict',
        message: 'Bet with this external_bet_id already exists',
      };
    }
    throw error;
  }

  // 5. Вернуть DTO новой ставки (id, amount, status, created_at)
  return {
    id: bet.id,
    amount: Number(bet.amount),
    status: bet.status,
    created_at: bet.created_at.toISOString(),
  };
}
