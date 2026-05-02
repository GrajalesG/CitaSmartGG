require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares globales
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Rutas de la API
//Registro de módulos principales del sistema.
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/usuarios',      require('./routes/usuarios.routes'));
app.use('/api/pacientes',     require('./routes/pacientes.routes'));
app.use('/api/profesionales', require('./routes/profesionales.routes'));
app.use('/api/servicios',     require('./routes/servicios.routes'));
app.use('/api/especialidades',require('./routes/especialidades.routes')); 
app.use('/api/horarios',      require('./routes/horarios.routes'));
app.use('/api/bloqueos',      require('./routes/bloqueos.routes'));
app.use('/api/citas',         require('./routes/citas.routes'));

//Ruta de verificación del servidor
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

//Inicialización del servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));