-- =====================================================================
-- VITA: schema inicial (PostgreSQL 17 + PostGIS)
--
-- Pré-condição: banco já provisionado, com a extensão postgis instalada
-- (a imagem postgis/postgis faz isso no POSTGRES_DB na primeira subida).
--
-- Aplicar (a partir da pasta do docker-compose.yml):
--   docker compose exec postgres psql -U <DB_USER> -d <DB_NAME> -v ON_ERROR_STOP=1 -f /database/schema.sql
--
-- Tudo roda em uma transação: se algo falhar, nada é criado.
-- Não é idempotente de propósito: rodar duas vezes falha com "já existe".
-- =====================================================================

BEGIN;

-- Fail-fast: o schema depende do tipo geography do PostGIS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        RAISE EXCEPTION 'Extensão postgis ausente neste banco. Provisione antes de aplicar o schema.';
    END IF;
END
$$;


-- ---------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            varchar(255)  NOT NULL,
    email           varchar(255)  NOT NULL,
    senha           varchar(255)  NOT NULL,
    telefone        varchar(255),
    data_nascimento date,
    tipo_acesso     varchar(20)   NOT NULL DEFAULT 'produtor',
    endereco        varchar(255),
    cnpj            varchar(255),
    faculdade       varchar(255),
    curso           varchar(255),
    "createdAt"     timestamptz   NOT NULL DEFAULT now(),
    "updatedAt"     timestamptz   NOT NULL DEFAULT now(),
    "deletedAt"     timestamptz,

    CONSTRAINT usuarios_tipo_acesso_ck CHECK (tipo_acesso IN ('produtor', 'estudante')),
    -- a normalização é responsabilidade da API (DTO); o banco só garante que ela aconteceu
    CONSTRAINT usuarios_email_minusculo_ck CHECK (email = lower(email))
);

-- Unicidade apenas entre contas ativas: o e-mail é liberado após deleção lógica
CREATE UNIQUE INDEX usuarios_email_ativo_uq
    ON usuarios (email)
    WHERE "deletedAt" IS NULL;


-- ---------------------------------------------------------------------
-- analises (usuarios 1-N analises)
-- ---------------------------------------------------------------------
CREATE TABLE analises (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario  uuid         NOT NULL,
    status      varchar(20)  NOT NULL DEFAULT 'pendente',
    "createdAt" timestamptz  NOT NULL DEFAULT now(),
    "updatedAt" timestamptz  NOT NULL DEFAULT now(),
    "deletedAt" timestamptz,

    CONSTRAINT analises_usuario_fk
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT analises_status_ck
        CHECK (status IN ('finalizada', 'pendente', 'em_fila', 'classificando', 'cancelada'))
);

-- Postgres NÃO indexa FKs automaticamente (o InnoDB do MySQL indexava)
CREATE INDEX analises_id_usuario_idx ON analises (id_usuario);


-- ---------------------------------------------------------------------
-- imagens (analises 1-N imagens)
-- ---------------------------------------------------------------------
CREATE TABLE imagens (
    id          uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
    id_analise  uuid                   NOT NULL,
    nome        varchar(255)           NOT NULL,
    caminho     varchar(255)           NOT NULL,
    -- geography: distâncias e raios calculados diretamente em metros
    coordenadas geography(Point, 4326),
    tipo_mime   varchar(20)            NOT NULL,
    tamanho     integer                NOT NULL,
    "createdAt" timestamptz            NOT NULL DEFAULT now(),
    "updatedAt" timestamptz            NOT NULL DEFAULT now(),
    "deletedAt" timestamptz,

    CONSTRAINT imagens_analise_fk
        FOREIGN KEY (id_analise) REFERENCES analises (id) ON DELETE CASCADE,
    CONSTRAINT imagens_tipo_mime_ck
        CHECK (tipo_mime IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')),
    CONSTRAINT imagens_tamanho_ck CHECK (tamanho > 0)
);

CREATE INDEX imagens_id_analise_idx  ON imagens (id_analise);
CREATE INDEX imagens_coordenadas_gix ON imagens USING GIST (coordenadas);


-- ---------------------------------------------------------------------
-- processadas (imagens 1-N processadas)
-- ---------------------------------------------------------------------
CREATE TABLE processadas (
    id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    id_imagem   uuid          NOT NULL,
    nome        varchar(255)  NOT NULL,
    caminho     varchar(255)  NOT NULL,
    tipo_mime   varchar(20)   NOT NULL,
    tamanho     integer       NOT NULL,
    "createdAt" timestamptz   NOT NULL DEFAULT now(),
    "updatedAt" timestamptz   NOT NULL DEFAULT now(),
    "deletedAt" timestamptz,

    CONSTRAINT processadas_imagem_fk
        FOREIGN KEY (id_imagem) REFERENCES imagens (id) ON DELETE CASCADE,
    CONSTRAINT processadas_tipo_mime_ck
        CHECK (tipo_mime IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')),
    CONSTRAINT processadas_tamanho_ck CHECK (tamanho > 0)
);

CREATE INDEX processadas_id_imagem_idx ON processadas (id_imagem);


-- ---------------------------------------------------------------------
-- classificacoes (analises 1-1 classificacoes)
-- ---------------------------------------------------------------------
CREATE TABLE classificacoes (
    id             uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
    id_analise     uuid              NOT NULL,
    tempo_execucao integer,
    classe         integer           NOT NULL,
    confianca      double precision  NOT NULL,
    modelo_cnn     varchar(255)      NOT NULL,
    "createdAt"    timestamptz       NOT NULL DEFAULT now(),
    "updatedAt"    timestamptz       NOT NULL DEFAULT now(),
    "deletedAt"    timestamptz,

    CONSTRAINT classificacoes_analise_fk
        FOREIGN KEY (id_analise) REFERENCES analises (id) ON DELETE CASCADE,
    CONSTRAINT classificacoes_confianca_ck CHECK (confianca BETWEEN 0 AND 1),
    CONSTRAINT classificacoes_tempo_execucao_ck CHECK (tempo_execucao >= 0)
);

-- Garante o 1-1 no banco (sem isso, hasOne é só convenção do ORM).
-- Parcial: permite reclassificar após deleção lógica da classificação anterior.
CREATE UNIQUE INDEX classificacoes_analise_ativa_uq
    ON classificacoes (id_analise)
    WHERE "deletedAt" IS NULL;

-- O índice parcial não cobre linhas deletadas; a checagem da FK precisa de todas
CREATE INDEX classificacoes_id_analise_idx ON classificacoes (id_analise);

COMMIT;