const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Registrar un horario médico
router.post("/", (req, res) => {
  const { medico_id, dia_semana, hora_inicio, hora_fin } = req.body;

  if (!medico_id || !dia_semana || !hora_inicio || !hora_fin) {
    return res.status(400).json({
      mensaje: "Completa todos los campos del horario",
    });
  }

  if (hora_inicio >= hora_fin) {
    return res.status(400).json({
      mensaje: "La hora de inicio debe ser anterior a la hora final",
    });
  }

  const sql = `
    INSERT INTO horarios_medicos
    (medico_id, dia_semana, hora_inicio, hora_fin)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [medico_id, dia_semana, hora_inicio, hora_fin],
    (error, resultado) => {
      if (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            mensaje: "Este médico ya tiene un horario para ese día",
          });
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            mensaje: "El médico indicado no existe",
          });
        }

        console.error(error);

        return res.status(500).json({
          mensaje: "Error al registrar el horario",
        });
      }

      return res.status(201).json({
        mensaje: "Horario registrado correctamente",
        id: resultado.insertId,
      });
    },
  );
});

// Consultar todos los horarios médicos
router.get("/", (req, res) => {
  const sql = `
    SELECT
      h.id,
      h.medico_id,
      m.nombre AS medico,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin
    FROM horarios_medicos h
    INNER JOIN medicos m ON h.medico_id = m.id
    ORDER BY m.nombre, h.dia_semana
  `;

  db.query(sql, (error, resultados) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: "Error al consultar los horarios",
      });
    }

    return res.status(200).json(resultados);
  });
});

module.exports = router;
