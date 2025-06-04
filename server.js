const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const app = express();
const port = 3000;
const cors = require('cors');
const prontuarioRoutes = require('./routes/prontuario.routes');
// Configuração do PostgreSQL
const pool = new Pool({
  user: 'postgres', // altere com seu usuário
  host: 'localhost',
  database: 'sistema_odontologico', // altere com o nome do seu banco
  password: 'Viperrko22', // altere com sua senha
  port: 5432,
});
app.use(cors({
    origin: 'http://localhost:4200', // Permite apenas o frontend acessar
    methods: 'GET,POST,PUT,DELETE',  // Métodos HTTP permitidos
    allowedHeaders: 'Content-Type,Authorization' // Headers permitidos
  }));
app.use(express.json());

// Rota de Cadastro
app.post('/register', async (req, res) => {
    const { nome, email, senha, telefone, cpf, dataNascimento, endereco, sexo, role } = req.body;
    console.log('adim-----',req.body)
    // Verificar se o e-mail já está cadastrado
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }
  
    if (!nome || !email || !senha || !telefone || !cpf || !dataNascimento) {
      return res.status(400).send({ message: 'Campos obrigatórios não foram preenchidos' });
    }
  
    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(senha, 10);
  
    // Inserir no banco de dados
    try {
      const newUser = await pool.query(
        'INSERT INTO users (nome, email, senha, telefone, cpf, dataNascimento, endereco, sexo,role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING *',
        [nome, email, hashedPassword, telefone, cpf, dataNascimento, endereco, sexo, role]
      );
  
      res.status(201).json({ message: 'Usuário registrado com sucesso!', user: newUser.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  });
  

// Rota de Login
app.post('/login', async (req, res) => {
    const { cpf, senha } = req.body;
    
    // Verificar se o usuário existe pelo CPF
    const result = await pool.query('SELECT * FROM users WHERE cpf = $1', [cpf]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }
  
    // Verificar a senha
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
  
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }
  
    const token = jwt.sign({ id: user.id }, 'secreto', { expiresIn: '1h' });
    res.status(200).json({ 
    message: 'Login bem-sucedido', 
    token, 
    nome: user.nome,
    role:user.role,
    cpf:user.cpf 
    });
  });

  app.use('/api', prontuarioRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

app.put('/atualizarProntuario', async (req, res) => {
  const { cpf, nome, telefone, email, endereco, sexo } = req.body;

  try {
    await pool.query(
      'UPDATE users SET nome = $1, telefone = $2, email = $3, endereco = $4, sexo = $5 WHERE cpf = $6',
      [nome, telefone, email, endereco, sexo, cpf]
    );
    res.status(200).json({ message: 'Dados atualizados com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar prontuário', error });
  }
});

app.post('/agendamentos/novo', async (req, res) => {
  const { pacienteCpf, data, horario, motivo } = req.body;

  try {
    await pool.query(
      'INSERT INTO agendamentos (pacienteCpf, data, horario, motivo) VALUES ($1, $2, $3, $4)',
      [pacienteCpf, data, horario, motivo]
    );
    res.status(201).json({ message: 'Consulta agendada com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao agendar consulta', error });
  }
});

app.get('/agendamentos/listar', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agendamentos');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar agendamentos', error });
  }
});

app.get('/agendamentos/consultas', async (req, res) => {
  const { cpf, role } = req.query;
console.log('teste---------',req.query)
  try {
    let query;
    let params = [];

    if (role === 'admin') {
      query = `
        SELECT a.*, u.nome AS nome_paciente
        FROM agendamentos a
        JOIN users u ON a.pacienteCpf = u.cpf
        ORDER BY a.data, a.horario
      `;
    } else {
      query = `
        SELECT a.*, u.nome AS nome_paciente
        FROM agendamentos a
        JOIN users u ON a.pacienteCpf = u.cpf
        WHERE a.pacienteCpf = $1
        ORDER BY a.data, a.horario
      `;
      params = [cpf];
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar consultas', error });
  }
});


app.post('/contato/salvar', async (req, res) => {
  const { endereco, telefone, whatsapp, email,informacoes } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE contato SET endereco = $1, telefone = $2, whatsapp = $3, email = $4, informacoes = $5 WHERE id = 1', // Usando um ID fixo para exemplo (substitua conforme necessário)
      [endereco, telefone, whatsapp, email, informacoes] // Corrigido para enviar todos os 5 valores
    );
    console.log('req----',result.rowCount)
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Contato alterado com sucesso!' });
    } else {
      res.status(404).json({ message: 'Contato não encontrado para atualização.' });
    }
  } catch (error) {
    console.log("err------",error)
    res.status(500).json({ message: 'Erro ao alterar contato', error });
  }
});

app.get('/contato/buscar', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contato');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar contato', error });
  }
});
const pacientesRoutes = require('./routes/prontuario.routes');
app.use('/api/prontuario', pacientesRoutes);

app.delete('/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM agendamentos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Consulta excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir consulta' });
  }
});


