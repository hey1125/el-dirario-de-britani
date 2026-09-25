import {
    renderCoverPage
} from "./cover.js";

import {
    sheetHTML
} from "./pagination.js";


/* ========================================
   ELEMENTOS
======================================== */

const pageContent =
    document.getElementById(
        "page-content"
    );

const visibleSheet =
    document.querySelector(
        ".book > .book-content"
    );

const pageControls =
    document.getElementById(
        "page-controls"
    );

const prevButton =
    document.getElementById(
        "prev-page"
    );

const nextButton =
    document.getElementById(
        "next-page"
    );

const pageIndicator =
    document.getElementById(
        "page-indicator"
    );


/* ========================================
   MOSTRAR UNA PÁGINA
======================================== */

export function renderDiaryPage(
    pages,
    pageIndex
) {

    const page =
        pages[pageIndex];

    if (!page) {
        return;
    }


    /* TIPO DE HOJA */

    visibleSheet.classList.toggle(

        "is-cover",

        page.type === "cover"

    );

    visibleSheet.classList.remove(
        "is-relationships"
    );


    /* CONTENIDO */

    if (
        page.type === "cover"
    ) {

        renderCoverPage(
            pageContent
        );

    } else {

        pageContent.innerHTML =
            sheetHTML(
                page.fragments
            );

    }


    /* BOTONES */

    pageControls.hidden = false;

    pageIndicator.textContent =

        `Página ${pageIndex + 1} / ${pages.length}`;


    prevButton.disabled =
        pageIndex === 0;


    nextButton.disabled =
        pageIndex >= pages.length - 1;

}


/* ========================================
   OBTENER BOTONES
======================================== */

export function getPageButtons() {

    return {

        previous: prevButton,

        next: nextButton

    };

}