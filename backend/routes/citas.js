const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.post("/", (req, res) => {
  const { paciente_id, medico_id, fecha, hora, motivo } = req.body;

  if (!paciente_id || !medico_id || !fecha || !hora) {
    return res.status(400).json({
      mensaje: "Completa paciente, médico, fecha y hora",
    });
  }

  const sql = `
        INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo)
        VALUES (?, ?, ?, ?, ?)
    `;

  const valores = [paciente_id, medico_id, fecha, hora, motivo || null];

  db.query(sql, valores, (error, resultado) => {
    if (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensaje: "El médico ya tiene una cita en esa fecha y hora",
        });
      }

      console.error(error);

      return res.status(500).json({
        mensaje: "Error al registrar la cita",
      });
    }

    return res.status(201).json({
      mensaje: "Cita registrada correctamente",
      id: resultado.insertId,
    });
  });
});

router.get("/", (req, res) => {
  const sql = `
        SELECT
            c.id,
            p.nombre AS paciente,
            m.nombre AS medico,
            m.especialidad,
            c.fecha,
            c.hora,
            c.motivo,
            c.estado
        FROM citas c
        INNER JOIN pacientes p ON c.paciente_id = p.id
        INNER JOIN medicos m ON c.medico_id = m.id
        ORDER BY c.fecha DESC, c.hora DESC
    `;

  db.query(sql, (error, resultados) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: "Error al consultar las citas",
      });
    }

    return res.status(200).json(resultados);
  });
});

module.exports = router;
