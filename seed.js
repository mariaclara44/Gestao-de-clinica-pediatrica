import bcrypt from 'bcryptjs';
import pool from './db.js';

async function inserirDados() {
    try {
        const senhaHash = await bcrypt.hash('123456', 10);

        await pool.query(
            `INSERT INTO usuarios (nome, cpf, senha_hash) VALUES
             ('Administrador', '11111111111', $1),
             ('Operador Um', '22222222222', $1),
             ('Operador Dois', '33333333333', $1)
             ON CONFLICT (cpf) DO NOTHING`,
            [senhaHash]
        );

        await pool.query(
            `INSERT INTO responsaveis (nome, cpf, email, telefone) VALUES
             ('Ana Souza', '44444444444', 'ana@email.com', '(11) 90000-0001'),
             ('Carlos Lima', '55555555555', 'carlos@email.com', '(11) 90000-0002'),
             ('Mariana Alves', '66666666666', 'mariana@email.com', '(11) 90000-0003')
             ON CONFLICT (cpf) DO NOTHING`
        );

        await pool.query(
            `INSERT INTO criancas (nome, data_nascimento, responsavel_id)
             SELECT dados.nome, dados.data_nascimento::date, r.id
             FROM (VALUES
                ('Lucas Souza', '2018-03-12', '44444444444'),
                ('Sofia Lima', '2020-07-21', '55555555555'),
                ('Pedro Alves', '2017-11-05', '66666666666')
             ) AS dados(nome, data_nascimento, cpf_responsavel)
             JOIN responsaveis r ON r.cpf=dados.cpf_responsavel
             WHERE NOT EXISTS (
                SELECT 1 FROM criancas c WHERE c.nome=dados.nome
             )`
        );

        await pool.query(
            `INSERT INTO atendimentos (crianca_id, data_atendimento, horario, motivo, situacao)
             SELECT c.id, dados.data_atendimento::date, dados.horario::time, dados.motivo, dados.situacao
             FROM (VALUES
                ('Lucas Souza', '2026-11-20', '09:00', 'Consulta de rotina', 'Agendado'),
                ('Sofia Lima', '2026-11-21', '10:30', 'Acompanhamento pediátrico', 'Agendado'),
                ('Pedro Alves', '2026-11-22', '14:00', 'Avaliação de rotina', 'Agendado')
             ) AS dados(nome_crianca, data_atendimento, horario, motivo, situacao)
             JOIN criancas c ON c.nome=dados.nome_crianca
             WHERE NOT EXISTS (
                SELECT 1 FROM atendimentos a
                WHERE a.crianca_id=c.id AND a.data_atendimento=dados.data_atendimento::date
                  AND a.horario=dados.horario::time
             )`
        );

        console.log('Dados de teste inseridos.');
        console.log('Login de teste: CPF 11111111111 | Senha: 123456');
    } catch (err) {
        console.error('Erro ao inserir dados:', err);
    } finally {
        await pool.end();
    }
}

inserirDados();
