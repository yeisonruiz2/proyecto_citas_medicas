const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON desde el frontend

app.use(express.static(path.join(__dirname, "../frontend")));

// Rutas
const pacientesRoutes = require("./routes/pacientes");
app.use("/api/pacientes", pacientesRoutes);

const loginRoutes = require("./routes/login");
app.use("/api/login", loginRoutes);

const medicosRoutes = require("./routes/medicos");
app.use("/api/medicos", medicosRoutes);

const citasRoutes = require("./routes/citas");
const horariosRoutes = require("./routes/horarios");
const verificarToken = require("./middleware/verificarToken");

app.use("/api/citas", verificarToken, citasRoutes);
app.use("/api/horarios", verificarToken, horariosRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
