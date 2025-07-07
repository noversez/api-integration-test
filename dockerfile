FROM node:20-alpine
WORKDIR /usr/src/app
COPY . .
RUN pnpm install
CMD ["pnpm", "run", "dev"]
