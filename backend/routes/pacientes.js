const express = require("express");
const router = express.Router();
const db = require("../config/database");
const bcrypt = require("bcryptjs");

// Registrar paciente
router.post("/", async (req, res) => {
  const { nombre, documento, fecha_nacimiento, telefono, correo, password } =
    req.body;

  // Verificar que todos los campos estén completos
  if (
    !nombre ||
    !documento ||
    !fecha_nacimiento ||
    !telefono ||
    !correo ||
    !password
  ) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  // Verificar la longitud mínima de la contraseña
  if (password.length < 8) {
    return res.status(400).json({
      mensaje: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  try {
    // Crear un hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Preparar la consulta para guardar al paciente
    const sql = `
            INSERT INTO pacientes
            (nombre, documento, fecha_nacimiento, telefono, correo, password)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

    // Guardar los datos en MySQL
    db.query(
      sql,
      [nombre, documento, fecha_nacimiento, telefono, correo, passwordHash],
      (error, resultado) => {
        if (error) {
          console.error(error);

          if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              mensaje: "El documento o correo ya está registrado",
            });
          }

          return res.status(500).json({
            mensaje: "Error al registrar el paciente",
          });
        }

        res.status(201).json({
          mensaje: "Paciente registrado correctamente",
          id: resultado.insertId,
        });
      },
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al proteger la contraseña",
    });
  }
});

module.exports = router;
