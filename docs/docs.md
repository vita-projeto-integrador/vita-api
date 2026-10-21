# Requisitos

Este documento contextualiza o desenvolvimento do projeto VITA, estabelecendo regras e objetivos que devem ser estritamente seguidos pelos desenvolvedores e assistentes de IA. 

Este documento prevalece sobre os demais anexos de contextos/regras. Em casos de conflito, este arquivo deve ser utilizado como base.

Deve ser considerado o andamento dos requisitos para a API TypeScript (transição da antiga JavaScript);

## Legenda

- **[implementado]** : requisito já existe e funciona no projeto;
- **[em andamento]** : requisito está sendo desenvolvido;
- **[planejado]** : requisito ainda não foi iniciado;
- **[em aberto]** : requisito ainda está sendo discutido, pode mudar;
- Colunas das tabelas do banco não marcadas como "opcionais" devem ser consideradas obrigatórias;

## Geral

- **[implementado]** Os artefatos de software do projeto devem ser modularizados nos repositórios `vita-api`, `vita-database`, `vita-app-web` e `vita-app-mobile`;
- **[em andamento]** Todos os repositórios de software devem ser dockerizados;
- **[planejado]** Todos os repositórios de software devem ter implementações de workflow de CI/CD usando Github Workflows, husky, eslint, entre outras ferramentas;
- **[implementado]** `vita-api` : Rest API em ambiente Node com o framework Express e a linguagem TypeScript;
- **[em andamento]** `vita-database` : banco de dados PostgreSQL com extensão PostGIS;
- **[implementado]** `vita-app-web` : front-end para web na linguagem TypeScript com framework Next e biblioteca React;
- **[implementado]** `vita-app-mobile` : front-end para mobile na linguagem TypeScript com framework Expo e biblioteca React-Native; 

## API

- **[implementado]** A API deve seguir e expandir uma estrutura de pastas básica a partir de `src/`: `shared/`, `modules/`, `routes/`;
- **[planejado]** A API deve validar as requisições com a biblioteca Zod;
- **[planejado]** A API deve aplicar o conceito de DTOs inferindo as validações Zod;
- A API também deve usar ORM Sequelize para interagir com o banco;

## Banco de dados

**[planejado]**

- O repositório database deve usar TypeScript e ORM Sequelize;
- O repositório database cria `migrations` que as `models` devem espelhar;
- A API instala as `models` em forma de `package` disponibilizado pelo repositório `vita-database` através de GitHub Packages;
- O repositório database também carrega `migrations` e `scripts` para criar e alterar o banco de dados;
- A responsabilidade da API sobre o banco é apenas de instanciar a conexão;
- A conexão com o banco de dados é essencial e deve lançar erro fatal;
- Nenhum registro é apagado do banco - a Rest API usa `paranoid` para aplicar soft delete;
- `timeStamps` : `created_at`, `updated_at`, `deleted_at` devem existir em todas as tabelas; 
- Nomes em `snake_case`;
- `paranoid: true` com efeito de propagação para registros filhos (cascata);
- `underscored: true`
- PostGIS e GeoJSON utiliza `(lon, lat)`;

## Fora do escopo 

- A limpeza do banco (exclusão real dos registros) não precisa entrar no escopo do projeto;

## `usuarios`

**[planejado]**

- Módulo das contas dos usuários do sistema;
- Entidade do banco que armazena dados cadastrais dos usuários;
- `id`: `string UUID` chave primária;
- `nome` : `string` de 3-150 caracteres, obrigatório;
- `email` : `string lowercase` de 3-250 caracteres, obrigatório;
- `senha_hash`: DTO de entrada - `string` de 8-78 caracteres com no mínimo 1 maíusculo, 1 minúsculo, 1 número e 1 especial; Coluna do banco - `string` de 1-255 caracteres, obrigatório;
- `telefone` : `string` de 10-15 dígitos, sem pontuação, opcional;
- `data_nascimento` : `date` opcional;
- `perfil` : `enum('produtor','estudante','outro')`, `default('outro')`, ainda não têm função definida
- `endereco` : `string` de 5-255 caracteres contendo o endereço completo, relacionado ao perfil `produtor`, opcional;
- `cnpj`: `string` de 14 dígitos, sem pontuação, relacionado ao perfil `produtor`, opcional;
- `cpf`: `string` de 11 dígitos, sem pontuação, relacionado ao perfil `produtor`, opcional;
- `faculdade`: `string` de 3-150 caracteres, relacionado ao perfil `estudante`, opcional;
- `curso` : `string`de 3-150 caracteres, relacionado ao perfil `estudante`, opcional;
- `foto_perfil` : `string` de 0-2048 caracteres, contém URL/caminho da imagem, opcional;
- Todos os campos condicionados a perfil possuem validação OPCIONAL por enquanto;
- Índice parcial único `UNIQUE (email) WHERE deleted_at IS NULL` para garantir unicidade de usuários ativos;

## `analises`
**[planejado]**
- Módulo das solicitações de processamento de imagens que o usuário envia ao sistema;
- Entidade do banco que representa o grupo de fotos enviadas em forma de solicitação;
- `id`: `string UUID` chave primária;
- `id_usuario` : chave estrangeira referente ao `usuario` que solicitou a análise;
- `status` : `enum('em_espera', 'pendente', 'reenfileirada' ,'finalizada', 'cancelada')`, `default('em espera')`;
- Análises são criadas com status `em espera`
- No contexto do BullMQ, quando passam da `queue` para o `worker`, recebem o status `pendente`;
- O status `reefileirada` aparece em análises que foram iniciadas offline, após serem salvas localmente e inseridas novamente na fila do BullMQ;
- Análises que falharam em todas as tentativas ou com erros fatais terminam com status `cancelada`, se forem bem-sucedidas terminam com `finalizada`;

## `imagens`
**[planejado]**
- Módulo das fotos que o usuário captura para enviar em uma análise;
- Entidade do banco que armazena o caminho para as imagens usadas em análises;
- `id`: `string UUID` chave primária;
- `id_analise` : chave estrangeira referente à `analise` da qual as fotos pertencem;
- `nome` : `string` de 3-150 caracteres com o nome original do arquivo, opcional;
- `caminho` : `string` de 1-2048 caracteres, contém URL/caminho da imagem;
- `coordenadas` : `GEOGRAPHY(POINT, 4326)` - PostGIS - contendo coordenadas individuais da foto capturada, opcional;
- `tipo_mime` : `enum('image/jpeg', 'image/png', 'image/webp')`, `default('image/webp')`;
- `tamanho`: `integer` contendo tamanho do arquivo de imagem em bytes;

## `processadas`
**[planejado]**
- Módulo das imagens otimizadas que o sistema gera a partir das fotos originais;
- Entidade do banco que armazena o caminho para as imagens processadas após uma análise;
- `id`: `string UUID` chave primária;
- `id_analise` : chave estrangeira referente à `analise` da qual as imagens pertencem;
- `id_imagem`: chave estrangeira referente à `imagem` original;
- `nome` : `string` de 3-150 caracteres com o nome original do arquivo, opcional;
- `caminho` : `string` de 1-2048 caracteres, contém URL/caminho da imagem;
- `tipo_mime` : `enum('image/jpeg', 'image/png', 'image/webp')`, `default('image/webp')`;
- `tamanho`: `integer` contendo tamanho do arquivo de imagem em bytes;

## `classificacoes`
**[planejado]**
- Módulo dos resultados de uma análise de imagens;
- Entidade do banco que armazena os números da inferência do modelo de rede neural sobre as imagens de uma análise;
- `id`: `string UUID` chave primária;
- `id_analise` : chave estrangeira referente à `analise` da qual as classificações pertencem;
- `tempo_execucao` : `integer` com o tempo de duração do processo em milissegundos;
- `classe`: `enum('saudavel','baixo','medio','alto','infectado').default('saudavel')` indicando probabilidade de infecção ou de ser fruta saudável;
- `confianca` : `float` indicando a probabilidade da classificação do modelo de rede neural;
- `modelo_cnn` : `string` de 3-150 caracteres com o nome do modelo utilizado na classificação;
- `versao` : `string` de 5-50 caracteres com a versão do modelo de rede neural;
- Atualmente a inferência é simulada com Sharp;

## Autenticação

- **[planejado]** Autenticação de usuários (`login`, `logout`) deve utilizar Json Web Token;
- **[planejado]** O payload do usuário logado (injetado no token JWT) deve carregar `id`, `nome` e `email`;
- **[planejado]** O middleware de autenticação deve checar se o usuário existe ou está ativo;
- **[planejado]** Quando o usuário é deslogado ou desativado, o token JWT atual deve ser invalidado;

## Upload de imagens

- **[implementado]** Uma análise pode incluir de **1-4 imagens**;
- **[planejado]** As imagens da análise podem ser obtidas de **2 origens**: captura através de câmera digital (ex.: celulares) OU do armazenamento interno do dispositivo (ex.: galeria);
- **[implementado]** Para upload, são aceitos apenas os formatos de imagem: *jpg, jpeg, png e webp*;
- **[implementado]** O tamanho máximo para upload de cada arquivo de imagem é de **5 MB**;
- **[implementado]** O nome exato do campo que inclui as imagens na requisição HTTP deve ser `images`;
- **[planejado]** As mesmas regras de formato, tamanho e campo valem para imagens de perfil de usuário;
- **[em andamento]** Imagens de upload devem ser salvas em `storage/uploads/`;

## Tratamento de Erros

- Todo erro na API deve ser capturado, logado, tratado e lançado (ou não);
- **[planejado]** `controllers` devem ser os responsáveis por capturar os erros de camadas superiores (`services`, etc);
- **[planejado]** `error.middleware` deve ser o último handler, responsável por tratar os erros de diferentes serviços na API;
- **[implementado]** `AppErrors` : classe de erros de negócio que não quebram a API, mas retornam respostas HTTP 400-500;
- **[implementado]** **Bugs** : erros não capturados em última instância pelo `error.middleware`, devolvem sempre `HTTP 500 Internal Server Error`;
- **[implementado]** **Erros fatais**: erros em serviços essenciais que quebram a API, devem ser lançados instantaneamente (ex.: boot, conexão com banco, etc);

## HTTP
**[implementado]**
- Segue abaixo o formato padrão do JSON para respostas HTTP da API:
```
{
    "success": boolean,
    "message": string,
    "data": T
}
```
**[implementado]**
- Segue abaixo o formato padrão do JSON para respostas HTTP paginadas:
```
data: {
    "items": T[],
    "total": number,
    "page": number,
    "limit": number
    }
``` 

## Storage 

**[em andamento]**

- Atualmente o armazenamento de arquivos deve utilizar a técnica de **storage local** - diretório reservado dentro do repositório;
- Atualmente o storage deve servir para imagens, posteriormente será expandido para arquivos (ex.: relatórios PDF);
- O storage deve ser adaptado para permitir driver de armazenamento local e, posteriormente, de serviços em nuvem (ex.: R2, Supabase, Firebase, etc);
- A estrutura do storage deve seguir `storage/` : `uploads/`, `processed/`, `temp/`;
- `storage/uploads` armazena fotos para análise e para perfil do usuário;
- `storage/processed` armazena imagens processadas durante/após análises;
- `storage/temp` armazena arquivos para acesso rápido temporário;
- Deve existir uma rotina de limpeza de `storage/temp`;
- O storage deve ser manipulado através de uma interface com métodos mínimos `put`, `get`, `delete` e `getAccessUrl`;
- O escopo atual deve contar com o caminho padrão para imagens de análises: `storage/uploads/userId/analysisId/`, `storage/processed/userId/analysisId/`;
- O escopo atual deve contar com o caminho padrão para imagens de perfil: `storage/uploads/userId/profile/`;

## Redis

- Utiliza a biblioteca `ioredis`;
- Atualmente utilizado para suportar e otimizar processamento assíncrono de imagens em conjunto com `BullMQ`;
- **[em andamento]** Deve ser dockerizado com suas respectivas credenciais e estrutura;
- **[planejado]** Desconexão do Redis não deve quebrar a API - deve ser coberto por um plano para salvar análises no storage local, reenfileirando-as quando Redis reconectar;
- **[implementado]** Deve ser configurado com padrão `factory` para criar diferentes instâncias de conexão;
- **[implementado]** Estado de conexão do Redis deve ser gerenciado por um cliente principal `mainClient`;
- **[planejado]** `mainClient` deve usar `listeners` exclusivos que controlam as demais conexões (ex.: `queues` e `workers` do BullMQ);
- **[implementado]** Todas as conexões usam `retryStrategy` com loops de **5-15 segundos** para tentar reconectar-se ao serviço;

## BullMQ

**[em andamento]**

- Utilizado para estruturar um fluxo assíncrono e veloz de processamento usando filas (`queues`), tarefas (`jobs`) e processadores (`workers`);
- Cada `queue` e `worker` depende de uma conexão Redis para funcionar (`workers` duplicam a conexão recebida);
- Conexões para agentes do BullMQ devem informar os parâmetros personalizados `maxRetriesPerRequest` e `connectionName`;
- `queues` não precisam ser instanciadas com o boot da API, elas funcionam por demanda;
- `workers` devem ser instanciados assim que possível, pois ficam "escutando" `jobs`;
- Deve existir um arquivo **orquestrador de workers** para ativar as conexões assim que o cliente Redis principal `mainClient` for instanciado com sucesso e fechar conexões quando `mainClient` for desconectado;

## Sharp

**[em andamento]**

- Antes de passar pela inferência classificador de modelo de rede neural, imagens de análises devem ser pré-processadas com a biblioteca `sharp`;
- Os processamentos com `sharp` devem ser organizados em `src/shared/pipelines/`;
- A pipeline de pré-processamento para análises deve simular **Data Augmentation** aplicando operações de redimensionamento e ajustes de ruído, brilho e saturação em cópias das imagens originais;
- A saída da pipeline de pré-processamento deve ser um conjunto de imagens comprimidas em formato `.webp` e no padrão de cores `SRGB`;
- As imagens devem ser manipuladas em formato de `buffer` durante o processamento das análises;