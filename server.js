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

