require("dotenv").config();
const {
    publicRouter: charactersPublicRouter,
    adminRouter: charactersAdminRouter
} = require("./src/routes/characters");
const express = require("express");
const path = require("path");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.default || connectMongo;

const {
    connectDB,
    getDB,
    closeDB
} = require("./src/db/mongo");

const authRoutes = require("./src/routes/auth");

const {
    publicRouter,
    adminRouter
} = require("./src/routes/entries");


/* ========================================
   CONFIGURACIÓN
======================================== */

const app = express();

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Diario disponible en el puerto ${PORT}`);
});

const isProduction =
    process.env.NODE_ENV === "production";


/* ========================================
   COMPROBAR CONFIGURACIÓN
======================================== */

const requiredVariables = [
    "MONGODB_URI",
    "ADMIN_PASSWORD_HASH",
    "SESSION_SECRET",
    "APP_ORIGIN"
];

for (const name of requiredVariables) {
    if (!process.env[name]) {
        throw new Error(
            `Falta ${name} en .env`
        );
    }
}

if (process.env.SESSION_SECRET.length < 32) {
    throw new Error(
        "SESSION_SECRET debe tener al menos 32 caracteres."
    );
}


/* ========================================
   PROXY PARA PRODUCCIÓN
======================================== */

if (isProduction) {
    app.set("trust proxy", 1);
}


/* ========================================
   MIDDLEWARE
======================================== */

app.use(
    express.json({
        limit: "128kb"
    })
);


/* ========================================
   SESIONES
======================================== */

app.use(
    session({
        name: "britani.sid",

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            dbName: process.env.DB_NAME ||
                "diario_britani",
            collectionName: "sessions"
        }),

        cookie: {
            httpOnly: true,
            sameSite: "strict",
            secure: isProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    })
);


/* ========================================
   RUTAS
======================================== */

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/entries",
    publicRouter
);

app.use(
    "/api/admin/entries",
    adminRouter
);

/* ========================================
   RUTAS DE COMPAÑEROS
======================================== */

app.use(
    "/api/characters",
    charactersPublicRouter
);

app.use(
    "/api/admin/characters",
    charactersAdminRouter
);

/* ========================================
   ESTADO DE MONGODB
======================================== */

app.get("/api/health", async(req, res) => {
    try {
        await getDB().command({
            ping: 1
        });

        res.json({
            ok: true,
            message: "MongoDB conectado"
        });

    } catch (error) {
        res.status(503).json({
            ok: false,
            message: "MongoDB no disponible"
        });
    }
});


/* ========================================
   ARCHIVOS DE LA WEB
======================================== */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* ========================================
   ERRORES
======================================== */

app.use((error, req, res, next) => {
    console.error(error);

    res.status(500).json({
        error: "Ocurrió un error en el servidor."
    });
});


/* ========================================
   INICIAR SERVIDOR
======================================== */

async function startServer() {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(
                `Diario disponible en http://localhost:${PORT}`
            );
        });

        async function shutdown() {
            server.close(async() => {
                await closeDB();
                process.exit(0);
            });
        }

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {
        console.error(
            "Error al iniciar:",
            error.message
        );

        process.exit(1);
    }
}

startServer();