const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
 // Certifique-se de ter configurado o PostgreSQL corretamente
 const pool = new Pool({
    user: 'postgres', // altere com seu usuário
    host: 'localhost',
    database: 'sistema_odontologico', // altere com o nome do seu banco
    password: 'Viperrko22', // altere com sua senha
    port: 5432,
  });
// Rota para buscar o prontuário pelo CPF
router.get('/prontuario/:cpf', async (req, res) => {
  const { cpf } = req.params;
  console.log("cpf-----",cpf)
  
  try {
      const result = await pool.query('SELECT * FROM users WHERE cpf = $1', [cpf]);
      
      
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
        } else {
        console.log("Paciente não encontrado-----",result)
      res.status(404).json({ message: 'Paciente não encontrado' });
    }
  } catch (error) {
    console.log("err-----",error)
    res.status(500).json({ message: 'Erro ao buscar prontuário', error });
  }
});

module.exports = router;
