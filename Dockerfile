# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---------------------------------------------------------------
# base: Node + pnpm (via Corepack) + manifestos
# slim (Debian/glibc) em vez de alpine (musl): menos atrito com
# dependências nativas como sharp e bcrypt
# ---------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
# só os manifestos: o install só reexecuta quando as dependências mudam
COPY package.json pnpm-lock.yaml ./

# ---------------------------------------------------------------
# deps: todas as dependências (inclusive dev: tsc, tsx, @types)
# ---------------------------------------------------------------
FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------
# development: usado pelo compose (código sincronizado pelo watch)
# ---------------------------------------------------------------
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 8080
# binário direto, sem "pnpm dev": o sinal de parada chega ao processo certo
CMD ["./node_modules/.bin/tsx", "watch", "src/server.ts"]

# ---------------------------------------------------------------
# build: compila TypeScript para dist/
# ---------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm build

# ---------------------------------------------------------------
# prod-deps: só as dependências de produção
# ---------------------------------------------------------------
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ---------------------------------------------------------------
# production: Node puro + dist + node_modules de produção
# ---------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app
# package.json é obrigatório: é ele que diz "type": "module" ao Node
COPY --chown=node:node package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# a pasta precisa existir com dono node antes do volume ser montado
RUN mkdir -p storage && chown node:node storage
USER node
EXPOSE 8080
# node direto: o pnpm não repassa SIGTERM corretamente
CMD ["node", "dist/server.js"]