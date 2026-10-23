const jwt = require("jsonwebtoken");

// Comprobar que la solicitud tenga un token válido
function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  // Obtener el token enviado por el navegador
  const token =
    autorizacion && autorizacion.startsWith("Bearer ")
      ? autorizacion.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      mensaje: "Debes iniciar sesión para acceder",
    });
  }

  try {
    // Validar el token y comprobar que no haya vencido
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = datos;

    // Permitir continuar a la ruta solicitada
    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: "La sesión es inválida o ha vencido",
    });
  }
}

module.exports = verificarToken;
