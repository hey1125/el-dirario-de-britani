import { diary } from "./data.js";


/* ========================================
   CONFIGURACIÓN
======================================== */

export const STORAGE_KEY =
    "britani-diary-entries-v1";


/* ========================================
   CARGAR ENTRADAS
======================================== */

export function loadSavedEntries() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (saved === null) {
            return;
        }

        const entries =
            JSON.parse(saved);

        if (Array.isArray(entries)) {

            diary.entries =
                entries;

        }

    } catch (error) {

        console.error(
            "No se pudieron cargar las aventuras:",
            error
        );

    }

}


/* ========================================
   GUARDAR ENTRADAS
======================================== */

export function saveEntries(entries) {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(entries)

    );

}