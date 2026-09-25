const {
    MongoClient
} = require("mongodb");


let client;

let database;


/* ========================================
   CONECTAR
======================================== */

async function connectDB() {

    const uri =
        process.env.MONGODB_URI;


    if (!uri) {

        throw new Error(

            "Falta MONGODB_URI en .env"

        );

    }


    client =
        new MongoClient(uri);


    await client.connect();


    database =
        client.db(

            process.env.DB_NAME ||
            "diario_britani"

        );


    await database.command({

        ping: 1

    });


    console.log(

        "MongoDB conectado correctamente"

    );


    return database;

}


/* ========================================
   OBTENER BASE DE DATOS
======================================== */

function getDB() {

    if (!database) {

        throw new Error(

            "MongoDB todavía no está conectado"

        );

    }


    return database;

}


/* ========================================
   CERRAR CONEXIÓN
======================================== */

async function closeDB() {

    if (client) {

        await client.close();

    }

}


module.exports = {

    connectDB,

    getDB,

    closeDB

};