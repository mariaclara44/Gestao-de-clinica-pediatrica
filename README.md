# Clínica Pediátrica Pequenos Passos

Sistema web local para gerenciamento de responsáveis, crianças e atendimentos.

## Tecnologias utilizadas

- Node.js
- Express
- EJS
- PostgreSQL
- pg
- bcrypt
- express-session

## Pré-requisitos

- Node.js instalado.
- PostgreSQL instalado e em execução.
- pgAdmin (opcional, para administrar o banco de dados).

## Configuração do banco de dados

1. Crie um banco de dados chamado `clinica_pediatrica`.
2. Abra o **Query Tool** dentro desse banco.
3. Execute o conteúdo do arquivo `clinica_pediatrica.sql`.
4. Verifique se as quatro tabelas foram criadas e se existem pelo menos três registros em cada uma.

## Configuração da conexão

Confira o arquivo `db.js` e ajuste o usuário, a senha e a porta conforme a instalação local do PostgreSQL.

Configuração utilizada no projeto:

- **Host:** `localhost`
- **Database:** `clinica_pediatrica`
- **Port:** `7777`
- **User:** `postgres`
- **Password:** senha local configurada no PostgreSQL.

> **Importante:** Não publique credenciais reais no repositório.

## Instalação e execução

No terminal, dentro da pasta do projeto, execute:

```bash
npm install
```

Em seguida, inicie a aplicação:

```bash
npm start
```

A aplicação estará disponível em:

[http://localhost:3000](http://localhost:3000)

## Acesso de demonstração

O script SQL inclui operadores de teste com senhas protegidas por hash bcrypt.

**Primeiro operador:**

- **CPF:** `111.444.777-35`
- **Senha:** `Clinica123`

> Utilize somente dados fictícios no ambiente de demonstração.

## Funcionalidades

- Login de operador com autenticação e gerenciamento de sessão.
- Página inicial com identificação do operador autenticado.
- Cadastro, listagem, edição, exclusão e busca de responsáveis.
- Cadastro, listagem, edição e exclusão de crianças vinculadas aos responsáveis.
- Cadastro, listagem, edição e exclusão de atendimentos vinculados às crianças.
- Listagem de atendimentos utilizando `JOIN` e ordenação por data e horário.

## Observações importantes

- Não inclua a pasta `node_modules` na entrega.
- Não versione senhas reais, chaves ou credenciais.
- O esquema atual armazena CPFs como texto. A exigência de proteção criptográfica dos CPFs, prevista na atividade, ainda precisa ser implementada para que a versão final esteja em conformidade.
- Confira as configurações locais do PostgreSQL antes de executar o projeto.

------

**Clínica Pediátrica Pequenos Passos**  
Sistema de gerenciamento desenvolvido com Node.js, Express e PostgreSQL.