# Requisitos 

## Geral

- Os artefatos de software projeto deve ser modularizado nos repositórios `vita-api`, `vita-database`, `vita-app-web` e `vita-app-mobile`;
- Todos os repositórios de software devem ser dockerizados;
- Todos os repositórios de software devem ter implementações de workflow de CI/CD usando Github Workflows, husky, eslint, entre outras ferramentas;
- `vita-api` : Rest API deve usar o ambiente Node com o framework Express e a linguagem TypeScript;
- A API deve seguir e expandir uma estrutura de pastas básica a partir de `src/`: `config/`, `modules/`, `middlewares/`, `routes/`, `utils/`;
- A API deve validar as requisições com a biblioteca Zod;
- A API deve aplicar o conceito de DTOs inferindo as validações Zod;
- `vita-database` : banco de dados PostgreSQL com extensão PostGIS;
- O repositório database deve usar TypeScript e ORM Sequelize;
- A API também deve usar ORM Sequelize para interagir com o banco;
- O repositório database define as `models` como fonte de verdade e as exporta para a API em forma de `package`;
- O repositório database também carrega `migrations` e `scripts` para criar e alterar o banco de dados;
- `vita-app-web` : front-end para web na linguagem TypeScript com framework Next e biblioteca React;
- `vita-app-mobile` : front-end para mobile na linguagem TypeScript com framework Expo e biblioteca React-Native; 
- Nenhum registro é apagado do banco - a Rest API usa `paranoid` para aplicar soft delete;
- A limpeza do banco (exclusão real dos registros) não precisa entrar no escopo do projeto;
- `timeStamps` : `created_at`, `updated_at`, `deleted_at` devem existir em todas as tabelas;

## `usuarios`

- Módulo das contas dos usuários do sistema;
- Entidade do banco que armazena dados cadastrais dos usuários;
- `nome` : `string` de 3-150 caracteres, obrigatório;
- `email` : `string lowercase` de 3-250 caracteres, obrigatório;
- `senha`: `string` de 8-128 caracteres com no mínimo 1 maíusculo, 1 minúsculo, 1 número e 1 especial, obrigatório;
- `telefone` : `string` de 10-15 dígitos, sem pontuação, opcional;
- `data_nascimento` : `date` opcional;
- `perfil` : `enum('produtor','estudante','outro')`, `default('outro')`, ainda não têm função definida
- `endereco` : `string` de 5-255 caracteres contendo o endereço completo, relacionado ao perfil `produtor`, opcional;
- `cnpj`: `string` de 14 dígitos, sem pontuação, relacionado ao perfil `produtor`, opcional;
- `faculdade`: `string` de 3-150 caracteres, relacionado ao perfil `estudante`, opcional;
- `curso` : `string`de 3-150 caracteres, relacionado ao perfil `estudante`, opcional;
- `foto_perfil` : `string` de 0-2048 caracteres, contém URL/caminho da imagem, opcional;

## Autenticação
- Autenticação de usuários (`login`, `logout`) deve utilizar Json Web Token;
- O payload do usuário logado (injetado no token JWT) deve carregar `id`, `nome` e `email`;
- O middleware de autenticação deve checar se o usuário existe ou está ativo;
- Quando o usuário é deslogado ou desativado, o token JWT atual deve ser invalidado;

## `analises`

- Módulo das solicitações de processamento de imagens que o usuário envia ao sistema;
- Entidade do banco que representa o grupo de fotos enviadas em forma de solicitação;
- `id_usuario` : chave estrangeira referente ao `usuario` que solicitou a análise;
- `status` : `enum('em espera', 'pendente', 'reenfileirada' ,'finalizada', 'cancelada')`, `default('em espera')`;
- Análises são criadas com status `em espera`
- No contexto do BullMQ, quando passam da `queue` para o `worker`, recebem o status `pendente`;
- O status `reefileirada` aparece em análises que foram iniciadas offline, após serem salvas localmente e inseridas novamente na fila do BullMQ;
- Análises que falharam em todas as tentativas ou com erros fatais terminam com status `cancelada`, se forem bem-sucedidas terminam com `finalizada`;

## `imagens`
- Módulo das fotos que o usuário captura para enviar em uma análise;
- Entidade do banco que armazena o caminho para as imagens usadas em análises;
- `id_usuario` : chave estrangeira referente ao `usuario` do qual as fotos pertencem;
- `id_analise` : chave estrangeira referente à `analise` da qual as fotos pertencem;
- `nome` : `string` de 3-150 caracteres com o nome original do arquivo, opcional;
- `caminho` : `string` de 0-2048 caracteres, contém URL/caminho da imagem;
- `coordenadas` : `GEOGRAPHY(POINT, 4326)` - PostGIS - contendo coordenadas individuais da foto capturada, opcional;
- `tipo_mime` : `enum('image/jpeg', 'image/jpg', 'image/png', 'image/webp')`, `default('image/webp')`;
- `tamanho`: `bigint` contendo tamanho do arquivo de imagem em bits;

## `processadas`
- Módulo das imagens otimizadas que o sistema gera a partir das fotos originais;
- Entidade do banco que armazena o caminho para as imagens processadas após uma análise;
- `id_usuario` : chave estrangeira referente ao `usuario` do qual as imagens pertencem;
- `id_analise` : chave estrangeira referente à `analise` da qual as imagens pertencem;
- `id_imagem`: chave estrangeira referente à `imagem` original;
- `nome` : `string` de 3-150 caracteres com o nome original do arquivo, opcional;
- `caminho` : `string` de 0-2048 caracteres, contém URL/caminho da imagem;
- `tipo_mime` : `enum('image/jpeg', 'image/jpg', 'image/png', 'image/webp')`, `default('image/webp')`;
- `tamanho`: `BIGINT` contendo tamanho do arquivo de imagem em bits;

## `classificacao`
- Módulo dos resultados de uma análise de imagens;
- Entidade do banco que armazena os números da inferência do modelo de rede neural sobre as imagens de uma análise;
- `id_usuario` : chave estrangeira referente ao `usuario` do qual as classificações pertencem;
- `id_analise` : chave estrangeira referente à `analise` da qual as classificações pertencem;
- `tempo_execucao` : `integer` com o tempo de duração do processo em milissegundos;
- `classe`: `float` indicando probabilidade de infecção ou de ser fruta saudável;
- `confianca` : `float` indicando a confiança do modelo de rede neural na classificação;
- `modelo_cnn` : `string` de 3-150 caracteres com o nome do modelo utilizado na classificação;
