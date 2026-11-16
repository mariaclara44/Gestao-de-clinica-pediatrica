# Clínica Pediátrica Pequenos Passos

Projeto local com Node.js, Express, EJS, PostgreSQL e sessões.

## 1. Banco de dados
Crie um banco novo chamado `clinica_pediatrica` no PostgreSQL e execute o arquivo `schema.sql`. Use um banco separado para não misturar as tabelas antigas de produtos e grupos.
A conexão está configurada para a porta `7777`, conforme o projeto de referência. Se sua instalação usar outra porta, ajuste `DB_PORT` no ambiente ou em `db.js`.

## 2. Instalação
Dentro da pasta do projeto, execute:

```bash
npm install
```

Foi utilizado `bcryptjs` no lugar de `bcrypt` para evitar a dependência de compilação nativa que pode causar erro de binding em algumas versões do Node.

## 3. Dados de teste
Execute:

```bash
npm run seed
```

Login de teste:
- CPF: `11111111111`
- Senha: `123456`

Os CPFs de teste são fictícios.

## 4. Executar
```bash
npm start
```

Abra `http://localhost:3000`.

## Observação importante sobre CPF
Este projeto didático usa CPF fictício em campo identificador para demonstrar o login e a validação. Para uso real, não utilize este modelo sem implementar proteção adequada dos CPFs, gestão segura de chaves e controles de acesso.
