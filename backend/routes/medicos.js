const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Registrar un médico
router.post("/", (req, res) => {
  const { nombre, documento, correo, telefono, especialidad } = req.body;

  // Validar los campos obligatorios
  if (!nombre || !documento || !correo || !especialidad) {
    return res.status(400).json({
      mensaje: "Completa nombre, documento, correo y especialidad",
    });
  }

  const sql = `
        INSERT INTO medicos (nombre, documento, correo, telefono, especialidad)
        VALUES (?, ?, ?, ?, ?)
    `;

  db.query(
    sql,
    [nombre, documento, correo, telefono || null, especialidad],
    (error, resultado) => {
      if (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            mensaje: "El documento o correo ya está registrado",
          });
        }

        console.error(error);
        return res.status(500).json({
          mensaje: "Error al registrar el médico",
        });
      }

      res.status(201).json({
        mensaje: "Médico registrado correctamente",
        id: resultado.insertId,
      });
    },
  );
});

// Consultar todos los médicos
router.get("/", (req, res) => {
  const sql = `
        SELECT id, nombre, documento, correo, telefono, especialidad
        FROM medicos
        ORDER BY id DESC
    `;

  db.query(sql, (error, resultados) => {
    if (error) {
      console.error("Error de MySQL al consultar médicos:", error);

      return res.status(500).json({
        mensaje: "Error al consultar los médicos",
        detalle: error.message,
        codigo: error.code,
      });
    }

    res.json(resultados);
  });
});

module.exports = router;
