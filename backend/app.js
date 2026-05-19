const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors'); // Novo: Necessário para a API comunicar com o frontend Vue 3

const indexRouter = require('./routes/index');
const examplesRouter = require('./routes/examples');

const app = express();

// 1. Configuração do CORS
// Permite que o frontend (ex: na porta 5173 do Vite) faça pedidos a esta API (na porta 50520)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// NOTA: A configuração do View Engine (Jade) e o express.static foram removidos.
// O backend já não serve páginas HTML nem ficheiros estáticos diretamente.

// 2. Rotas
// É boa prática adicionar o prefixo '/api' a todos os endpoints de dados
app.use('/api/examples', examplesRouter);
app.use('/api', indexRouter);

// 3. Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404, 'Endpoint não encontrado'));
});

// 4. Error handler da API (agora devolve JSON em vez de renderizar uma View)
app.use(function(err, req, res, next) {
  const status = err.status || 500;
  
  res.status(status);
  res.json({
    success: false,
    error: {
      message: err.message,
      // Envia a stack trace apenas se estiver em ambiente de desenvolvimento
      stack: req.app.get('env') === 'development' ? err.stack : undefined
    }
  });
});

module.exports = app;