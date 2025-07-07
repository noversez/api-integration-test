import { buildApp } from './app';

// Создаём экземпляр Fastify приложения с помощью фабрики
const app = buildApp();

// Определяем порт из переменных окружения, по умолчанию 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Запускаем сервер на 0.0.0.0 (доступен на всех интерфейсах)
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    // В случае ошибки логируем её и завершаем процесс
    app.log.error(err);
    process.exit(1);
  }
  // Если сервер стартовал — выводим адрес в консоль
  console.log(`Server listening at ${address}`);
});
