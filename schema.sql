-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL
);

-- 2. Tabela de responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL
);

-- 3. Tabela de crianças
CREATE TABLE IF NOT EXISTS criancas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    responsavel_id INTEGER NOT NULL,
    FOREIGN KEY (responsavel_id)
        REFERENCES responsaveis(id)
        ON DELETE RESTRICT
);

-- 4. Tabela de atendimentos
CREATE TABLE IF NOT EXISTS atendimentos (
    id SERIAL PRIMARY KEY,
    crianca_id INTEGER NOT NULL,
    data_atendimento DATE NOT NULL,
    horario TIME NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    situacao VARCHAR(50) NOT NULL,
    FOREIGN KEY (crianca_id)
        REFERENCES criancas(id)
        ON DELETE RESTRICT
);
