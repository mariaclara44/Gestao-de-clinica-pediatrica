import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import { verificarAutenticacao } from './middleware/auth.js';

// Recriação de __dirname para ES6 Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Leitura dos formulários
app.use(express.urlencoded({ extended: true }));

// Configuração da sessão
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'chave-local-clinica-pequenos-passos',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            sameSite: 'lax',
        },
    }),
);

// Validações auxiliares
function idValido(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

function campoObrigatorio(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

function dataValida(data) {
    return /^\d{4}-\d{2}-\d{2}$/.test(data) && !isNaN(Date.parse(data));
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

app.post('/login', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!campoObrigatorio(cpf) || !campoObrigatorio(senha)) {
        return res.status(400).render('login', {
            erro: 'CPF ou senha inválidos.',
        });
    }

    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE cpf = $1', [cpf.trim()]);

        if (resultado.rows.length === 0) {
            return res.render('login', {
                erro: 'CPF ou senha inválidos.',
            });
        }

        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.render('login', {
                erro: 'CPF ou senha inválidos.',
            });
        }

        req.session.regenerate((erroSessao) => {
            if (erroSessao) {
                return res.status(500).send('Falha ao iniciar sessão.');
            }

            req.session.usuario = {
                id: usuario.id,
                nome: usuario.nome,
                cpf: usuario.cpf,
            };

            req.session.save((erroSalvar) => {
                if (erroSalvar) {
                    return res.status(500).send('Falha ao salvar sessão.');
                }

                res.redirect('/inicio');
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('login', {
            erro: 'Erro interno ao realizar login.',
        });
    }
});

// Logout
app.post('/logout', verificarAutenticacao, (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).send('Erro ao encerrar sessão.');
        }

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ==========================================
// PÁGINA INICIAL
// ==========================================

app.get('/inicio', verificarAutenticacao, (req, res) => {
    res.render('inicio', {
        usuario: req.session.usuario,
    });
});

// ==========================================
// CRUD DE RESPONSÁVEIS
// ==========================================

// Lista responsáveis e realiza busca por nome
app.get('/responsaveis', verificarAutenticacao, async (req, res) => {
    const busca = req.query.busca || '';

    try {
        const resultado = await pool.query(
            `SELECT * FROM responsaveis
             WHERE nome ILIKE $1
             ORDER BY nome ASC`,
            [`%${busca}%`],
        );

        res.render('responsaveis', {
            responsaveis: resultado.rows,
            usuario: req.session.usuario,
            busca: busca,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar responsáveis.');
    }
});

// Formulário de novo responsável
app.get('/responsaveis/novo', verificarAutenticacao, (req, res) => {
    res.render('novo-responsavel', {
        usuario: req.session.usuario,
    });
});

// Cadastra responsável
app.post('/responsaveis/novo', verificarAutenticacao, async (req, res) => {
    const { nome, cpf, email, telefone } = req.body;

    if (
        !campoObrigatorio(nome) ||
        !campoObrigatorio(cpf) ||
        !campoObrigatorio(email) ||
        !campoObrigatorio(telefone)
    ) {
        return res.status(400).send('Preencha todos os campos.');
    }

    try {
        await pool.query(
            `INSERT INTO responsaveis (nome, cpf, email, telefone)
             VALUES ($1, $2, $3, $4)`,
            [nome.trim(), cpf.trim(), email.trim(), telefone.trim()],
        );

        res.redirect('/responsaveis');
    } catch (err) {
        console.error(err);

        if (err.code === '23505') {
            return res.status(400).send('Este CPF já está cadastrado.');
        }

        res.status(500).send('Erro ao cadastrar responsável.');
    }
});

// Formulário de edição
app.get('/responsaveis/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        const resultado = await pool.query('SELECT * FROM responsaveis WHERE id = $1', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).send('Responsável não encontrado.');
        }

        res.render('editar-responsavel', {
            responsavel: resultado.rows[0],
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar responsável.');
    }
});

// Atualiza responsável
app.post('/responsaveis/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, email, telefone } = req.body;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    if (
        !campoObrigatorio(nome) ||
        !campoObrigatorio(cpf) ||
        !campoObrigatorio(email) ||
        !campoObrigatorio(telefone)
    ) {
        return res.status(400).send('Preencha todos os campos.');
    }

    try {
        await pool.query(
            `UPDATE responsaveis
             SET nome = $1, cpf = $2, email = $3, telefone = $4
             WHERE id = $5`,
            [nome.trim(), cpf.trim(), email.trim(), telefone.trim(), id],
        );

        res.redirect('/responsaveis');
    } catch (err) {
        console.error(err);

        if (err.code === '23505') {
            return res.status(400).send('Este CPF já está cadastrado.');
        }

        res.status(500).send('Erro ao atualizar responsável.');
    }
});

// Exclui responsável
app.post('/responsaveis/deletar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        const criancas = await pool.query('SELECT id FROM criancas WHERE responsavel_id = $1', [
            id,
        ]);

        if (criancas.rows.length > 0) {
            return res
                .status(400)
                .send(
                    'Não é possível excluir este responsável porque existem crianças vinculadas.',
                );
        }

        await pool.query('DELETE FROM responsaveis WHERE id = $1', [id]);

        res.redirect('/responsaveis');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir responsável.');
    }
});

// ==========================================
// CRUD DE CRIANÇAS
// ==========================================

// Lista crianças com seus responsáveis
app.get('/criancas', verificarAutenticacao, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT c.*, r.nome AS nome_responsavel
             FROM criancas c
             INNER JOIN responsaveis r
             ON c.responsavel_id = r.id
             ORDER BY c.nome ASC`,
        );

        res.render('criancas', {
            criancas: resultado.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar crianças.');
    }
});

// Formulário de nova criança
app.get('/criancas/novo', verificarAutenticacao, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM responsaveis ORDER BY nome ASC');

        res.render('novo-crianca', {
            responsaveis: resultado.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar responsáveis.');
    }
});

// Cadastra criança
app.post('/criancas/novo', verificarAutenticacao, async (req, res) => {
    const { nome, data_nascimento, responsavel_id } = req.body;

    if (!campoObrigatorio(nome) || !dataValida(data_nascimento) || !idValido(responsavel_id)) {
        return res.status(400).send('Preencha os campos corretamente.');
    }

    try {
        const responsavel = await pool.query('SELECT id FROM responsaveis WHERE id = $1', [
            responsavel_id,
        ]);

        if (responsavel.rows.length === 0) {
            return res.status(400).send('Responsável não encontrado.');
        }

        await pool.query(
            `INSERT INTO criancas (nome, data_nascimento, responsavel_id)
             VALUES ($1, $2, $3)`,
            [nome.trim(), data_nascimento, responsavel_id],
        );

        res.redirect('/criancas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar criança.');
    }
});

// Formulário de edição
app.get('/criancas/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        const crianca = await pool.query('SELECT * FROM criancas WHERE id = $1', [id]);

        const responsaveis = await pool.query('SELECT * FROM responsaveis ORDER BY nome ASC');

        if (crianca.rows.length === 0) {
            return res.status(404).send('Criança não encontrada.');
        }

        res.render('editar-crianca', {
            crianca: crianca.rows[0],
            responsaveis: responsaveis.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar criança.');
    }
});

// Atualiza criança
app.post('/criancas/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;
    const { nome, data_nascimento, responsavel_id } = req.body;

    if (
        !idValido(id) ||
        !campoObrigatorio(nome) ||
        !dataValida(data_nascimento) ||
        !idValido(responsavel_id)
    ) {
        return res.status(400).send('Preencha os campos corretamente.');
    }

    try {
        const responsavel = await pool.query('SELECT id FROM responsaveis WHERE id = $1', [
            responsavel_id,
        ]);

        if (responsavel.rows.length === 0) {
            return res.status(400).send('Responsável não encontrado.');
        }

        await pool.query(
            `UPDATE criancas
             SET nome = $1, data_nascimento = $2, responsavel_id = $3
             WHERE id = $4`,
            [nome.trim(), data_nascimento, responsavel_id, id],
        );

        res.redirect('/criancas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar criança.');
    }
});

// Exclui criança
app.post('/criancas/deletar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        const atendimentos = await pool.query('SELECT id FROM atendimentos WHERE crianca_id = $1', [
            id,
        ]);

        if (atendimentos.rows.length > 0) {
            return res
                .status(400)
                .send(
                    'Não é possível excluir esta criança porque existem atendimentos vinculados.',
                );
        }

        await pool.query('DELETE FROM criancas WHERE id = $1', [id]);

        res.redirect('/criancas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir criança.');
    }
});

// ==========================================
// CRUD DE ATENDIMENTOS
// ==========================================

// Lista atendimentos com JOIN e ordenação cronológica
app.get('/atendimentos', verificarAutenticacao, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT a.*, c.nome AS nome_crianca,
                    r.nome AS nome_responsavel
             FROM atendimentos a
             INNER JOIN criancas c
             ON a.crianca_id = c.id
             INNER JOIN responsaveis r
             ON c.responsavel_id = r.id
             ORDER BY a.data_atendimento ASC, a.horario ASC`,
        );

        res.render('atendimentos', {
            atendimentos: resultado.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar atendimentos.');
    }
});

// Formulário de novo atendimento
app.get('/atendimentos/novo', verificarAutenticacao, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT c.id, c.nome, r.nome AS nome_responsavel
             FROM criancas c
             INNER JOIN responsaveis r
             ON c.responsavel_id = r.id
             ORDER BY c.nome ASC`,
        );

        res.render('novo-atendimento', {
            criancas: resultado.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar crianças.');
    }
});

// Cadastra atendimento
app.post('/atendimentos/novo', verificarAutenticacao, async (req, res) => {
    const { crianca_id, data_atendimento, horario, motivo, situacao } = req.body;

    if (
        !idValido(crianca_id) ||
        !dataValida(data_atendimento) ||
        !campoObrigatorio(horario) ||
        !campoObrigatorio(motivo) ||
        !campoObrigatorio(situacao)
    ) {
        return res.status(400).send('Preencha todos os campos corretamente.');
    }

    try {
        const crianca = await pool.query('SELECT id FROM criancas WHERE id = $1', [crianca_id]);

        if (crianca.rows.length === 0) {
            return res.status(400).send('Criança não encontrada.');
        }

        await pool.query(
            `INSERT INTO atendimentos
             (crianca_id, data_atendimento, horario, motivo, situacao)
             VALUES ($1, $2, $3, $4, $5)`,
            [crianca_id, data_atendimento, horario, motivo.trim(), situacao.trim()],
        );

        res.redirect('/atendimentos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao cadastrar atendimento.');
    }
});

// Formulário de edição
app.get('/atendimentos/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        const atendimento = await pool.query('SELECT * FROM atendimentos WHERE id = $1', [id]);

        const criancas = await pool.query(
            `SELECT c.id, c.nome, r.nome AS nome_responsavel
             FROM criancas c
             INNER JOIN responsaveis r
             ON c.responsavel_id = r.id
             ORDER BY c.nome ASC`,
        );

        if (atendimento.rows.length === 0) {
            return res.status(404).send('Atendimento não encontrado.');
        }

        res.render('editar-atendimento', {
            atendimento: atendimento.rows[0],
            criancas: criancas.rows,
            usuario: req.session.usuario,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar atendimento.');
    }
});

// Atualiza atendimento
app.post('/atendimentos/editar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;
    const { crianca_id, data_atendimento, horario, motivo, situacao } = req.body;

    if (
        !idValido(id) ||
        !idValido(crianca_id) ||
        !dataValida(data_atendimento) ||
        !campoObrigatorio(horario) ||
        !campoObrigatorio(motivo) ||
        !campoObrigatorio(situacao)
    ) {
        return res.status(400).send('Preencha todos os campos corretamente.');
    }

    try {
        const crianca = await pool.query('SELECT id FROM criancas WHERE id = $1', [crianca_id]);

        if (crianca.rows.length === 0) {
            return res.status(400).send('Criança não encontrada.');
        }

        await pool.query(
            `UPDATE atendimentos
             SET crianca_id = $1, data_atendimento = $2,
                 horario = $3, motivo = $4, situacao = $5
             WHERE id = $6`,
            [crianca_id, data_atendimento, horario, motivo.trim(), situacao.trim(), id],
        );

        res.redirect('/atendimentos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar atendimento.');
    }
});

// Exclui atendimento
app.post('/atendimentos/deletar/:id', verificarAutenticacao, async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).send('ID inválido.');
    }

    try {
        await pool.query('DELETE FROM atendimentos WHERE id = $1', [id]);

        res.redirect('/atendimentos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao excluir atendimento.');
    }
});

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get('/', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/inicio');
    }

    res.redirect('/login');
});

// Inicialização do servidor
app.listen(3000, () => {
    console.log('Clínica Pequenos Passos rodando em http://localhost:3000');
});
