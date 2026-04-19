require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/usuarios',      require('./routes/usuarios.routes'));
app.use('/api/pacientes',     require('./routes/pacientes.routes'));


app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));