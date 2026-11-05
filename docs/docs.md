# VITA — Requisitos do Sistema

Documento de referência do projeto VITA. Define regras e objetivos que devem ser seguidos por desenvolvedores e assistentes de IA.

## Como usar este documento

- Este documento prevalece sobre os demais anexos (contextos, históricos de conversa e modelagens antigas). Em caso de conflito, vale o que está aqui.
- As seções 1 a 13 descrevem o **estado-alvo** do sistema. O que já existe está na seção 14 (Estado atual da implementação). Todo requisito que não aparece lá deve ser considerado pendente.
- A seção 15 guarda os requisitos da extração do banco para o `vita-database`, tarefa **congelada**. Eles não são pendências e não devem ser implementados até a retomada. Enquanto isso, o `vita-api` cuida do banco (seção 4.1).
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
15. Tarefa congelada: extração do banco para o `vita-database`

---

## 1. Visão geral

O projeto é dividido em quatro repositórios, todos na organização `vita-projeto-integrador` do GitHub:

| Repositório | Responsabilidade | Stack |
| --- | --- | --- |
| `vita-api` | API REST e, enquanto a extração do banco estiver congelada, o banco de dados (seção 4.1) | Node.js, Express, TypeScript, Sequelize, Zod, PostgreSQL + PostGIS |
| `vita-database` | Schema, migrations e models. **Congelado** (seção 15) | PostgreSQL + PostGIS, TypeScript, Sequelize |
| `vita-app-web` | Front-end web | Next.js, React, TypeScript |
| `vita-app-mobile` | Front-end mobile | Expo, React Native, TypeScript |

- Todos os repositórios devem ser dockerizados.
- Todos os repositórios devem ter CI/CD com GitHub Actions, Husky e ESLint.
- Os dois itens acima não se aplicam ao `vita-database` enquanto ele estiver congelado. O banco de desenvolvimento roda no `docker-compose` do `vita-api`.

### 1.1 Versões de referência

| Ferramenta | Versão | Observação |
| --- | --- | --- |
| pnpm | `11.24.0` | Versão usada no `vita-api`. Fixada no campo `packageManager` do `package.json` de cada repositório Node |
| PostgreSQL + PostGIS | `postgis/postgis:17-3.5` | Imagem Docker de referência (PostgreSQL 17 com PostGIS 3.5) |

## 2. Convenções

- Nomes no banco (tabelas, colunas e valores de enum) em `snake_case`, em português e sem acentos. Tabelas no plural.
- Toda coluna é obrigatória, exceto as marcadas como **opcional**.
- Faixas de tamanho (ex.: 3–150) são validadas no DTO (Zod). O valor máximo também define o tamanho da coluna.
- Também são garantidos no banco, por constraints `CHECK` (seção 4.3):
  - as faixas de valores de dados gravados sem passar por um DTO (ex.: pelos workers);
  - os formatos dos quais o banco depende (ex.: e-mail em minúsculas, base do índice único);
  - os formatos fixos de documentos e contato (ex.: telefone, CPF e CNPJ apenas com dígitos).
- Caminhos de storage usam placeholders entre chaves, por exemplo `{id_usuario}`.

## 3. API

- Estrutura base a partir de `src/`: `shared/`, `modules/` e `routes/`, expansível conforme necessário.
- Toda requisição deve ser validada com Zod.
- DTOs são os tipos inferidos dos schemas Zod (`z.infer`).
- O acesso ao banco é feito via Sequelize, com models definidas na própria API enquanto a extração do banco estiver congelada (seção 4.1).
- **Configuração:** `process.env` é lido apenas em `env.ts`, que valida todas as variáveis com Zod no boot. O restante do código consome o objeto `env` validado. Variável ausente ou inválida é erro fatal (seção 11).
- **CORS:** apenas as origens configuradas são liberadas (`URL_WEB` e, opcionalmente, `URL_EXPO`). Requisições sem o header `Origin` (apps mobile, ferramentas de teste) são aceitas: o CORS não substitui a autenticação.

## 4. Banco de dados

### 4.1 Regime temporário: o banco no `vita-api`

Enquanto a extração do banco estiver congelada (seção 15), o `vita-api` cuida do banco: o schema, as models e os hooks de exclusão ficam na API. Na retomada, esta subseção é substituída pelos requisitos da seção 15.

- O `database/schema.sql` do `vita-api` é a fonte do schema. É editado à mão e aplicado com `psql` em um banco vazio, conforme as instruções no cabeçalho do arquivo. Roda em uma única transação e não é idempotente: aplicado duas vezes, falha sem alterar nada.
- As models da API espelham o `schema.sql`. A API não usa `sync()`: ele criaria o schema a partir das models, sem as constraints `CHECK` e com nomes automáticos de constraints, fora do padrão da seção 4.3.
- Em tempo de execução, a API apenas instancia a conexão; nunca cria nem altera o schema. Falha de conexão com o banco é erro fatal (seção 11).
- O banco precisa ter a extensão PostGIS antes da aplicação do `schema.sql`, que confere a extensão e falha se ela não existir. Em desenvolvimento, a imagem `postgis/postgis` cria a extensão no banco `POSTGRES_DB` na primeira subida. Em produção, o administrador do banco a cria: `CREATE EXTENSION postgis` exige privilégio de superusuário.
- Sem migrations, uma alteração no `schema.sql` só chega a um banco existente recriando o banco, com perda dos dados. Um banco com dados a preservar exige retomar a extração (seção 15) ou um script de alteração escrito à mão.

### 4.2 Conexão da API

- A API usa as variáveis `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` e `DB_PORT` (e `DB_SSL`/`DB_SSL_CA`, ver o item abaixo).
- A conexão da API aceita SSL opcional (`DB_SSL`), sempre com verificação do certificado do servidor (`rejectUnauthorized: true`). A CA (`DB_SSL_CA`, caminho do arquivo) é opcional e só pode ser informada com `DB_SSL=true`.

### 4.3 Regras do schema

Valem no regime temporário e depois da extração.

- Toda tabela tem chave primária `id` do tipo `UUID`, gerada pelo banco (`DEFAULT gen_random_uuid()`).
- Chaves estrangeiras seguem o padrão `id_<entidade no singular>` (ex.: `id_usuario`), usam `ON DELETE RESTRICT` e têm índice.
- Toda tabela tem `created_at`, `updated_at` e `deleted_at`. Configuração das models: `timestamps: true`, `underscored: true`, `paranoid: true`.
- Enums são tipos `ENUM` nativos do PostgreSQL.
- As regras marcadas com **CHECK** nas tabelas da seção 5 são garantidas por constraints `CHECK` no banco.
- Os motivos das decisões de schema ficam em `COMMENT ON`: são gravados no próprio banco e preservados pelo `pg_dump`.
- Nomes de constraints, índices e tipos seguem o padrão abaixo. Eles aparecem nas mensagens de erro do banco e são usados pela API para traduzir violações em respostas HTTP. Chaves estrangeiras, índices e `CHECK` recebem o nome explicitamente. A chave primária usa o nome padrão do PostgreSQL, que já segue o padrão. O tipo `ENUM` usa o nome que o Sequelize gera; no `schema.sql`, esse nome é escrito por extenso (`CREATE TYPE enum_<tabela>_<coluna>`), para que o schema não mude na retomada das migrations (seção 15).

  | Objeto | Padrão | Exemplo |
  | --- | --- | --- |
  | Chave primária | `<tabela>_pkey` | `usuarios_pkey` |
  | Chave estrangeira | `<tabela>_<entidade referenciada>_fk` | `analises_usuario_fk` |
  | Índice | `<tabela>_<coluna>_idx` | `analises_id_usuario_idx` |
  | Índice único | `<tabela>_<regra>_uq` | `usuarios_email_ativo_uq` |
  | Índice espacial (GiST) | `<tabela>_<coluna>_gix` | `imagens_coordenadas_gix` |
  | `CHECK` | `<tabela>_<regra>_ck` | `usuarios_email_minusculo_ck` |
  | Tipo `ENUM` | `enum_<tabela>_<coluna>` (o nome que o Sequelize gera) | `enum_analises_status` |

- **Soft delete:** nenhum registro é apagado fisicamente. A exclusão lógica deve propagar para os registros filhos, na mesma transação:
  - `usuarios` → `analises`
  - `analises` → `imagens` e `classificacoes`
  - `imagens` → `processadas`

  O Sequelize não faz essa propagação nativamente; ela deve ser implementada via hooks nas models (no regime temporário, as models da API). A API abre a transação da exclusão. As models recusam:
  - a exclusão de usuários, análises e imagens fora de uma transação (são as tabelas que propagam a exclusão para filhos);
  - a exclusão física (`force: true`) em qualquer das cinco tabelas;
  - a exclusão em lote de usuários, análises e imagens sem `individualHooks: true`. O hook de lote recebe só as opções da chamada, sem os registros, e não consegue propagar a exclusão; com `individualHooks: true`, cada registro passa pelo `beforeDestroy`, que propaga.

  As recusas valem tanto para a exclusão de um registro (hook `beforeDestroy`) quanto para a exclusão em lote (hook `beforeBulkDestroy`): uma exclusão em lote sem `individualHooks: true` não passa pelo `beforeDestroy`.
- **PostGIS:** coordenadas usam o tipo `GEOGRAPHY(POINT, 4326)` (SRID 4326), a ordem `(longitude, latitude)`, a mesma do GeoJSON, e índice GiST.

## 5. Entidades

### 5.1 `usuarios`

Contas e dados cadastrais dos usuários.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `nome` | `VARCHAR(150)` | 3–150 caracteres |
| `email` | `VARCHAR(250)` | 3–250 caracteres; normalizado para minúsculas; único entre usuários ativos; **CHECK** `email = lower(email)` |
| `senha_hash` | `VARCHAR(255)` | Hash bcrypt da senha |
| `telefone` | `VARCHAR(15)` | Opcional; 10–15 dígitos, sem pontuação; **CHECK** `telefone ~ '^[0-9]{10,15}$'` |
| `data_nascimento` | `DATE` | Opcional |
| `perfil` | `ENUM('produtor', 'estudante', 'outro')` | Padrão `'outro'` |
| `endereco` | `VARCHAR(255)` | Opcional; 5–255 caracteres; endereço completo; perfil `produtor` |
| `cnpj` | `VARCHAR(14)` | Opcional; 14 dígitos, sem pontuação; perfil `produtor`; **CHECK** `cnpj ~ '^[0-9]{14}$'` |
| `cpf` | `VARCHAR(11)` | Opcional; 11 dígitos, sem pontuação; perfil `produtor`; **CHECK** `cpf ~ '^[0-9]{11}$'` |
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
| `status` | `ENUM('em_espera', 'processando', 'finalizada', 'falhou')` | Padrão `'em_espera'` |
| `coordenadas` | `GEOGRAPHY(POINT, 4326)` | Opcional; local da análise. Reservada para o módulo de diagramação (mapa); a regra de preenchimento será definida com ele |

Ciclo de vida do `status`:

- `em_espera`: estado inicial. A análise e suas imagens já estão gravadas no banco e no storage e aguardam processamento, com o job na fila ou não (Redis indisponível, seção 9.1).
- `processando`: um worker assumiu o job. Entre as tentativas do BullMQ, o status permanece `processando`.
- `finalizada`: o processamento terminou com sucesso. Estado final.
- `falhou`: as tentativas se esgotaram ou ocorreu um erro não recuperável (ex.: imagem corrompida). Estado final.

```
em_espera ──▶ processando ──▶ finalizada
                    │
                    └───────▶ falhou
```

| Transição | Executada por | Regra |
| --- | --- | --- |
| (criação) → `em_espera` | Service de criação de análises | Após gravar a análise e as imagens. Em seguida, tenta incluir o job na fila; se o Redis estiver indisponível, a análise permanece em `em_espera` e a resposta continua sendo `202 Accepted` |
| `em_espera` ou `processando` → `processando` | Worker | Ao assumir o job. A origem `processando` cobre as novas tentativas do BullMQ e a retomada de jobs perdidos pela rotina de recuperação (seção 9.1) |
| `processando` → `finalizada` | Worker | Na mesma transação que grava as `processadas` e a `classificacao`: não existe análise finalizada sem resultado |
| `processando` → `falhou` | Worker | Ao esgotar as tentativas do job (`attempts` com backoff) ou diante de erro não recuperável |

- Cada transição é feita pela model (`Analise.update`), condicionada aos status de origem. Por causa do `paranoid`, a model ignora análises excluídas logicamente e atualiza o `updated_at`. O número de linhas afetadas indica se a transição ocorreu.
- Se nenhuma linha for afetada, a análise já está em outro estado (ex.: finalizada por uma execução anterior, ou excluída logicamente). O worker então **descarta o job sem processar e sem lançar erro**: um erro faria o BullMQ tentar de novo.
- A transação de finalização começa pelo `UPDATE` condicional. Se nenhuma linha for afetada, ela é desfeita (rollback) antes de gravar `processadas` e `classificacao`.
- O job de uma análise usa o `id` da análise como `jobId`. O BullMQ ignora a inclusão de um job cujo id ainda existe no Redis, em qualquer estado (inclusive concluído ou com falha); por isso os jobs são removidos ao terminar (seção 9.2).

### 5.3 `imagens`

Imagens originais enviadas em uma análise.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_analise` | `UUID` | FK para `analises` |
| `nome` | `VARCHAR(150)` | Opcional; 3–150 caracteres; nome original do arquivo |
| `caminho` | `VARCHAR(2048)` | Caminho relativo do arquivo no storage |
| `coordenadas` | `GEOGRAPHY(POINT, 4326)` | Opcional; local de captura da imagem |
| `tipo_mime` | `ENUM('jpeg', 'png', 'webp')` | Detectado no upload |
| `tamanho` | `INTEGER` | Tamanho do arquivo em bytes; **CHECK** `tamanho > 0` |

- `tipo_mime` guarda o subtipo do MIME. A API converte entre o valor do enum e o tipo MIME completo (`jpeg` ↔ `image/jpeg`). JPG e JPEG são o mesmo formato (`jpeg`).

### 5.4 `processadas`

Imagens geradas pelo pipeline de pré-processamento a partir das originais. Cada imagem original gera várias processadas (seção 10).

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_imagem` | `UUID` | FK para `imagens`; imagem original |
| `caminho` | `VARCHAR(2048)` | Caminho relativo do arquivo no storage |
| `tipo_mime` | `ENUM('jpeg', 'png', 'webp')` | Padrão `'webp'` |
| `tamanho` | `INTEGER` | Tamanho do arquivo em bytes; **CHECK** `tamanho > 0` |

- A análise de uma imagem processada é obtida pela imagem original (`processadas.id_imagem` → `imagens.id_analise`).

### 5.5 `classificacoes`

Resultado da inferência do modelo sobre uma análise. Cada análise tem uma única classificação, que vale para todas as imagens incluídas nela.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `UUID` | Chave primária |
| `id_analise` | `UUID` | FK para `analises`; única entre classificações ativas |
| `classe` | `ENUM('saudavel', 'infectado')` | Rótulo atribuído pelo modelo; sem valor padrão |
| `confianca` | `FLOAT` | 0–1; probabilidade atribuída pelo modelo à classe escolhida; **CHECK** `confianca BETWEEN 0 AND 1` |
| `tempo_execucao` | `INTEGER` | Duração da inferência em milissegundos; **CHECK** `tempo_execucao >= 0` |
| `modelo_cnn` | `VARCHAR(150)` | 3–150 caracteres; nome do modelo |
| `versao_modelo` | `VARCHAR(50)` | 5–50 caracteres; versão do modelo |

- A unicidade de uma classificação por análise é garantida por índice único parcial: `UNIQUE (id_analise) WHERE deleted_at IS NULL`.
- `id_analise` também tem um índice comum: o parcial não cobre registros excluídos logicamente, e a checagem da chave estrangeira precisa de todas as linhas.

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
- Formatos aceitos: JPG, JPEG, PNG e WEBP. O formato é validado pelo conteúdo do arquivo (assinatura binária), não pelo tipo declarado pelo cliente; o formato detectado é o que vai para `imagens.tipo_mime`.
- Tamanho máximo: 5 MB por arquivo.
- Nome do campo na requisição: `images`.
- Foto de perfil: mesmos formatos, validação e tamanho máximo, com um único arquivo no campo `image`.

## 8. Storage

- Armazenamento local, em diretório reservado dentro do repositório da API. Em Docker, esse diretório é um volume, para que os arquivos sobrevivam à recriação do container.
- Os arquivos não são servidos publicamente. `getAccessUrl` aponta para uma rota autenticada da API, que só entrega arquivos do próprio usuário: as imagens podem revelar a localização da propriedade (EXIF e coordenadas).
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
- A desconexão do Redis não pode derrubar a API. O banco funciona como fila de segurança: a análise é gravada antes da inclusão do job, e uma falha ao incluí-lo apenas a mantém em `em_espera` (seção 5.2).
- **Rotina de recuperação:** quando o `mainClient` fica pronto (evento `ready`), todas as análises em `em_espera` e `processando` são incluídas novamente na fila. Como o `jobId` é o `id` da análise e os jobs terminados são removidos (seção 9.2), a inclusão é idempotente: jobs que ainda estão na fila ou em execução são ignorados, e os perdidos (ex.: Redis reiniciado sem persistência, processo encerrado no meio de um job ou antes de gravar `falhou`) voltam para a fila.

### 9.2 BullMQ

- Processamento assíncrono das análises com queues, jobs e workers.
- Cada queue e cada worker usa uma conexão Redis própria; workers duplicam a conexão recebida.
- Todas as conexões do BullMQ definem `connectionName`.
- Conexões de **workers** definem `maxRetriesPerRequest: null`, exigido pelo BullMQ.
- Conexões de **queues** definem `enableOfflineQueue: false`: com o Redis indisponível, a inclusão de um job falha imediatamente, em vez de deixar a requisição pendente, e a API aplica o fallback da seção 9.1.
- Jobs de análise são incluídos com `removeOnComplete: true` e `removeOnFail: true`. O banco é o registro oficial do resultado (status, `processadas` e `classificacao`), e um job retido no Redis impediria a rotina de recuperação (seção 9.1) de reincluir a análise.
- A queue de análises e os workers são instanciados pelo orquestrador quando o `mainClient` fica pronto. A queue não é criada sob demanda: com `enableOfflineQueue: false`, uma conexão aberta no momento da requisição ainda não estaria pronta e recusaria a inclusão do job.
- Um orquestrador de workers ativa as conexões quando o `mainClient` fica pronto (`ready`) e as encerra quando ele desconecta.

## 10. Pré-processamento de imagens (Sharp)

- Antes da inferência, as imagens de cada análise passam por um pipeline de pré-processamento com a biblioteca `sharp`.
- Os pipelines ficam em `src/shared/pipelines/`.
- O pipeline de análises simula **Data Augmentation**: gera várias cópias de cada imagem original, aplicando redimensionamento e ajustes de ruído, brilho e saturação. Cada cópia é um registro em `processadas`.
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
- Erros de bibliotecas que têm significado para o cliente são traduzidos em `AppError` por tradutores em `src/shared/errors/`. Exemplos: erros 4xx do `body-parser` (JSON malformado, corpo muito grande) e violações de constraints do banco, identificadas pelo nome da constraint (seção 4.3).
- Rotas inexistentes respondem 404 no formato de erro padrão (seção 12).
- **Logs:** um `AppError` é registrado em uma linha, com status, método, URL e mensagem, sem serializar o objeto do erro; nos 5xx, a linha inclui a causa (`cause`). Bugs são registrados com stack, método e URL. O body da requisição nunca é logado nem devolvido ao cliente, porque pode conter senha.

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
- Restauração em cascata de registros excluídos logicamente. A propagação definida na seção 4.3 vale apenas para a exclusão.
- Refresh token. Com expiração de 1 hora, o usuário precisa fazer login novamente após esse período.
- Drivers de storage em nuvem (R2, Supabase, Firebase etc.). A interface deve suportá-los, mas não é preciso implementá-los.
- Armazenamento de outros tipos de arquivo além de imagens (ex.: relatórios PDF).
- Integração com o serviço de inferência real (CNN em Python).
- Módulos de contexto, recomendação e diagramação (mapa e linha do tempo).
- Extração do banco para o `vita-database`: congelada. Os requisitos estão guardados na seção 15.

## 14. Estado atual da implementação

### Implementado

- Separação nos quatro repositórios (`vita-api`, `vita-database`, `vita-app-web`, `vita-app-mobile`). O `vita-database` está congelado (seção 15).
- Boot da API TypeScript (dockerizado), com estrutura `src/shared`, `src/modules` e `src/routes`.
- Normalização e validação das variáveis de ambiente com Zod:
  - `process.env` é lido apenas em `env.ts`; todo o código consome o objeto `env` validado.
  - Origens de CORS (`URL_WEB` e `URL_EXPO`, opcional) normalizadas para o formato do header `Origin`.
  - `DB_SSL_CA` é o caminho do arquivo da CA; exige `DB_SSL=true`, e arquivo ausente ou vazio é erro fatal no boot.
- Criação e conexão do banco PostgreSQL via Sequelize, com SSL opcional (`rejectUnauthorized: true`; CA opcional) (dockerizado no compose do `vita-api`).
- Conexão Redis com factory, `mainClient` e `retryStrategy` (dockerizado no compose do `vita-api`).
- CORS restrito às origens configuradas. Requisições sem `Origin` (apps mobile, ferramentas de teste) são aceitas.
- Tratamento de erros:
  - `AppError` com `detail` opcional e `cause` (erro original, usado apenas em log).
  - Tradução de erros 4xx de bibliotecas no formato `http-errors` (ex.: JSON malformado, corpo muito grande) em `AppError` (`mapHttpError`).
  - Handler 404 para rotas inexistentes, no formato padrão de erro.
  - `error.middleware` com respostas montadas campo a campo (nenhum objeto de erro é serializado). Erros esperados são logados em uma linha, sem o objeto (o body da requisição pode conter senha); bugs são logados com stack, método e URL.
  - Erros fatais no boot.
- Contratos HTTP tipados: `SuccessResponse`, `ErrorResponse` e a união `ApiResponse`. `AppResponse` envia apenas respostas de sucesso (status 200, 201 e 202).
- Configuração do Multer baseada em políticas e middleware de upload (1–4 imagens, formatos aceitos, limite de 5 MB, campo `images`).
- Rota de health-check.

### Em andamento

- Dockerização de todos os repositórios, exceto o `vita-database` (congelado).
- Atualização do `database/schema.sql` do `vita-api` para a versão deste documento (seções 4 e 5).
- Revisão do health-check (status por serviço, checagens em paralelo) e padrão de controllers.
- Módulo de storage e salvamento dos uploads em `storage/uploads/`.
- Filas, workers e orquestrador do BullMQ.
- Pipeline de pré-processamento com Sharp e inferência simulada.

### Congelado

- Extração do banco para o `vita-database` (seção 15).

## 15. Tarefa congelada: extração do banco para o `vita-database`

Em 24/10/2026, depois de avaliar a demanda e o tamanho da tarefa, o time decidiu congelar a extração do banco para o `vita-database`. Enquanto ela estiver congelada, o `vita-api` cuida do banco (seção 4.1). Os requisitos abaixo continuam definidos e passam a valer na retomada; até lá, não são pendências.

As regras do schema (seção 4.3) valem nos dois regimes. Na retomada, muda onde ficam o schema, as models e os hooks, e como o schema chega aos bancos.

### 15.1 Repositório

- O `vita-database` contém as migrations, as models e os scripts de criação e alteração do banco. Stack: PostgreSQL + PostGIS, TypeScript e Sequelize.
- Dockerização: um compose de desenvolvimento com PostgreSQL e PostGIS para os testes do pacote.
- CI/CD com GitHub Actions, Husky e ESLint, como nos demais repositórios (seção 1).

### 15.2 Migrations e `schema.sql`

- As migrations definem o schema; as models devem espelhá-las.
- O `database/schema.sql` fica no `vita-database` e é um retrato do schema, não uma fonte: serve de base para as primeiras migrations e, depois que elas existirem, é regerado a partir do banco migrado (`pg_dump --schema-only`), nunca editado à mão. A partir daí, nenhum banco (inclusive o de desenvolvimento da API) recebe o schema pelo `schema.sql`, apenas pelo comando de migrations do pacote.
- O `schema.sql` é regerado no mesmo pull request de cada migration nova, a partir de um banco limpo e recém-migrado, com o `pg_dump` da imagem de referência (seção 1.1) e uma `--restrict-key` fixa. Sem a chave fixa, o `pg_dump` grava uma linha `\restrict` com chave aleatória a cada execução, e o arquivo apareceria alterado em todo pull request. Os `COMMENT ON` com os motivos das decisões (seção 4.3) ficam nas migrations.
- A tabela de controle das migrations mantém o nome padrão do Umzug/Sequelize (`SequelizeMeta`, coluna `name`). Por ser infraestrutura, é exceção à convenção da seção 2.
- Nas migrations, chaves estrangeiras são criadas com `addConstraint` (tipo `foreign key`, com nome explícito): o `references` dentro do `createTable` faz o PostgreSQL gerar um nome automático, fora do padrão da seção 4.3.
- Em produção, o administrador do banco cria a extensão PostGIS antes de rodar as migrations. A primeira migration usa `CREATE EXTENSION IF NOT EXISTS postgis`, que falha sem privilégio de superusuário quando a extensão não existe.

### 15.3 Pacote

- As models são distribuídas como pacote via GitHub Packages (`@vita-projeto-integrador/vita-database`) e instaladas pela API. O pacote também fornece o comando que aplica as migrations e a checagem de schema usada pela API.
- Os hooks de exclusão lógica (seção 4.3) ficam nas models do pacote, e é o pacote que faz as recusas.
- O pacote exporta os nomes de constraints e índices como constantes tipadas. Um teste do pacote confirma, contra um banco migrado, que todos os nomes exportados existem.
- O comando de migrations (`vita-db`) recebe o banco por `MIGRATION_DATABASE_URL`. No deploy, essa variável e as variáveis `DB_*` da API (seção 4.2) apontam para o mesmo banco.
- Fora do escopo do pacote: SSL. O comando de migrations (`vita-db`) e os testes do pacote não suportam nem testam SSL. Consequência: se o banco de produção exigir SSL, as migrations não rodam contra ele. O SSL continua valendo para a conexão da API (seção 4.2).

### 15.4 API depois da extração

- O acesso ao banco é feito via Sequelize, usando as models do pacote `@vita-projeto-integrador/vita-database`, instalado do GitHub Packages.
- A responsabilidade da API sobre o banco é instanciar a conexão e, no boot, verificar se todas as migrations do pacote instalado foram aplicadas. A verificação é somente leitura: a API nunca cria nem altera o schema.
- Falha de conexão e schema desatualizado (migrations pendentes) são erros fatais. Na retomada, o schema desatualizado volta à categoria "Erro fatal" da seção 11.

### 15.5 Pontos a resolver na retomada

- As primeiras migrations partem do `database/schema.sql` do `vita-api` no momento da retomada. Se ele mudar durante o congelamento, as migrations e o guia de implementação do `vita-database` precisam acompanhar a mudança.
- Bancos criados pelo `schema.sql` não têm a tabela `SequelizeMeta`, e o comando de migrations tentaria criar tabelas que já existem. A decidir: recriar esses bancos pelas migrations ou registrar as migrations iniciais na `SequelizeMeta` sem executá-las (baseline). O baseline só é seguro se a estrutura do banco for idêntica à gerada pelas migrations, conferida por `pg_dump --schema-only`.
- Depois que a API passar a usar o pacote, saem do `vita-api` o `schema.sql`, as models e os hooks de exclusão, e sai deste documento a seção 4.1.