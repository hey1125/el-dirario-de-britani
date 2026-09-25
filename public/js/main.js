/* ========================================
   EL DIARIO DE BRITANI
======================================== */

import {
    diary
} from "./data.js";


import {
    getEntries,
    getCharacters
} from "./api.js";


import {
    buildDiaryPages
} from "./diary/pagination.js";


import {
    renderDiaryPage,
    getPageButtons
} from "./diary/renderer.js";


import {
    renderRelationships
} from "./characters/renderer.js";


import {
    initializeEditor
} from "./admin/editor.js";


/* ========================================
   ESTADO
======================================== */

let currentSection = "diary";

let currentDiaryPage = 0;

let diaryPages = [];


/* ========================================
   ELEMENTOS
======================================== */

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    );

const buttons =
    getPageButtons();


/* ========================================
   NAVEGACIÓN
======================================== */

function navigate(section) {
    currentSection = section;

    navButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === section
        );
    });

    if (
        section === "relationships"
    ) {
        renderRelationships(
            diary.characters
        );

        return;
    }

    renderDiaryPage(
        diaryPages,
        currentDiaryPage
    );
}


/* ========================================
   DISTRIBUIR AVENTURAS
======================================== */

function rebuildDiaryPages() {
    diaryPages =
        buildDiaryPages(
            diary.entries
        );

    currentDiaryPage =
        Math.min(
            currentDiaryPage,
            diaryPages.length - 1
        );

    if (
        currentSection === "diary"
    ) {
        renderDiaryPage(
            diaryPages,
            currentDiaryPage
        );
    }
}


/* ========================================
   CARGAR AVENTURAS DESDE MONGODB
======================================== */

async function loadDiary(
    targetEntryId = null
) {
    const entries =
        await getEntries();

    diary.entries = entries;

    diaryPages =
        buildDiaryPages(
            diary.entries
        );

    if (targetEntryId) {
        const index =
            diaryPages.findIndex(
                page =>
                page.type === "entries" &&

                page.fragments.some(
                    fragment =>
                    fragment.entryId ===
                    targetEntryId
                )
            );

        if (index >= 0) {
            currentDiaryPage = index;
        }
    }

    currentDiaryPage =
        Math.min(
            currentDiaryPage,
            diaryPages.length - 1
        );

    navigate("diary");
}


/* ========================================
   CARGAR COMPAÑEROS DESDE MONGODB
======================================== */

async function loadCharacters() {
    const characters =
        await getCharacters();

    diary.characters =
        characters;

    if (
        currentSection === "relationships"
    ) {
        renderRelationships(
            diary.characters
        );
    }
}


/* ========================================
   BOTONES DE SECCIONES
======================================== */

navButtons.forEach(button => {
    button.addEventListener(
        "click",

        () => {
            navigate(
                button.dataset.page
            );
        }
    );
});


/* ========================================
   PÁGINA ANTERIOR
======================================== */

buttons.previous.addEventListener(
    "click",

    () => {
        if (
            currentSection !== "diary" ||
            currentDiaryPage === 0
        ) {
            return;
        }

        currentDiaryPage--;

        renderDiaryPage(
            diaryPages,
            currentDiaryPage
        );
    }
);


/* ========================================
   PÁGINA SIGUIENTE
======================================== */

buttons.next.addEventListener(
    "click",

    () => {
        if (
            currentSection !== "diary" ||
            currentDiaryPage >=
            diaryPages.length - 1
        ) {
            return;
        }

        currentDiaryPage++;

        renderDiaryPage(
            diaryPages,
            currentDiaryPage
        );
    }
);


/* ========================================
   ADMINISTRACIÓN
======================================== */

initializeEditor(

    async entryId => {
        await loadDiary(
            entryId
        );
    },

    async() => {
        await loadCharacters();
    }

);


/* ========================================
   RECALCULAR HOJAS AL REDIMENSIONAR
======================================== */

let resizeTimeout;

window.addEventListener(
    "resize",

    () => {
        clearTimeout(
            resizeTimeout
        );

        resizeTimeout =
            setTimeout(
                rebuildDiaryPages,
                150
            );
    }
);


/* ========================================
   INICIAR EL DIARIO
======================================== */

async function startDiary() {
    diaryPages =
        buildDiaryPages([]);

    navigate("diary");

    try {
        await loadDiary();

    } catch (error) {
        console.error(
            "Error cargando aventuras:",
            error
        );
    }

    try {
        await loadCharacters();

    } catch (error) {
        console.error(
            "Error cargando compañeros:",
            error
        );
    }
}


/* ========================================
   INICIAR
======================================== */

startDiary();


/* ========================================
   ESPERAR LAS FUENTES
======================================== */

if (document.fonts) {
    document.fonts.ready.then(
        rebuildDiaryPages
    );
}