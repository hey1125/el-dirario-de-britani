const express = require("express");
const bcrypt = require("bcryptjs");

const {
    rateLimit
} = require("express-rate-limit");

const {
    requireSameOrigin
} = require("../middleware/requireAdmin");


const router = express.Router();


/* ========================================
   LIMITAR INTENTOS DE CONTRASEÑA
======================================== */

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: "Demasiados intentos. Probá más tarde."
    }
});


/* ========================================
   ESTADO DE SESIÓN
======================================== */

router.get("/session", (req, res) => {
    res.json({
        authenticated: req.session?.isAdmin === true
    });
});


/* ========================================
   INICIAR SESIÓN
======================================== */

router.post(
    "/login",
    requireSameOrigin,
    loginLimiter,
    async(req, res, next) => {
        try {
            const password = req.body?.password;

            if (
                typeof password !== "string" ||
                password.length === 0
            ) {
                return res.status(400).json({
                    error: "Escribí la contraseña."
                });
            }

            const valid = await bcrypt.compare(
                password,
                process.env.ADMIN_PASSWORD_HASH
            );

            if (!valid) {
                return res.status(401).json({
                    error: "Contraseña incorrecta."
                });
            }

            req.session.regenerate(error => {
                if (error) {
                    return next(error);
                }

                req.session.isAdmin = true;

                req.session.save(error => {
                    if (error) {
                        return next(error);
                    }

                    res.json({
                        authenticated: true
                    });
                });
            });

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   CERRAR SESIÓN
======================================== */

router.post(
    "/logout",
    requireSameOrigin,
    (req, res, next) => {
        req.session.destroy(error => {
            if (error) {
                return next(error);
            }

            res.clearCookie("britani.sid", {
                path: "/"
            });

            res.json({
                authenticated: false
            });
        });
    }
);


module.exports = router;