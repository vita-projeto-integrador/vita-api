# CONTRIBUTING.MD

Segue o fluxo atual de desenvolvimento:

```mermaid
gitGraph
    commit id: "init" tag: "main"

    branch dev
    checkout dev
    commit id: "setup dev"

    branch feature/nome-da-branch
    checkout feature/nome-da-branch
    commit id: "desenvolvimento 1"
    commit id: "desenvolvimento 2"

    checkout dev
    merge feature/nome-da-branch id: "PR -> dev"

    checkout main
    merge dev id: "PR -> main"
```

```mermaid
flowchart TD
    A[main] -->|cria branch| B[dev]
    B -->|cria branch| C[feature/nome-da-branch]

    C --> D[Desenvolvimento]
    D --> E[Commits]

    E -->|Pull Request| F[dev]
    F -->|Revisão e merge| G[dev atualizado]

    G -->|Pull Request| H[main]
    H -->|Merge final| I[main atualizado]
```

## Contribuição

Siga os passos abaixo para contribuir com o repositório.

`clonar repositório → criar branch → desenvolver e commitar → fazer push → abrir pull request`

### Atualizar seu repositório local

Antes de desenvolver, sempre atualize seu repositório com as últimas mudanças

```
git fetch

git pull
```

### Criar uma branch

Para trabalhar numa nova tarefa, crie uma branch específica (sempre derivada de `dev`)

```
git branch

git checkout -b nome-branch-local
```

### Salvar alterações no local

```
git status

git add nome-do-arquivo | git add .

git commit -m "mensagem-do-commit"
```

### Salvar alterações no remoto

O comando abaixo cria uma branch no github e conecta ela à sua branch atual

```
git push -u origin nome-da-branch
```

### Abrir Pull Request

Entre no github e abra uma PR, pedindo avaliação e `merge` da sua branch para a `dev`
