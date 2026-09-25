/* ========================================
   COMPROBAR ADMINISTRADOR
======================================== */

function requireAdmin(req, res, next) {
    if (req.session?.isAdmin === true) {
        return next();
    }

    return res.status(401).json({
        error: "Necesitás iniciar sesión como administrador."
    });
}


/* ========================================
   COMPROBAR ORIGEN DE PETICIONES
======================================== */

function requireSameOrigin(req, res, next) {
    const origin = req.get("origin");

    if (!origin ||
        origin !== process.env.APP_ORIGIN
    ) {
        return res.status(403).json({
            error: "Origen de petición no autorizado."
        });
    }

    next();
}


module.exports = {
    requireAdmin,
    requireSameOrigin
};