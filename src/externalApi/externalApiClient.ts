import crypto from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';
import { logApiCall } from '../services/apiLogService';

export interface ExternalApiCredentials {
  externalUserId: string; // ID пользователя во внешней системе
  secretKey: string;      // HMAC-ключ пользователя для подписи запросов
}

// Базовый URL для всех запросов к внешнему API (например, https://bets.tgapps.cloud/api)
const BASE_URL = process.env.BET_API_URL;

/**
 * Генерирует HMAC SHA-512 подпись для тела запроса.
 * Используется для передачи в заголовке x-signature.
 */
function createSignature(body: any, secretKey: string): string {
  const payload = JSON.stringify(body || {});
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Универсальная функция отправки запросов к внешнему API ставок.
 * - endpoint — путь (например, /auth)
 * - method — HTTP-метод (GET/POST)
 * - credentials — внешний пользователь и ключ
 * - data — тело запроса
 * - user_id — id пользователя в вашей системе (для логирования)
 * - maxRetries — кол-во повторов при временных ошибках/таймаутах
 *
 * Все вызовы логируются через logApiCall, даже при ошибке.
 * В случае ошибки (внешний API не отвечает или 5xx) реализован авто-ретрай с бэк-оффом.
 */
async function sendRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST',
  credentials: ExternalApiCredentials,
  data?: any,
  user_id?: number,
  maxRetries = 2
): Promise<T> {
  const url = BASE_URL + endpoint;
  // Формируем подпись из тела и секрета
  const signature = createSignature(data, credentials.secretKey);

  // Заголовки, как требует внешний API
  const headers: Record<string, string> = {
    'user-id': credentials.externalUserId,
    'x-signature': signature,
    'Content-Type': 'application/json'
  };

  // Собираем конфиг для axios (универсальный клиент для HTTP)
  const config: AxiosRequestConfig = {
    url,
    method,
    headers,
    data: data ? JSON.stringify(data) : undefined,
    timeout: 5000,
  };

  const start = Date.now();
  let lastError: any = null;

  // Механизм повторных попыток (ретрай при таймауте/500+)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios(config);

      // Логируем успешный вызов API
      await logApiCall({
        user_id,
        endpoint: url,
        method,
        request_body: data,
        response_body: response.data,
        status_code: response.status,
        request_duration_ms: Date.now() - start,
      });
      return response.data;
    } catch (err: any) {
      lastError = err;
      const status_code = err?.response?.status || 500;
      const responseData = err?.response?.data || err?.message || err;

      // Решаем, стоит ли повторять запрос:
      // - Если не превышено кол-во попыток
      // - Если ошибка таймаута (ECONNABORTED) или 5xx
      const shouldRetry =
        attempt < maxRetries &&
        (err.code === 'ECONNABORTED' || (status_code >= 500 && status_code < 600));

      if (!shouldRetry) {
        // Логируем неуспешный вызов API (последняя попытка или не ретраябельная ошибка)
        await logApiCall({
          user_id,
          endpoint: url,
          method,
          request_body: data,
          response_body: responseData,
          status_code,
          request_duration_ms: Date.now() - start,
        });
        break;
      }

      // Ждём перед следующей попыткой (backoff: 300ms, 600ms и т.д.)
      await new Promise(res => setTimeout(res, 300 * (attempt + 1)));
    }
  }

  // Если ни одна попытка не прошла — выбрасываем ошибку наверх
  throw lastError;
}

// --- Специализированные функции для каждого метода API ---

/**
 * Аутентификация пользователя во внешнем API (POST /api/auth)
 */
export async function externalApiAuth(credentials: ExternalApiCredentials, user_id?: number) {
  return sendRequest('/auth', 'POST', credentials, {}, user_id);
}

/**
 * Размещение ставки во внешнем API (POST /api/bet)
 */
export async function externalApiPlaceBet(credentials: ExternalApiCredentials, amount: number, user_id?: number) {
  return sendRequest('/bet', 'POST', credentials, { bet: amount }, user_id);
}

/**
 * Получить рекомендуемую сумму ставки (GET /api/bet)
 */
export async function externalApiGetRecommendedBet(credentials: ExternalApiCredentials, user_id?: number) {
  return sendRequest('/bet', 'GET', credentials, null, user_id);
}

/**
 * Получить результат по ставке (выигрыш/проигрыш) (POST /api/win)
 */
export async function externalApiGetWin(credentials: ExternalApiCredentials, betId: string, user_id?: number) {
  return sendRequest('/win', 'POST', credentials, { bet_id: betId }, user_id);
}

/**
 * Установить баланс пользователя во внешнем API (POST /api/balance)
 */
export async function externalApiSetBalance(credentials: ExternalApiCredentials, amount: number, user_id?: number) {
  return sendRequest('/balance', 'POST', credentials, { balance: amount }, user_id);
}

/**
 * Получить баланс пользователя во внешнем API (POST /api/balance)
 */
export async function externalApiGetBalance(credentials: ExternalApiCredentials, user_id?: number) {
  return sendRequest('/balance', 'POST', credentials, {}, user_id);
}
