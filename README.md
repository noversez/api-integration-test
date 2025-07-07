# Betting API

**Backend сервис для интеграции с платформой ставок, управления пользователями, ставками и балансом.**

---

## Возможности

- JWT-аутентификация пользователей
- Размещение ставок, проверка выигрышей
- История ставок и транзакций, баланс
- Интеграция с внешней платформой ставок (API)
- Внутренние endpoint-ы для тестирования интеграции
- Swagger/OpenAPI документация
- Unit-тесты (Jest)
- Поддержка Docker/Docker Compose

---

## Быстрый старт

### 1. Клонируй репозиторий и установи зависимости

git clone https://github.com/your-org/betting-api.git
cd betting-api
pnpm install

### 2. Создай файл .env (можно воспользоваться шаблоном .env.example)

DATABASE_URL=postgresql://postgres:postgres@db:5432/betting_db
JWT_SECRET=your-jwt-secret
BET_API_URL=https://bets.tgapps.cloud/api
ADMIN_TOKEN=your-admin-token

### 3. Миграции и сиды 

npx prisma migrate dev --name init
npx prisma db seed

### 4. Запуск тестов

npx jest

### 5. Запуск проекта

pnpm run dev

### 6. Swagger/OpenAPI

- Интерактивная документация: http://localhost:3000/docs
- Описание всех ручек, моделей, авторизация через JWT прямо в Swagger UI

---

## Основные endpoint-ы

- POST /api/auth/login — получить JWT-токен по username
- POST /api/bets — разместить ставку (JWT обязателен)
- POST /api/win — получить результат ставки
- POST /api/balance — получить баланс
- GET /api/transactions — история транзакций (с пагинацией)
- GET /api/bets — история ставок пользователя
- GET /api/bets/:id — получить ставку по id
- GET /api/bets/recommended — рекомендуемая ставка
- /api/internal/ — внутренние endpoint-ы для интеграции/тестирования (JWT admin)

---

## Переменные окружения

DATABASE_URL — строка подключения к Postgres  
JWT_SECRET — секрет для подписи JWT  
BET_API_URL — адрес внешнего API ставок  
ADMIN_TOKEN — токен для доступа к internal API

---

.
├── src/
│   ├── controllers/      # Контроллеры (Fastify handlers)
│   ├── services/         # Бизнес-логика/интеграции
│   ├── routes/           # Fastify роутеры
│   ├── middlewares/      # Аутентификация, авторизация
│   ├── externalApi/      # Внешние клиенты API
│   ├── prisma/           # Миграции, schema.prisma, seed
│   └── test/             # Unit/интеграционные тесты
├── openapi.yaml          # Полная OpenAPI документация
├── docker-compose.yml    # Запуск через Docker Compose
├── Dockerfile            # (если нужен для деплоя)
├── .env                  # Переменные окружения (добавить самому!)
└── README.md

---

## Проверка endpoint-ов

1. Получить JWT через /api/auth/login
2. Передавать JWT в Authorization: Bearer {token} ко всем защищённым ручкам
3. Использовать Swagger UI для теста ручек
4. Для internal endpoint-ов использовать токен ADMIN_TOKEN

---

## Тестовые пользователи (пример)

username: test11user11  
(см. seed, внешний аккаунт, secret в .env)

---