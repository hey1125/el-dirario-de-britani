const express = require("express");
const { ObjectId } = require("mongodb");

const { getDB } = require("../db/mongo");

const {
    requireAdmin,
    requireSameOrigin
} = require("../middleware/requireAdmin");

const publicRouter = express.Router();
const adminRouter = express.Router();


/* ========================================
   COLECCIÓN
======================================== */

function collection() {
    return getDB().collection("characters");
}


/* ========================================
   FORMATO DE SALIDA
======================================== */

function toCharacter(document) {
    return {
        id: document._id.toString(),

        name: document.name,

        image: document.image || "",

        opinion: document.opinion || "",

        relationship: document.relationship,

        relationshipLabelOverride: document.relationshipLabelOverride || "",

        specialEmote: document.specialEmote || "",

        published: document.published === true,

        createdAt: document.createdAt || null,

        updatedAt: document.updatedAt || null
    };
}


/* ========================================
   VALIDAR IDENTIFICADOR
======================================== */

function parseId(value) {
    if (
        typeof value !== "string" ||
        !ObjectId.isValid(value)
    ) {
        return null;
    }

    const id = new ObjectId(value);

    return id.toString() === value.toLowerCase() ?
        id :
        null;
}


/* ========================================
   EMOTES PERMITIDOS
======================================== */

const allowedEmotes = [
    "",
    "./images/emotes/seraphine.png",

];


/* ========================================
   VALIDAR PERSONAJE
======================================== */

function validateCharacter(body) {

    if (!body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new Error(
            "Los datos del personaje no son válidos."
        );
    }

    const name = String(
        body.name || ""
    ).trim();

    const image = String(
        body.image || ""
    ).trim();

    const opinion = String(
        body.opinion || ""
    ).trim();

    const relationship = Number(
        body.relationship
    );

    const relationshipLabelOverride = String(
        body.relationshipLabelOverride || ""
    ).trim();

    const specialEmote = String(
        body.specialEmote || ""
    ).trim();

    const published = body.published;


    /* NOMBRE */

    if (!name || name.length > 100) {
        throw new Error(
            "El nombre debe tener entre 1 y 100 caracteres."
        );
    }


    /* OPINIÓN */

    if (opinion.length > 5000) {
        throw new Error(
            "La opinión puede tener hasta 5000 caracteres."
        );
    }


    /* RELACIÓN SIN LÍMITE DE 0 A 10 */

    if (!Number.isSafeInteger(relationship)) {
        throw new Error(
            "La relación debe ser un número entero válido."
        );
    }


    /* NOMBRE PERSONALIZADO */

    if (relationshipLabelOverride.length > 80) {
        throw new Error(
            "El nombre personalizado puede tener hasta 80 caracteres."
        );
    }


    /* EMOTE ESPECIAL */

    if (!allowedEmotes.includes(specialEmote)) {
        throw new Error(
            "El emote seleccionado no es válido."
        );
    }


    /* IMAGEN ANTIGUA */

    if (image.length > 500) {
        throw new Error(
            "La dirección de la imagen es demasiado larga."
        );
    }

    if (image) {

        const localImage =
            /^(\.\/|\/)images\/(?:[\w-]+\/)*[\w.-]+\.(png|jpg|jpeg|webp|gif)$/i.test(image);

        let remoteImage = false;

        try {
            remoteImage =
                new URL(image).protocol === "https:";
        } catch {
            remoteImage = false;
        }

        if (!localImage && !remoteImage) {
            throw new Error(
                "La dirección de la imagen no es válida."
            );
        }
    }


    /* PUBLICACIÓN */

    if (typeof published !== "boolean") {
        throw new Error(
            "El estado de publicación no es válido."
        );
    }


    /* DATOS VALIDADOS */

    return {
        name,
        image,
        opinion,
        relationship,
        relationshipLabelOverride,
        specialEmote,
        published
    };
}


/* ========================================
   PERSONAJES PÚBLICOS
======================================== */

publicRouter.get(
    "/",
    async(req, res, next) => {

        try {

            const documents = await collection()
                .find({
                    published: true
                })
                .sort({
                    createdAt: 1,
                    _id: 1
                })
                .toArray();

            res.json(
                documents.map(toCharacter)
            );

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   PROTEGER ADMINISTRACIÓN
======================================== */

adminRouter.use(requireAdmin);


/* ========================================
   CONSULTAR TODOS LOS COMPAÑEROS
======================================== */

adminRouter.get(
    "/",
    async(req, res, next) => {

        try {

            const documents = await collection()
                .find({})
                .sort({
                    createdAt: 1,
                    _id: 1
                })
                .toArray();

            res.json(
                documents.map(toCharacter)
            );

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   CREAR COMPAÑERO
======================================== */

adminRouter.post(
    "/",
    requireSameOrigin,

    async(req, res, next) => {

        try {

            let character;

            try {
                character = validateCharacter(
                    req.body
                );

            } catch (error) {

                return res.status(400).json({
                    error: error.message
                });

            }

            const now = new Date();

            const document = {
                ...character,
                createdAt: now,
                updatedAt: now
            };

            const result = await collection()
                .insertOne(document);

            res.status(201).json(
                toCharacter({
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
   EDITAR COMPAÑERO
======================================== */

adminRouter.put(
    "/:id",
    requireSameOrigin,

    async(req, res, next) => {

        try {

            const id = parseId(
                req.params.id
            );

            if (!id) {
                return res.status(400).json({
                    error: "Identificador no válido."
                });
            }

            let character;

            try {
                character = validateCharacter(
                    req.body
                );

            } catch (error) {

                return res.status(400).json({
                    error: error.message
                });

            }

            const result = await collection()
                .findOneAndUpdate({
                    _id: id
                }, {
                    $set: {
                        ...character,
                        updatedAt: new Date()
                    }
                }, {
                    returnDocument: "after"
                });

            if (!result) {
                return res.status(404).json({
                    error: "No se encontró el personaje."
                });
            }

            res.json(
                toCharacter(result)
            );

        } catch (error) {
            next(error);
        }
    }
);


/* ========================================
   ELIMINAR COMPAÑERO
======================================== */

adminRouter.delete(
    "/:id",
    requireSameOrigin,

    async(req, res, next) => {

        try {

            const id = parseId(
                req.params.id
            );

            if (!id) {
                return res.status(400).json({
                    error: "Identificador no válido."
                });
            }

            const result = await collection()
                .deleteOne({
                    _id: id
                });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: "No se encontró el personaje."
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


/* ========================================
   EXPORTAR RUTAS
======================================== */

module.exports = {
    publicRouter,
    adminRouter
};