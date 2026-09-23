# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---------------------------------------------------------------
# base: camada comum aos dois ambientes
# slim (Debian/glibc) em vez de alpine (musl): menos atrito com
# dependências nativas como sharp e bcrypt.
# ---------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /usr/src/app
# Copiar só os manifestos primeiro aproveita o cache de camadas:
# o npm install só reexecuta quando as dependências mudam.
COPY package*.json ./

# ---------------------------------------------------------------
# development: usado pelo docker-compose.yml (código via bind mount)
# ---------------------------------------------------------------
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 8080
# --legacy-watch (polling): eventos de arquivo do Windows/WSL
# não chegam ao container via bind mount.
CMD ["npx", "nodemon", "--legacy-watch", "server.js"]

# ---------------------------------------------------------------
# production: imagem enxuta, sem devDependencies, usuário não-root
# ---------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
# npm ci exige package-lock.json versionado no repositório.
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p storage && chown -R node:node storage
USER node
EXPOSE 8080
# node direto (sem npm start): o npm não repassa SIGTERM corretamente.
CMD ["node", "server.js"]
