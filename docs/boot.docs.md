# Documentação do Boot da API

## Comandos
- `pnpm run dev`: comando de terminal para start em ambiente de desenvolvimento. Executa `src/server.ts` e roda a API com verificação do TypeScript em tempo real.
- `pnpm build`: comando de terminal que compila o código TypeScript para JavaScript em `dist/`.
- `pnpm run start`: comando de terminal para start em ambiente de produção. Executa `src/server.js` e roda a API já formatada pelo TypeScript.
- Ambos os comandos de start carregam as variáveis de ambiente `.env` no ambiente do processo interno do Node, permitindo acesso via `process.env` em qualquer módulo da API.

## Variáveis de ambiente
- `.env` deve existir na raiz do repositório.
- `.env` deve seguir a formatação de `.env.example`.
- Variáveis DB_* referem-se à conexão com o banco de dados Postgres. DB_NAME, DB_USER e DB_HOST são obrigatórios.
- Variáveis REDIS_* referem-se à conexão com o banco Redis. REDIS_HOST e REDIS_PORT são obrigatórios.
- Variáveis PORT e NODE_ENV referem-se ao servidor Node.js. NODE_ENV deve ser 'development', 'production' ou 'test'.
- Variáveis JWT_* referem-se às configurações de autenticação de usuários na API. A chave secreta deve ser gerada usando o comando de terminal abaixo:

```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- Variáveis URL_* referem-se às configurações CORS e definem os endereços remetentes autorizados a enviar requisições para a API.
- A ausência de variáveis de ambiente obrigatórias devem lançar erro fatal.

## Ordem de boot
1. Banco de dados Postgres: tenta conectar com banco já existente e exportar cliente único. Se falhar, deve lançar erro fatal e seguir com `process.exit(1)`.
2. Cliente Redis principal: tenta conectar com serviço do Redis e exportar cliente principal. Caso bem-sucedido, inicializa clientes dos workers BullMQ. Se falhar, deve apenas logar erros, nunca lançar
3. Servidor Node: tenta inicializar servidor. Se falhar, deve lançar erro fatal e seguir com `process.exit(1)`.

- O servidor Node é a base da API e escuta eventos diversos, incluindo gratefulShutdown - encerramento controlado da API por parte do usuário ou do sistema - nesse caso, segue com `process.exit(0)`.
- A conexão com o banco de dados Postgres é fundamental para a API. Desconexões devem impedir o seu funcionamento. O retry é limitado em até 15 segundos com `withTimeout`.
- A conexão com o banco Redis é importante, mas não fundamental. Desconexões iniciam uma estratégia de reconexão infinita. O `retryStrategy` permite armazenar trabalhos pendentes para reenfileirá-los quando Redis estabilizar.