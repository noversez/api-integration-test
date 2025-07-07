import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtUserPayload } from '../types/fastify';

/**
 * Middleware для проверки JWT-токена пользователя.
 * - Проверяет валидность токена через встроенный метод request.jwtVerify().
 * - Если токен валиден — кастует request.user к типу JwtUserPayload.
 * - Если токен невалиден/отсутствует — возвращает 401 Unauthorized.
 * 
 * Используется как preHandler для защищённых роутов.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Fastify автоматически добавляет метод jwtVerify (см. fastify-jwt)
    await request.jwtVerify();
    // Явно кастуем тип user для TypeScript (для удобной дальнейшей работы)
    const user = request.user as JwtUserPayload;
    request.user = user;
    // Если jwtVerify не выбросил исключение — пользователь авторизован
  } catch (err) {
    // Если токен невалиден или отсутствует — возвращаем ошибку 401
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  }
}
