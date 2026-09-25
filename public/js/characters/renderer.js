import {
    escapeHTML
} from "../utils.js";


/* ========================================
   CONFIGURACIÓN DE EMOTES
======================================== */

const EMOTES = {
    hostile: "./images/emotes/hostil.png",
    low: "./images/emotes/baja.png",
    known: "./images/emotes/conocido.png",
    medium: "./images/emotes/media.png",
    high: "./images/emotes/alta.png",
    special: "./images/emotes/especial.png"
};


/* ========================================
   OBTENER VALOR DE RELACIÓN
======================================== */

function getRelationshipScore(character) {
    const score = Number(character.relationship);

    return Number.isFinite(score) ?
        score :
        0;
}


/* ========================================
   EMOTE SEGÚN EL NIVEL
======================================== */

function getEmoteByRange(score) {

    if (score <= -3) {
        return EMOTES.hostile;
    }

    if (score <= 0) {
        return EMOTES.low;
    }

    if (score <= 3) {
        return EMOTES.known;
    }

    if (score <= 6) {
        return EMOTES.medium;
    }

    if (score <= 9) {
        return EMOTES.high;
    }

    return EMOTES.special;
}


/* ========================================
   EMOTE PERSONALIZADO O GENERAL
======================================== */

function getRelationshipEmote(character) {

    const specialEmote = String(
        character.specialEmote || ""
    ).trim();

    if (specialEmote) {
        return specialEmote;
    }

    const score = getRelationshipScore(character);

    return getEmoteByRange(score);
}


/* ========================================
   NOMBRE GENERAL DE LA RELACIÓN
======================================== */

function getDefaultRelationshipLabel(score) {

    if (score <= -3) {
        return "Rechazo";
    }

    if (score < 0) {
        return "Desconfianza";
    }

    if (score === 0) {
        return "Neutral";
    }

    if (score <= 3) {
        return "Conocido";
    }

    if (score <= 6) {
        return "Confianza";
    }

    if (score <= 9) {
        return "Cariño";
    }

    return "Vínculo especial";
}


/* ========================================
   NOMBRE PERSONALIZADO O GENERAL
======================================== */

function getRelationshipLabel(character) {

    const customLabel = String(
        character.relationshipLabelOverride || ""
    ).trim();

    if (customLabel) {
        return customLabel;
    }

    const score = getRelationshipScore(character);

    return getDefaultRelationshipLabel(score);
}


/* ========================================
   BARRA DE RELACIÓN
======================================== */

function createRelationshipBar(score) {

    let html = "";

    for (let i = 1; i <= 10; i++) {

        const filled =
            i <= score ?
            "filled" :
            "";

        html += `
            <span
                class="relationship-point ${filled}"
            ></span>
        `;
    }

    return html;
}


/* ========================================
   MOSTRAR COMPAÑEROS
======================================== */

export function renderRelationships(characters) {

    const pageContent =
        document.getElementById("page-content");

    const pageControls =
        document.getElementById("page-controls");

    const visibleSheet =
        document.querySelector(
            ".book > .book-content"
        );


    let html = `

        <section>

            <h2 class="section-title">
                Mis compañeros ♡
            </h2>

            <p class="section-description">
                Lo que pienso de las personas
                que voy conociendo.
            </p>

            <div class="characters-grid">

    `;


    if (characters.length === 0) {

        html += `

            <div class="empty-message">
                ¡Todavía tengo que llenar estas páginas!
            </div>

        `;

    }


    characters.forEach(character => {

        const score =
            getRelationshipScore(character);

        const emote =
            getRelationshipEmote(character);

        const relationshipLabel =
            getRelationshipLabel(character);


        html += `

            <article class="character">

                <img
                    src="${escapeHTML(emote)}"
                    class="character-emote"
                    alt="Expresión de Britani"
                >

                <div
                    class="character-placeholder"
                    hidden
                >
                    ♡
                </div>

                <h3 class="character-name">
                    ${escapeHTML(character.name)}
                </h3>

                <p class="character-opinion">
                    ${escapeHTML(character.opinion)}
                </p>

                <div class="relationship-header">

                    <span>
                        Nuestra relación
                    </span>

                    <span class="relationship-value">
                        ${escapeHTML(score)}
                    </span>

                </div>

                <div class="relationship-bar">
                    ${createRelationshipBar(score)}
                </div>

                <div class="relationship-label">
                    ${escapeHTML(relationshipLabel)}
                </div>

            </article>

        `;

    });


    html += `

            </div>

        </section>

    `;


    visibleSheet.classList.remove(
        "is-cover"
    );

    visibleSheet.classList.add(
        "is-relationships"
    );

    pageContent.innerHTML = html;

    pageControls.hidden = true;


    /* ========================================
       IMAGEN NO ENCONTRADA
    ======================================== */

    pageContent
        .querySelectorAll(".character-emote")
        .forEach(image => {

            image.addEventListener(
                "error",
                () => {

                    image.hidden = true;

                    const fallback =
                        image.nextElementSibling;

                    if (fallback) {
                        fallback.hidden = false;
                    }

                }
            );

        });

}