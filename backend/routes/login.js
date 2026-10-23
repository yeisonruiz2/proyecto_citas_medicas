const express = require("express");
const router = express.Router();
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Iniciar sesión del paciente
router.post("/", (req, res) => {
  const { correo, password } = req.body;

  // Verificar que exista la clave secreta
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensaje: "Falta configurar la clave de seguridad del servidor",
    });
  }

  // Verificar que se ingresen los datos
  if (!correo || !password) {
    return res.status(400).json({
      mensaje: "Debes ingresar el correo y la contraseña",
    });
  }

  // Buscar al paciente por su correo
  const sql = `
    SELECT id, nombre, correo, password
    FROM pacientes
    WHERE correo = ?
  `;

  db.query(sql, [correo], async (error, resultados) => {
    if (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: "Error al iniciar sesión",
      });
    }

    // Comprobar si existe el paciente
    if (resultados.length === 0) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const paciente = resultados[0];

    try {
      let contraseñaCorrecta = false;

      // Verificar la contraseña
      if (paciente.password.startsWith("$2")) {
        contraseñaCorrecta = await bcrypt.compare(password, paciente.password);
      } else {
        // Compatibilidad temporal con contraseñas antiguas
        contraseñaCorrecta = password === paciente.password;
      }

      // Rechazar si la contraseña no coincide
      if (!contraseñaCorrecta) {
        return res.status(401).json({
          mensaje: "Correo o contraseña incorrectos",
        });
      }

      // Convertir contraseñas antiguas a hash
      if (!paciente.password.startsWith("$2")) {
        const passwordHash = await bcrypt.hash(password, 10);

        db.query(
          "UPDATE pacientes SET password = ? WHERE id = ?",
          [passwordHash, paciente.id],
          (errorActualizacion) => {
            if (errorActualizacion) {
              console.error(errorActualizacion);

              return res.status(500).json({
                mensaje: "No se pudo actualizar la seguridad de la contraseña",
              });
            }

            responderLogin(res, paciente);
          },
        );
      } else {
        responderLogin(res, paciente);
      }
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: "Error al verificar la contraseña",
      });
    }
  });
});

// Crear el token y enviar los datos del paciente
function responderLogin(res, paciente) {
  try {
    const token = jwt.sign(
      {
        id: paciente.id,
        correo: paciente.correo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.status(200).json({
      mensaje: "Inicio de sesión exitoso",
      token: token,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        correo: paciente.correo,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "No se pudo crear el token de seguridad",
    });
  }
}

module.exports = router;
