-- =====================================================================
-- VITA: schema do banco (PostgreSQL 17 + PostGIS)
--
-- Fonte do schema enquanto a extração do banco para o vita-database
-- estiver congelada (requisitos, seções 4 e 15). Editado à mão; as
-- models da API espelham este arquivo.
--
-- Pré-condição: banco vazio, com a extensão postgis instalada.
-- Em desenvolvimento, a imagem postgis/postgis cria a extensão no
-- POSTGRES_DB na primeira subida; em produção, o administrador do banco
-- a cria (CREATE EXTENSION postgis exige superusuário).
--
-- Aplicar (a partir da pasta do docker-compose.yml):
--   docker compose exec postgres psql -U <DB_USER> -d <DB_NAME> -v ON_ERROR_STOP=1 -f /database/schema.sql
--
-- Tudo roda em uma transação: se algo falhar, nada é criado.
-- Não é idempotente de propósito: rodar duas vezes falha com "já existe".
-- Sem migrations, uma mudança neste arquivo só chega a um banco
-- existente recriando o banco (os dados são perdidos).
--
-- Os motivos das decisões ficam em COMMENT ON: são gravados no banco,
-- preservados pelo pg_dump e têm os mesmos textos das migrations do
-- vita-database.
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
-- Tipos ENUM com o nome que o Sequelize gera: enum_<tabela>_<coluna>
CREATE TYPE enum_usuarios_perfil AS ENUM ('produtor', 'estudante', 'outro');

CREATE TABLE usuarios (
    id              uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            varchar(150)          NOT NULL,
    email           varchar(250)          NOT NULL,
    senha_hash      varchar(255)          NOT NULL,
    telefone        varchar(15),
    data_nascimento date,
    perfil          enum_usuarios_perfil  NOT NULL DEFAULT 'outro',
    endereco        varchar(255),
    cnpj            varchar(14),
    cpf             varchar(11),
    faculdade       varchar(150),
    curso           varchar(150),
    foto_perfil     varchar(2048),
    created_at      timestamptz           NOT NULL DEFAULT now(),
    updated_at      timestamptz           NOT NULL DEFAULT now(),
    deleted_at      timestamptz,

    CONSTRAINT usuarios_email_minusculo_ck CHECK (email = lower(email)),
    -- Colunas opcionais nulas passam: um CHECK só recusa quando o resultado é falso
    CONSTRAINT usuarios_telefone_ck CHECK (telefone ~ '^[0-9]{10,15}$'),
    CONSTRAINT usuarios_cnpj_ck     CHECK (cnpj ~ '^[0-9]{14}$'),
    CONSTRAINT usuarios_cpf_ck      CHECK (cpf ~ '^[0-9]{11}$')
);

CREATE UNIQUE INDEX usuarios_email_ativo_uq
    ON usuarios (email)
    WHERE deleted_at IS NULL;

COMMENT ON CONSTRAINT usuarios_email_minusculo_ck ON usuarios IS
    'A API normaliza o e-mail; o banco garante a normalização, da qual o índice único depende.';
COMMENT ON INDEX usuarios_email_ativo_uq IS
    'E-mail único só entre contas ativas: a exclusão lógica libera o e-mail.';


-- ---------------------------------------------------------------------
-- analises (usuarios 1-N analises)
-- ---------------------------------------------------------------------
CREATE TYPE enum_analises_status AS ENUM ('em_espera', 'processando', 'finalizada', 'falhou');

CREATE TABLE analises (
    id          uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario  uuid                  NOT NULL,
    status      enum_analises_status  NOT NULL DEFAULT 'em_espera',
    coordenadas geography(Point, 4326),
    created_at  timestamptz           NOT NULL DEFAULT now(),
    updated_at  timestamptz           NOT NULL DEFAULT now(),
    deleted_at  timestamptz,

    -- RESTRICT: nada é apagado fisicamente; a exclusão lógica propaga pelos hooks das models
    CONSTRAINT analises_usuario_fk
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE RESTRICT
);

-- O PostgreSQL não cria índice em chave estrangeira automaticamente
CREATE INDEX analises_id_usuario_idx  ON analises (id_usuario);
-- Sem o índice espacial, toda consulta por distância varre a tabela inteira
CREATE INDEX analises_coordenadas_gix ON analises USING GIST (coordenadas);

COMMENT ON COLUMN analises.status IS
    'em_espera -> processando -> finalizada | falhou. Transições feitas pela API e pelo worker.';
COMMENT ON COLUMN analises.coordenadas IS
    'Reservada para o módulo de diagramação (mapa). Ordem (longitude, latitude).';


-- ---------------------------------------------------------------------
-- imagens (analises 1-N imagens)
-- ---------------------------------------------------------------------
CREATE TYPE enum_imagens_tipo_mime AS ENUM ('jpeg', 'png', 'webp');

CREATE TABLE imagens (
    id          uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
    id_analise  uuid                    NOT NULL,
    nome        varchar(150),
    caminho     varchar(2048)           NOT NULL,
    coordenadas geography(Point, 4326),
    tipo_mime   enum_imagens_tipo_mime  NOT NULL,
    tamanho     integer                 NOT NULL,
    created_at  timestamptz             NOT NULL DEFAULT now(),
    updated_at  timestamptz             NOT NULL DEFAULT now(),
    deleted_at  timestamptz,

    -- Regra de valor garantida pelo banco: vale também para gravações sem DTO (workers)
    CONSTRAINT imagens_tamanho_ck CHECK (tamanho > 0),
    CONSTRAINT imagens_analise_fk
        FOREIGN KEY (id_analise) REFERENCES analises (id) ON DELETE RESTRICT
);

CREATE INDEX imagens_id_analise_idx  ON imagens (id_analise);
CREATE INDEX imagens_coordenadas_gix ON imagens USING GIST (coordenadas);

COMMENT ON COLUMN imagens.tipo_mime IS
    'Subtipo do MIME, detectado pelo conteúdo do arquivo. A API converte (jpeg <-> image/jpeg).';
COMMENT ON COLUMN imagens.coordenadas IS
    'Local de captura. Ordem (longitude, latitude), como no GeoJSON.';


-- ---------------------------------------------------------------------
-- processadas (imagens 1-N processadas)
-- ---------------------------------------------------------------------
CREATE TYPE enum_processadas_tipo_mime AS ENUM ('jpeg', 'png', 'webp');

CREATE TABLE processadas (
    id          uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
    id_imagem   uuid                        NOT NULL,
    caminho     varchar(2048)               NOT NULL,
    tipo_mime   enum_processadas_tipo_mime  NOT NULL DEFAULT 'webp',
    tamanho     integer                     NOT NULL,
    created_at  timestamptz                 NOT NULL DEFAULT now(),
    updated_at  timestamptz                 NOT NULL DEFAULT now(),
    deleted_at  timestamptz,

    CONSTRAINT processadas_tamanho_ck CHECK (tamanho > 0),
    CONSTRAINT processadas_imagem_fk
        FOREIGN KEY (id_imagem) REFERENCES imagens (id) ON DELETE RESTRICT
);

CREATE INDEX processadas_id_imagem_idx ON processadas (id_imagem);

COMMENT ON TABLE processadas IS
    'Cópias geradas pelo pipeline. A análise é obtida pela imagem original (id_imagem -> imagens.id_analise).';


-- ---------------------------------------------------------------------
-- classificacoes (analises 1-1 classificacoes)
-- ---------------------------------------------------------------------
CREATE TYPE enum_classificacoes_classe AS ENUM ('saudavel', 'infectado');

CREATE TABLE classificacoes (
    id             uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
    id_analise     uuid                        NOT NULL,
    classe         enum_classificacoes_classe  NOT NULL,
    confianca      double precision            NOT NULL,
    tempo_execucao integer                     NOT NULL,
    modelo_cnn     varchar(150)                NOT NULL,
    versao_modelo  varchar(50)                 NOT NULL,
    created_at     timestamptz                 NOT NULL DEFAULT now(),
    updated_at     timestamptz                 NOT NULL DEFAULT now(),
    deleted_at     timestamptz,

    CONSTRAINT classificacoes_confianca_ck      CHECK (confianca BETWEEN 0 AND 1),
    CONSTRAINT classificacoes_tempo_execucao_ck CHECK (tempo_execucao >= 0),
    CONSTRAINT classificacoes_analise_fk
        FOREIGN KEY (id_analise) REFERENCES analises (id) ON DELETE RESTRICT
);

-- Garante o 1-1 no banco (sem isso, hasOne é só convenção do ORM)
CREATE UNIQUE INDEX classificacoes_analise_ativa_uq
    ON classificacoes (id_analise)
    WHERE deleted_at IS NULL;

CREATE INDEX classificacoes_id_analise_idx ON classificacoes (id_analise);

COMMENT ON INDEX classificacoes_analise_ativa_uq IS
    'Uma classificação ativa por análise; a exclusão lógica permite reclassificar.';
COMMENT ON INDEX classificacoes_id_analise_idx IS
    'O índice parcial não cobre linhas excluídas; a checagem da chave estrangeira precisa de todas.';

COMMIT;