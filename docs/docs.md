# VITA — Requisitos do Sistema

Documento de referência do projeto VITA. Define regras e objetivos que devem ser seguidos por desenvolvedores e assistentes de IA.

## Como usar este documento

- Este documento prevalece sobre os demais anexos (contextos, históricos de conversa e modelagens antigas). Em caso de conflito, vale o que está aqui.
- As seções 1 a 13 descrevem o **estado-alvo** do sistema. O que já existe está na seção 14 (Estado atual da implementação). Todo requisito que não aparece lá deve ser considerado pendente.
- A API está em migração de JavaScript para TypeScript. A seção 14 se refere exclusivamente à versão TypeScript.

## Índice

1. Visão geral
2. Convenções
3. API
4. Banco de dados
5. Entidades
6. Autenticação
7. Upload de imagens
8. Storage
9. Processamento assíncrono (Redis e BullMQ)
10. Pré-processamento de imagens (Sharp)
11. Tratamento de erros
12. Respostas HTTP
13. Fora do escopo atual
14. Estado atual da implementação

---

## 1. Visão geral

O projeto é dividido em quatro repositórios:

| Repositório | Responsabilidade | Stack |
| --- | --- | --- |
| `vita-api` | API REST | Node.js, Express, TypeScript, Sequelize, Zod |
| `vita-database` | Schema, migrations e models | PostgreSQL + PostGIS, TypeScript, Sequelize |
| `vita-app-web` | Front-end web | Next.js, React, TypeScript |
| `vita-app-mobile` | Front-end mobile | Expo, React Native, TypeScript |

- Todos os repositórios devem ser dockerizados.
- Todos os repositórios devem ter CI/CD com GitHub Actions, Husky e ESLint.

## 2. Convenções

- Nomes no banco (tabelas, colunas e valores de enum) em `snake_case`, em português e sem acentos. Tabelas no plural.
- Toda coluna é obrigatória, exceto as marcadas como **opcional**.
- Faixas de tamanho (ex.: 3–150) são validadas no DTO (Zod). O valor máximo também define o tamanho da coluna.
- Caminhos de storage usam placeholders entre chaves, por exemplo `{id_usuario}`.

## 3. API

- Estrutura base a partir de `src/`: `shared/`, `modules/` e `routes/`, expansível conforme necessário.
- Toda requisição deve ser validada com Zod.
- DTOs são os tipos inferidos dos schemas Zod (`z.infer`).
- O acesso ao banco é feito via Sequelize, usando as models do pacote do `vita-database`.

## 4. Banco de dados

- O `vita-database` contém as migrations, as models e os scripts de criação e alteração do banco.
- As migrations definem o schema; as models devem espelhá-las.
- As models são distribuídas como pacote via GitHub Packages e instaladas pela API.
- A responsabilidade da API sobre o banco é apenas instanciar a conexão. Falha de conexão é erro fatal (ver seção 11).
- Toda tabela tem chave primária `id` do tipo `UUID`.
- Chaves estrangeiras seguem o padrão `id_<entidade no singular>` (ex.: `id_usuario`).
- Toda tabela tem `created_at`, `updated_at` e `deleted_at`. Configuração das models: `timestamps: true`, `underscored: true`, `paranoid: true`.
- **Soft delete:** nenhum registro é apagado fisicamente. A exclusão lógica deve propagar para os registros filhos. O Sequelize não faz essa propagação nativamente; ela deve ser implementada via hooks.
- **PostGIS:** coordenadas usam SRID 4326 e a ordem `(longitude, latitude)`, a mesma do GeoJSON.

## 5. Entidades

### 5.1 `usuarios`

Contas e dados cadastrais dos usuários.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `nome` | `VARCHAR(150)` | 3–150 caracteres |
| `email` | `VARCHAR(250)` | 3–250 caracteres; normalizado para minúsculas; único entre usuários ativos |
| `senha_hash` | `VARCHAR(255)` | Hash bcrypt da senha |
| `telefone` | `VARCHAR(15)` | Opcional; 10–15 dígitos, sem pontuação |
| `data_nascimento` | `DATE` | Opcional |
| `perfil` | `ENUM('produtor', 'estudante', 'outro')` | Padrão `'outro'` |
| `endereco` | `VARCHAR(255)` | Opcional; 5–255 caracteres; endereço completo; perfil `produtor` |
| `cnpj` | `VARCHAR(14)` | Opcional; 14 dígitos, sem pontuação; perfil `produtor` |
| `cpf` | `VARCHAR(11)` | Opcional; 11 dígitos, sem pontuação; perfil `produtor` |
| `faculdade` | `VARCHAR(150)` | Opcional; 3–150 caracteres; perfil `estudante` |
| `curso` | `VARCHAR(150)` | Opcional; 3–150 caracteres; perfil `estudante` |
| `foto_perfil` | `VARCHAR(2048)` | Opcional; caminho relativo do arquivo no storage |

- O campo de entrada no DTO é `senha`: 8 a 72 bytes (limite do bcrypt), com no mínimo 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.
- `perfil` ainda não tem função definida. Os campos associados a perfis são opcionais para qualquer perfil, por enquanto.
- A unicidade de `email` é garantida por índice único parcial: `UNIQUE (email) WHERE deleted_at IS NULL`.

### 5.2 `analises`

Solicitação de processamento: o grupo de imagens que o usuário envia de uma vez. Todas as imagens de uma análise mostram a mesma fruta, em ângulos diferentes.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_usuario` | `UUID` | FK para `usuarios`; usuário que solicitou a análise |
| `status` | `ENUM('em_espera', 'pendente', 'reenfileirada', 'finalizada', 'cancelada')` | Padrão `'em_espera'` |

Ciclo de vida do `status`:

- `em_espera`: estado inicial, ao criar a análise.
- `pendente`: o job saiu da fila e foi assumido por um worker.
- `reenfileirada`: a análise foi iniciada offline, salva localmente e inserida novamente na fila.
- `finalizada`: o processamento terminou com sucesso.
- `cancelada`: o processamento falhou em todas as tentativas ou sofreu erro fatal.

### 5.3 `imagens`

Imagens originais enviadas em uma análise.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_analise` | `UUID` | FK para `analises` |
| `nome` | `VARCHAR(150)` | Opcional; 3–150 caracteres; nome original do arquivo |
| `caminho` | `VARCHAR(2048)` | Caminho relativo do arquivo no storage |
| `coordenadas` | `GEOGRAPHY(POINT, 4326)` | Opcional; local de captura da imagem |
| `tipo_mime` | `ENUM('image/jpeg', 'image/png', 'image/webp')` | Detectado no upload |
| `tamanho` | `INTEGER` | Tamanho do arquivo em bytes |

### 5.4 `processadas`

Imagens geradas pelo pipeline de pré-processamento a partir das originais.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_analise` | `UUID` | FK para `analises` |
| `id_imagem` | `UUID` | FK para `imagens`; imagem original |
| `nome` | `VARCHAR(150)` | Opcional; 3–150 caracteres; nome original do arquivo |
| `caminho` | `VARCHAR(2048)` | Caminho relativo do arquivo no storage |
| `tipo_mime` | `ENUM('image/jpeg', 'image/png', 'image/webp')` | Padrão `'image/webp'` |
| `tamanho` | `INTEGER` | Tamanho do arquivo em bytes |

### 5.5 `classificacoes`

Resultado da inferência do modelo sobre uma análise. Cada análise tem uma única classificação, que vale para todas as imagens incluídas nela.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_analise` | `UUID` | FK para `analises` |
| `classe` | `ENUM('saudavel', 'infectado')` | Rótulo atribuído pelo modelo; sem valor padrão |
| `confianca` | `FLOAT` | 0–1; probabilidade atribuída pelo modelo à classe escolhida |
| `tempo_execucao` | `INTEGER` | Duração da inferência em milissegundos |
| `modelo_cnn` | `VARCHAR(150)` | 3–150 caracteres; nome do modelo |
| `versao_modelo` | `VARCHAR(50)` | 5–50 caracteres; versão do modelo |

Regra de agregação (o modelo classifica cada imagem separadamente e os resultados são combinados):

- A análise é `infectado` se ao menos uma imagem for classificada como infectada. Uma lesão visível em qualquer ângulo caracteriza a fruta como doente.
- Se a análise for `infectado`, `confianca` é a maior confiança entre as imagens classificadas como infectadas.
- Se a análise for `saudavel`, `confianca` é a menor confiança entre as imagens. A análise é tão confiável quanto sua imagem mais incerta.
- A meta de acurácia do projeto (mínimo de 90%) é medida por análise, não por imagem.

## 6. Autenticação

- Autenticação com JSON Web Token (JWT), com fluxos de login e logout.
- O payload do token contém `id`, `nome` e `email` do usuário.
- O token expira em 1 hora.
- Rotas protegidas exigem o header `Authorization: Bearer <token>`.
- O middleware de autenticação verifica se o usuário existe e está ativo.
- No logout ou na desativação do usuário, o token atual deve ser invalidado. O mecanismo de invalidação ainda será definido.

## 7. Upload de imagens

- Uma análise contém de 1 a 4 imagens da mesma fruta, em ângulos diferentes.
- O cliente pode obter imagens da câmera ou da galeria do dispositivo. A API não distingue a origem.
- Formatos aceitos: JPG, JPEG, PNG e WEBP.
- Tamanho máximo: 5 MB por arquivo.
- Nome do campo na requisição: `images`.
- As mesmas regras valem para a foto de perfil.

## 8. Storage

- Armazenamento local, em diretório reservado dentro do repositório da API.
- Acesso exclusivamente por uma interface independente de driver, com os métodos mínimos `put`, `get`, `delete` e `getAccessUrl`. A interface deve permitir trocar o driver local por um de nuvem sem alterar quem a consome.
- O banco guarda apenas o caminho relativo dos arquivos. A URL de acesso é gerada por `getAccessUrl`.
- Estrutura de diretórios:
  - `storage/uploads/`: imagens originais de análises e fotos de perfil.
  - `storage/processed/`: imagens geradas pelo pipeline de pré-processamento.
  - `storage/temp/`: arquivos temporários de acesso rápido. Deve existir uma rotina de limpeza para este diretório.
- Caminhos padrão:
  - Imagens originais de análises: `storage/uploads/{id_usuario}/{id_analise}/`
  - Imagens processadas: `storage/processed/{id_usuario}/{id_analise}/`
  - Foto de perfil: `storage/uploads/{id_usuario}/profile/`

## 9. Processamento assíncrono (Redis e BullMQ)

### 9.1 Redis

- Biblioteca `ioredis`, usada como base para as filas do BullMQ.
- Dockerizado como serviço do `docker-compose` do `vita-api`, com credenciais via variáveis de ambiente.
- Conexões criadas por factory.
- Um cliente principal, `mainClient`, gerencia o estado da conexão. Seus listeners controlam as demais conexões (queues e workers).
- Todas as conexões usam `retryStrategy` com intervalo de reconexão entre 5 e 15 segundos.
- A desconexão do Redis não pode derrubar a API. As análises recebidas nesse período devem ser salvas localmente e reenfileiradas quando o Redis reconectar (status `reenfileirada`).

### 9.2 BullMQ

- Processamento assíncrono das análises com queues, jobs e workers.
- Cada queue e cada worker usa uma conexão Redis própria; workers duplicam a conexão recebida.
- As conexões do BullMQ devem definir `connectionName` e `maxRetriesPerRequest: null`. Este último é exigido pelo BullMQ para workers.
- Queues são instanciadas sob demanda. Workers são instanciados assim que possível, pois ficam escutando jobs.
- Um orquestrador de workers ativa as conexões quando o `mainClient` conecta e as encerra quando ele desconecta.

## 10. Pré-processamento de imagens (Sharp)

- Antes da inferência, as imagens de cada análise passam por um pipeline de pré-processamento com a biblioteca `sharp`.
- Os pipelines ficam em `src/shared/pipelines/`.
- O pipeline de análises simula **Data Augmentation**: aplica redimensionamento e ajustes de ruído, brilho e saturação em cópias das imagens originais.
- Saída do pipeline: imagens comprimidas em WEBP, no espaço de cores sRGB.
- As imagens são manipuladas como `Buffer` durante o processamento.
- A inferência é atualmente simulada com `sharp`.
- O papel deste pipeline junto ao modelo real será definido na integração com o serviço em Python.

## 11. Tratamento de erros

- Todo erro deve ser registrado em log. Exceto os erros fatais, todo erro deve ser convertido em resposta HTTP padronizada (seção 12).
- Controllers e services não usam `try/catch` apenas para repassar erros. O Express 5 encaminha automaticamente as rejeições de handlers `async` para o `error.middleware`.
- `try/catch` é usado somente quando há tratamento local: compensação ou rollback (ex.: remover arquivos já gravados), tradução de erro externo em `AppError` ou fallback (ex.: Redis indisponível).
- Código fora do ciclo de requisição do Express (ex.: workers do BullMQ, listeners de eventos) trata os próprios erros.
- O `error.middleware` é o último handler da aplicação e trata todos os erros que chegam até ele.

| Categoria | Definição | Comportamento |
| --- | --- | --- |
| `AppError` | Erro de negócio previsto, lançado intencionalmente | Resposta HTTP 4xx/5xx com mensagem própria; a API continua operando |
| Bug | Erro inesperado, não previsto pelo código | Resposta HTTP 500 Internal Server Error genérica |
| Erro fatal | Falha em serviço essencial (boot, variáveis de ambiente, conexão com o banco) | Lançado imediatamente; encerra a API |

## 12. Respostas HTTP

Formato padrão:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Formato de respostas paginadas (o envelope é o mesmo; muda apenas o conteúdo de `data`):

```json
{
  "success": true,
  "message": "string",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 10
  }
}
```

Formato de respostas de erro:

```json
{
  "success": false,
  "message": "string",
  "detail": "string | object"
}
```

- `detail` é uma string para erros simples ou um objeto para erros estruturados (ex.: falhas de validação por campo do Zod).
- Em bugs (HTTP 500), `detail` não expõe stack trace nem mensagens internas.

## 13. Fora do escopo atual

- Exclusão física de registros (limpeza do banco).
- Refresh token. Com expiração de 1 hora, o usuário precisa fazer login novamente após esse período.
- Drivers de storage em nuvem (R2, Supabase, Firebase etc.). A interface deve suportá-los, mas não é preciso implementá-los.
- Armazenamento de outros tipos de arquivo além de imagens (ex.: relatórios PDF).
- Integração com o serviço de inferência real (CNN em Python).
- Módulos de contexto, recomendação e diagramação (mapa e linha do tempo).

## 14. Estado atual da implementação

### Implementado

- Separação nos quatro repositórios (`vita-api`, `vita-database`, `vita-app-web`, `vita-app-mobile`).
- Boot da API TypeScript (dockerizado), com estrutura `src/shared`, `src/modules` e `src/routes`.
- Normalização e validação das variáveis de ambiente com Zod.
- Criação e conexão do banco PostgreSQL via Sequelize (dockerizado, ainda dentro do repositório da API).
- Conexão Redis com factory, `mainClient` e `retryStrategy` (dockerizado no compose do `vita-api`).
- Middleware de erro global com `AppError`, tratamento de bugs (HTTP 500) e de erros fatais no boot.
- Formatos padrão de resposta HTTP, simples e paginado.
- Configuração do Multer baseada em políticas e middleware de upload (1–4 imagens, formatos aceitos, limite de 5 MB, campo `images`).
- Rota de health-check.

### Em andamento

- Dockerização de todos os repositórios.
- Extração do banco para o `vita-database` (PostgreSQL + PostGIS).
- Módulo de storage e salvamento dos uploads em `storage/uploads/`.
- Filas, workers e orquestrador do BullMQ.
- Pipeline de pré-processamento com Sharp e inferência simulada.