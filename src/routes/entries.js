const express = require("express");

const {
    ObjectId
} = require("mongodb");

const {
    getDB
} = require("../db/mongo");

const {
    requireAdmin,
    requireSameOrigin
} = require("../middleware/requireAdmin");


const publicRouter = express.Router();

const adminRouter = express.Router();


/* ========================================
   UTILIDADES
======================================== */

function entriesCollection() {
    return getDB().collection("entries");
}


function toEntry(document) {
    return {
        id: document._id.toString(),
        title: document.title,
        session: document.session,
        date: document.date,
        content: document.content,
        note: document.note ?? "",
        published: document.published === true,
        createdAt: document.createdAt ?? null,
        updatedAt: document.updatedAt ?? null
    };
}


function validateEntry(body) {
    if (!body ||
        typeof body !== "object"
    ) {
        throw new Error("La aventura no tiene datos válidos.");
    }

    const title = String(body.title ?? "").trim();
    const date = String(body.date ?? "").trim();
    const content = String(body.content ?? "").trim();
    const note = String(body.note ?? "").trim();
    const session = Number(body.session);

    if (!title || title.length > 100) {
        throw new Error("El título debe tener entre 1 y 100 caracteres.");
    }

    if (!date || date.length > 100) {
        throw new Error("La fecha o momento no es válido.");
    }

    if (!content || content.length > 50000) {
        throw new Error("La aventura debe tener entre 1 y 50000 caracteres.");
    }

    if (note.length > 500) {
        throw new Error("La nota puede tener hasta 500 caracteres.");
    }

    if (!Number.isInteger(session) ||
        session < 0
    ) {
        throw new Error("La sesión debe ser un número entero no negativo.");
    }

    if (typeof body.published !== "boolean") {
        throw new Error("El estado de publicación no es válido.");
    }

    return {
        title,
        session,
        date,
        content,
        note,
        published: body.published
    };
}


function parseId(value) {
    if (!ObjectId.isValid(value)) {
        return null;
    }

    const id = new ObjectId(value);

    return id.toString() === value.toLowerCase() ?
        id :
        null;
}


/* ========================================
   AVENTURAS PÚBLICAS
======================================== */

publicRouter.get("/", async(req, res, next) => {
    try {
        const documents = await entriesCollection()
            .find({
                published: true
            })
            .sort({
                session: 1,
                createdAt: 1,
                _id: 1
            })
            .toArray();

        res.json(
            documents.map(toEntry)
        );

    } catch (error) {
        next(error);
    }
});


/* ========================================
   PROTEGER TODAS LAS RUTAS ADMIN
======================================== */

adminRouter.use(requireAdmin);


/* ========================================
   CONSULTAR TODAS LAS AVENTURAS
======================================== */

adminRouter.get("/", async(req, res, next) => {
    try {
        const documents = await entriesCollection()
            .find({})
            .sort({
                session: 1,
                createdAt: 1,
                _id: 1
            })
            .toArray();

        res.json(
            documents.map(toEntry)
        );

    } catch (error) {
        next(error);
    }
});


/* ========================================
   CREAR AVENTURA
======================================== */

adminRouter.post(
    "/",
    requireSameOrigin,
    async(req, res, next) => {
        try {
            let entry;

            try {
                entry = validateEntry(req.body);
            } catch (error) {
                return res.status(400).json({
                    error: error.message
                });
            }

            const now = new Date();

            const document = {
                ...entry,
                createdAt: now,
                updatedAt: now
            };

            const result = await entriesCollection()
                .insertOne(document);

            res.status(201).json(
                toEntry({
                    _id: result.insertedId,
                    ...document
                })
            );

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   EDITAR AVENTURA
======================================== */

adminRouter.put(
    "/:id",
    requireSameOrigin,
    async(req, res, next) => {
        try {
            const id = parseId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    error: "Identificador no válido."
                });
            }

            let entry;

            try {
                entry = validateEntry(req.body);
            } catch (error) {
                return res.status(400).json({
                    error: error.message
                });
            }

            const result = await entriesCollection()
                .findOneAndUpdate({
                    _id: id
                }, {
                    $set: {
                        ...entry,
                        updatedAt: new Date()
                    }
                }, {
                    returnDocument: "after"
                });

            if (!result) {
                return res.status(404).json({
                    error: "No se encontró la aventura."
                });
            }

            res.json(
                toEntry(result)
            );

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   ELIMINAR AVENTURA
======================================== */

adminRouter.delete(
    "/:id",
    requireSameOrigin,
    async(req, res, next) => {
        try {
            const id = parseId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    error: "Identificador no válido."
                });
            }

            const result = await entriesCollection()
                .deleteOne({
                    _id: id
                });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: "No se encontró la aventura."
                });
            }

            res.json({
                ok: true
            });

        } catch (error) {
            next(error);
        }
    }
);


module.exports = {
    publicRouter,
    adminRouter
};