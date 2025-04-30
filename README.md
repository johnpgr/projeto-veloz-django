# Projeto CRUD de Produtos e Vendas

Este é um projeto Django que implementa um sistema CRUD (Criar, Ler, Atualizar, Deletar) para gerenciamento de produtos e registro de vendas. Ele utiliza Tailwind CSS para o frontend e PostgreSQL como banco de dados.

## Funcionalidades

*   Listagem, criação, edição e exclusão de produtos.
*   Registro de vendas associadas aos produtos.
*   Listagem de vendas com filtros por período.
*   Autenticação de usuários (Login, Logout, Signup).
*   Interface responsiva utilizando Tailwind CSS e DaisyUI.
*   Busca de produtos por nome com similaridade trigram (PostgreSQL).
*   Paginação e ordenação nas listagens.

## Pré-requisitos

*   Python 3.10+
*   Node.js e npm (para o Tailwind CSS)
*   Docker e Docker Compose (para o banco de dados PostgreSQL)

## Instalação

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <diretorio-do-projeto>
    ```

2.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    python -m venv env
    source env/bin/activate  # Linux/macOS
    # ou
    .\env\Scripts\activate  # Windows
    ```

3.  **Instale as dependências Python e Node.js:**
    O script `run.py` facilita a instalação. Execute:
    ```bash
    python run.py install
    ```
    Isso instalará as dependências listadas em [`requirements.txt`](requirements.txt) e [`package.json`](package.json).

## Configuração do Banco de Dados

O projeto utiliza Docker Compose para gerenciar o container do PostgreSQL.

1.  **Inicie o container do banco de dados:**
    Certifique-se de que o Docker esteja em execução e execute o comando na raiz do projeto:
    ```bash
    docker-compose up -d
    ```
    Isso iniciará um container PostgreSQL em segundo plano. As configurações do banco (nome, usuário, senha) estão definidas em [`docker-compose.yml`](docker-compose.yml). O script [`init.sql`](init.sql) será executado automaticamente para criar a extensão `pg_trgm` necessária para a busca por similaridade.

2.  **Aplique as migrações do Django:**
    Use o script `run.py` para aplicar as migrações ao banco de dados:
    ```bash
    python run.py migrate
    ```

## Executando a Aplicação (Desenvolvimento)

O script `run.py` também simplifica a execução dos servidores de desenvolvimento.

1.  **Inicie os servidores:**
    Execute o comando:
    ```bash
    python run.py dev
    ```
    Isso iniciará:
    *   O servidor de desenvolvimento do Django (geralmente em `http://127.0.0.1:8000/`).
    *   O processo do Tailwind CSS em modo de observação (`watch`), que compilará automaticamente o CSS (`src/static/css/styles.css`) sempre que houver alterações nos arquivos HTML ou no `src/static/css/input.css`.

2.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://127.0.0.1:8000/`. Você será redirecionado para a página de login.

## Populando o Banco com Dados de Exemplo (Opcional)

Você pode popular o banco de dados com dados de exemplo para produtos e vendas usando os comandos de gerenciamento do Django, acessíveis através do `run.py`:

1.  **Criar produtos de exemplo:**
    ```bash
    python run.py seed_products <numero_de_produtos>
    # Exemplo: python run.py seed_products 20
    ```

2.  **Criar vendas de exemplo:**
    *Certifique-se de ter criado produtos e usuários antes.*
    ```bash
    python run.py seed_sales <numero_de_vendas>
    # Exemplo: python run.py seed_sales 50
    ```
    *Nota: O comando `seed_sales` requer que existam usuários no banco. Crie usuários através da interface web (Signup) ou pelo Django Admin antes de executar este comando.*

## Acessando a Aplicação

Após iniciar os servidores com `python run.py dev`, acesse a aplicação no seu navegador:

*   **URL:** `http://127.0.0.1:8000/`

Você pode criar uma conta na página de Signup ou usar o superusuário do Django (se criado via `python manage.py createsuperuser`) para acessar a área administrativa em `http://127.0.0.1:8000/admin/`.
