import dotenv from 'dotenv';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { authenticate } from './middlewares/authMiddleware';

import authRoutes from './routes/authRoutes';
import betsRoutes from './routes/betsRoutes';
import balanceRoutes from './routes/balanceRoutes';
import transactionRoutes from './routes/transactionRoutes';
import internalRoutes from './routes/internalRoutes';
import type { OpenAPIV3 } from 'openapi-types';

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

dotenv.config();

/**
 * Основная функция сборки Fastify-приложения.
 * Подключает все роуты, плагины, middlewares, Swagger UI, JWT.
 */
export const buildApp = () => {
  const app = Fastify();

  // Загружаем openapi.yaml (описание API, схемы, модели)
  const openapiSpec = yaml.load(fs.readFileSync('./openapi.yaml', 'utf8')) as OpenAPIV3.Document;

  // Регистрируем Swagger (mode: static) с документацией OpenAPI
  app.register(swagger, {
    mode: 'static',
    specification: {
      document: openapiSpec,
      path: './openapi.yaml', // либо './openapi.json' если нужен JSON
    },
  });

  // Регистрируем Swagger UI по адресу /docs
  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'full' },
  });

  // JWT middleware — нужен для всех защищённых эндпоинтов
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'secret',
  });

  // Регистрируем основные роуты (каждый — отдельный модуль)
  app.register(authRoutes);
  app.register(betsRoutes);
  app.register(balanceRoutes);
  app.register(transactionRoutes);
  app.register(internalRoutes);

  // Пример защищённого маршрута: возвращает текущего пользователя
  app.get('/api/whoami', { preHandler: [authenticate] }, (req, reply) => {
    reply.send(req.user);
  });

  // Healthcheck endpoint — для мониторинга работоспособности
  app.get('/api/health', async (req, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database: 'ok',
        external_api: 'pending', // Можно допилить healthcheck к внешнему API
      },
    };
  });

  // Ещё один защищённый endpoint (пример)
  app.get(
    '/api/protected',
    { preHandler: [authenticate] },
    async (req, reply) => {
      return {
        message: 'You are authenticated!',
        user: req.user,
      };
    }
  );

  return app;
};
