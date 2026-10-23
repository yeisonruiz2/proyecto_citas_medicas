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

// Consultar el historial de citas del paciente que inició sesión
router.get("/historial", (req, res) => {
  const pacienteId = req.usuario.id;

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
    WHERE c.paciente_id = ?
    ORDER BY c.fecha DESC, c.hora DESC
  `;

  db.query(sql, [pacienteId], (error, resultados) => {
    if (error) {
      console.error("Error al consultar el historial:", error);

      return res.status(500).json({
        mensaje: "Error al consultar el historial de citas",
      });
    }

    return res.status(200).json(resultados);
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

// Cancelar una cita médica
router.put("/:id/cancelar", (req, res) => {
  const { id } = req.params;

  // Actualizar el estado de la cita
  const sql = `
        UPDATE citas
        SET estado = 'Cancelada'
        WHERE id = ?
    `;

  db.query(sql, [id], (error, resultado) => {
    if (error) {
      console.error("Error al cancelar la cita:", error);

      return res.status(500).json({
        mensaje: "Error al cancelar la cita",
      });
    }

    // Verificar si existe la cita
    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "No se encontró la cita",
      });
    }

    return res.json({
      mensaje: "Cita cancelada correctamente",
    });
  });
});

// Reprogramar una cita
router.put("/:id/reprogramar", (req, res) => {
  const { id } = req.params;
  const { fecha, hora } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({
      mensaje: "Debes indicar la nueva fecha y hora",
    });
  }

  const sql = `
        UPDATE citas
        SET fecha = ?, hora = ?
        WHERE id = ? AND estado = 'Pendiente'
    `;

  db.query(sql, [fecha, hora, id], (error, resultado) => {
    if (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          mensaje: "El médico ya tiene una cita en esa fecha y hora",
        });
      }

      console.error("Error al reprogramar la cita:", error);

      return res.status(500).json({
        mensaje: "Error al reprogramar la cita",
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje:
          "No se encontró una cita pendiente o la cita no necesita cambios",
      });
    }

    return res.json({
      mensaje: "Cita reprogramada correctamente",
    });
  });
});

module.exports = router;
