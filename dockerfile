FROM node:20-alpine

WORKDIR /usr/src/app

# Сначала добавляем openssl для prisma
RUN apk add --no-cache openssl

COPY . .

RUN npm install -g pnpm

RUN pnpm install 

# Генерация prisma client
RUN npx prisma generate

CMD ["pnpm", "run", "dev"]
