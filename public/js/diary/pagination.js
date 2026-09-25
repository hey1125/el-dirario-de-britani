import { escapeHTML } from "../utils.js";


/* ========================================
   CONFIGURACIÓN
======================================== */

export const REUSE_FREE_LINES = true;

let measureSheet = null;


/* ========================================
   CREAR FRAGMENTO
======================================== */

function makeFragment(
    entry,
    text = "",
    note = "",
    part = 1
) {

    return {

        entry,

        entryId: entry.id,

        text,

        note,

        part

    };

}


/* ========================================
   HTML DE UNA AVENTURA
======================================== */

export function entryFragmentHTML(fragment) {

    const entry = fragment.entry;

    return `

        <article class="diary-entry">

            <div class="entry-date">

                Sesión ${escapeHTML(entry.session)}
                · ${escapeHTML(entry.date)}

            </div>

            <h3 class="entry-title">

                ${escapeHTML(entry.title)}

            </h3>

            ${
                fragment.part > 1

                    ? `
                        <div class="entry-part">
                            Continuación...
                        </div>
                    `

                    : ""
            }

            <div class="entry-content">${escapeHTML(fragment.text)}</div>

            ${
                fragment.note

                    ? `
                        <div class="entry-note">Nota: ${escapeHTML(fragment.note)}</div>
                    `

                    : ""
            }

        </article>

    `;

}


/* ========================================
   HTML DE UNA HOJA
======================================== */

export function sheetHTML(fragments) {

    return `

        <section class="diary-page">

            <div class="diary-sheet-content">

                ${
                    fragments
                        .map(entryFragmentHTML)
                        .join("")
                }

            </div>

        </section>

    `;

}


/* ========================================
   HOJA INVISIBLE DE MEDICIÓN
======================================== */

function getMeasureSheet() {

    if (!measureSheet) {

        measureSheet =
            document.createElement("div");

        measureSheet.className =
            "book-content measurement-sheet";

        measureSheet.style.position =
            "fixed";

        measureSheet.style.left =
            "-100000px";

        measureSheet.style.top =
            "0";

        measureSheet.style.visibility =
            "hidden";

        measureSheet.style.pointerEvents =
            "none";

        document.querySelector(".book")
            .appendChild(measureSheet);

    }

    const visibleSheet =
        document.querySelector(
            ".book > .book-content"
        );

    measureSheet.style.width =

        `${
            visibleSheet
                .getBoundingClientRect()
                .width
        }px`;

    return measureSheet;

}


/* ========================================
   ¿CABE EN LA HOJA?
======================================== */

function pageFits(fragments) {

    const sheet =
        getMeasureSheet();

    sheet.innerHTML =
        sheetHTML(fragments);

    const content =
        sheet.querySelector(
            ".diary-sheet-content"
        );

    const styles =
        getComputedStyle(sheet);

    const availableHeight =

        sheet.clientHeight

        - parseFloat(
            styles.paddingTop
        )

        - parseFloat(
            styles.paddingBottom
        );

    const usedHeight =

        content
            .getBoundingClientRect()
            .height;

    return usedHeight <= availableHeight + 0.5;

}


/* ========================================
   CANDIDATO DE TEXTO
======================================== */

function candidateFragment(
    entry,
    text,
    note,
    part
) {

    return makeFragment(
        entry,
        text,
        note,
        part
    );

}


/* ========================================
   ENCONTRAR CUÁNTO CABE
======================================== */

function findFittingCut(
    existingFragments,
    entry,
    remaining,
    part,
    field = "text",
    baseText = ""
) {

    const wordEnds = Array.from(

        remaining.matchAll(/\S+/g),

        match =>
            match.index +
            match[0].length

    );

    function fitsCandidate(candidate) {

        const fragment =
            field === "note"

                ? candidateFragment(
                    entry,
                    baseText,
                    candidate,
                    part
                )

                : candidateFragment(
                    entry,
                    candidate,
                    "",
                    part
                );

        return pageFits([

            ...existingFragments,

            fragment

        ]);

    }


    /* BUSCAR POR PALABRAS */

    let low = 0;

    let high =
        wordEnds.length - 1;

    let best = 0;

    while (low <= high) {

        const middle =
            Math.floor(
                (low + high) / 2
            );

        const end =
            wordEnds[middle];

        const candidate =
            remaining
                .slice(0, end)
                .trimEnd();

        if (
            fitsCandidate(candidate)
        ) {

            best = end;

            low = middle + 1;

        } else {

            high = middle - 1;

        }

    }

    if (best > 0) {
        return best;
    }


    /* SI NO CABE EN ESTA HOJA */

    if (
        existingFragments.length > 0
    ) {

        return 0;

    }


    /* PALABRA EXTRAORDINARIAMENTE LARGA */

    const characters =
        Array.from(remaining);

    low = 1;

    high =
        characters.length;

    best = 0;

    while (low <= high) {

        const middle =
            Math.floor(
                (low + high) / 2
            );

        const candidate =
            characters
                .slice(0, middle)
                .join("");

        if (
            fitsCandidate(candidate)
        ) {

            best =
                candidate.length;

            low = middle + 1;

        } else {

            high = middle - 1;

        }

    }

    return best;

}


/* ========================================
   CONSTRUIR PÁGINAS
======================================== */

export function buildDiaryPages(entries) {

    const pages = [

        {
            type: "cover"
        }

    ];

    let currentPage = null;


    /* CREAR HOJA */

    function createPage() {

        currentPage = {

            type: "entries",

            fragments: []

        };

        pages.push(
            currentPage
        );

    }


    /* ORDENAR AVENTURAS */

    const sortedEntries =

        [...entries].sort(

            (a, b) =>

                Number(a.session)

                - Number(b.session)

        );


    /* PROCESAR AVENTURAS */

    for (
        const entry
        of sortedEntries
    ) {

        if (

            !currentPage ||

            !REUSE_FREE_LINES

        ) {

            createPage();

        }


        let remainingText =
            String(entry.content ?? "")

                .replace(
                    /\r\n?/g,
                    "\n"
                )

                .trim();


        let remainingNote =
            String(entry.note ?? "")
                .trim();


        let part = 1;


        while (true) {

            const fullFragment =
                makeFragment(

                    entry,

                    remainingText,

                    remainingNote,

                    part

                );


            /* ¿CABE TODO? */

            if (

                pageFits([

                    ...currentPage.fragments,

                    fullFragment

                ])

            ) {

                currentPage.fragments.push(
                    fullFragment
                );

                break;

            }


            /* TEXTO PRINCIPAL */

            if (
                remainingText.length > 0
            ) {

                const cut =
                    findFittingCut(

                        currentPage.fragments,

                        entry,

                        remainingText,

                        part

                    );


                if (cut === 0) {

                    if (

                        currentPage.fragments.length > 0

                    ) {

                        createPage();

                        continue;

                    }

                    throw new Error(

                        `No cabe "${entry.title}" en una hoja vacía.`

                    );

                }


                const currentText =

                    remainingText

                        .slice(0, cut)

                        .trimEnd();


                const nextText =

                    remainingText

                        .slice(cut)

                        .replace(
                            /^[ \t]+/,
                            ""
                        );


                /* TODO EL TEXTO + NOTA */

                if (!nextText) {

                    const withNote =
                        makeFragment(

                            entry,

                            currentText,

                            remainingNote,

                            part

                        );

                    if (

                        pageFits([

                            ...currentPage.fragments,

                            withNote

                        ])

                    ) {

                        currentPage.fragments.push(
                            withNote
                        );

                        break;

                    }

                }


                /* GUARDAR FRAGMENTO */

                currentPage.fragments.push(

                    makeFragment(

                        entry,

                        currentText,

                        "",

                        part

                    )

                );


                remainingText =
                    nextText;

                if (

                    !remainingText &&

                    !remainingNote

                ) {

                    break;

                }

                createPage();

                part++;

                continue;

            }


            /* NOTAS */

            if (
                remainingNote.length > 0
            ) {

                const cut =
                    findFittingCut(

                        currentPage.fragments,

                        entry,

                        remainingNote,

                        part,

                        "note"

                    );


                if (cut === 0) {

                    if (

                        currentPage.fragments.length > 0

                    ) {

                        createPage();

                        continue;

                    }

                    throw new Error(

                        `La nota de "${entry.title}" no cabe.`

                    );

                }


                const currentNote =

                    remainingNote

                        .slice(0, cut)

                        .trimEnd();


                remainingNote =

                    remainingNote

                        .slice(cut)

                        .replace(
                            /^[ \t]+/,
                            ""
                        );


                currentPage.fragments.push(

                    makeFragment(

                        entry,

                        "",

                        currentNote,

                        part

                    )

                );


                if (
                    !remainingNote
                ) {

                    break;

                }

                createPage();

                part++;

                continue;

            }

            break;

        }

    }

    return pages;

}