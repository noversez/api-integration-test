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

### 1. Клонирование репозитория и установка зависимостей

```bash
git clone https://github.com/your-org/betting-api.git
cd betting-api
pnpm install
```

### 2. Инициализация .env (можно воспользоваться шаблоном .env.example)

- DATABASE_URL=postgresql://postgres:postgres@localhost:5432/betting_db
- BET_API_URL=https://bets.tgapps.cloud/api
- SECRET_KEY=secretkey
- PORT=3000
- ADMIN_TOKEN=admintoken

### 3. Миграции и сиды 

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Запуск тестов
```bash
npx jest
```
### 5. Запуск проекта
```bash
pnpm run dev
```
### 6. Swagger/OpenAPI

- Интерактивная документация: http://localhost:3000/docs

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
## Структура проекта
```bash
.
├── src/
│   ├── controllers/      
│   ├── services/         
│   ├── routes/           
│   ├── middlewares/      
│   ├── externalApi/      
│   ├── prisma/           
│   └── test/             
├── openapi.yaml          
├── docker-compose.yml    
├── Dockerfile            
├── .env                  
└── README.md
```
---
