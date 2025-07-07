import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Асинхронная функция для логирования запросов к внешнему API.
 * Записывает информацию о каждом запросе/ответе в таблицу apiLog:
 * - user_id           — ID пользователя (опционально)
 * - endpoint          — путь или URL API
 * - method            — HTTP-метод (GET/POST/...)
 * - request_body      — тело запроса (любой формат)
 * - response_body     — тело ответа (любой формат)
 * - status_code       — HTTP статус-код ответа
 * - request_duration_ms — время запроса в миллисекундах
 * - ip_address        — IP-адрес инициатора запроса (если есть)
 *
 * Все поля логируются как есть. Ошибки логирования не бросают исключение наружу (silent fail).
 */
export async function logApiCall({
  user_id,
  endpoint,
  method,
  request_body,
  response_body,
  status_code,
  request_duration_ms,
  ip_address,
}: {
  user_id?: number;
  endpoint: string;
  method: string;
  request_body?: any;
  response_body?: any;
  status_code?: number;
  request_duration_ms?: number;
  ip_address?: string;
}) {
  try {
    await prisma.apiLog.create({
      data: {
        user_id,
        endpoint,
        method,
        request_body,
        response_body,
        status_code,
        request_duration_ms,
        ip_address,
      }
    });
  } catch (err) {
    // Ошибки логирования не выбрасываются, а просто логируются в консоль (чтобы не мешать основному флоу)
    console.error('Failed to log API call:', err);
  }
}
