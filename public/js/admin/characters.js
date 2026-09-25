import {
    getAdminCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter
} from "../api.js";

import {
    escapeHTML
} from "../utils.js";


/* ========================================
   ADMINISTRACIÓN DE COMPAÑEROS
======================================== */

export function initializeCharactersAdmin(
    onChanged
) {

    const form =
        document.getElementById(
            "character-form"
        );

    const list =
        document.getElementById(
            "admin-character-list"
        );

    const message =
        document.getElementById(
            "character-message"
        );

    const heading =
        document.getElementById(
            "character-editor-heading"
        );

    const saveButton =
        document.getElementById(
            "save-character"
        );

    const cancelButton =
        document.getElementById(
            "cancel-character-edit"
        );


    let editingId = null;

    let characters = [];
    const emotePreview = document.getElementById(
        "character-emote-preview"
    );

    const relationshipInput = document.getElementById(
        "character-relationship"
    );

    const specialEmoteInput = document.getElementById(
        "character-special-emote"
    );


    /* ========================================
       EMOTE AUTOMÁTICO
    ======================================== */

    function getAutomaticEmote(score) {
        if (score <= -3) {
            return "./images/emotes/hostil.png";
        }

        if (score <= 0) {
            return "./images/emotes/baja.png";
        }

        if (score <= 3) {
            return "./images/emotes/conocido.png";
        }

        if (score <= 6) {
            return "./images/emotes/media.png";
        }

        if (score <= 9) {
            return "./images/emotes/alta.png";
        }

        return "./images/emotes/especial.png";
    }


    /* ========================================
       ACTUALIZAR VISTA PREVIA
    ======================================== */

    function updateEmotePreview() {

        const score = Number(
            relationshipInput.value || 0
        );

        const selectedEmote =
            specialEmoteInput.value;

        emotePreview.src =
            selectedEmote || getAutomaticEmote(score);

    }


    /* ========================================
       EVENTOS DE VISTA PREVIA
    ======================================== */

    relationshipInput.addEventListener(
        "input",
        updateEmotePreview
    );

    specialEmoteInput.addEventListener(
        "change",
        updateEmotePreview
    );

    updateEmotePreview();


    /* ========================================
       MENSAJES
    ======================================== */

    function showMessage(text) {
        message.textContent = text;
    }


    /* ========================================
       LIMPIAR FORMULARIO
    ======================================== */

    function resetEditor() {
        editingId = null;

        form.reset();

        heading.textContent =
            "Un nuevo compañero";

        saveButton.textContent =
            "Guardar compañero ♡";

        cancelButton.hidden = true;
        updateEmotePreview();
    }


    /* ========================================
       MOSTRAR LISTA
    ======================================== */

    function renderCharacters() {

        if (characters.length === 0) {
            list.innerHTML = `
                <p>
                    Todavía no hay compañeros guardados.
                </p>
            `;

            return;
        }

        list.innerHTML = characters
            .map(character => `

                <article class="admin-entry">

                    <div>

                        <strong>
                            ${escapeHTML(character.name)}
                        </strong>

                        <p>
                            Relación:
                            ${character.relationship}/10
                        </p>

                        <span class="entry-status">
                            ${
                                character.published
                                    ? "♡ Visible"
                                    : "✎ Oculto"
                            }
                        </span>

                    </div>


                    <div class="admin-entry-actions">

                        <button
                            type="button"
                            class="page-button"
                            data-action="edit"
                            data-id="${character.id}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="page-button"
                            data-action="delete"
                            data-id="${character.id}"
                        >
                            Eliminar
                        </button>

                    </div>

                </article>

            `)
            .join("");
    }


    /* ========================================
       CARGAR DESDE MONGODB
    ======================================== */

    async function refresh() {
        characters =
            await getAdminCharacters();

        renderCharacters();
    }


    /* ========================================
       LEER FORMULARIO
    ======================================== */

    function readForm() {

        const formData = new FormData(form);

        return {

            name: String(
                formData.get("name") || ""
            ).trim(),

            image: "",

            opinion: String(
                formData.get("opinion") || ""
            ).trim(),

            relationship: Number(
                formData.get("relationship") || 0
            ),

            relationshipLabelOverride: String(
                formData.get("relationshipLabelOverride") || ""
            ).trim(),

            specialEmote: String(
                formData.get("specialEmote") || ""
            ).trim(),

            published: formData.has("published")

        };

    }


    /* ========================================
       GUARDAR / ACTUALIZAR
    ======================================== */

    form.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            saveButton.disabled = true;

            try {
                showMessage("");

                const character = readForm();

                let savedCharacter;

                if (editingId) {
                    savedCharacter =
                        await updateCharacter(
                            editingId,
                            character
                        );
                } else {
                    savedCharacter =
                        await createCharacter(
                            character
                        );
                }

                await refresh();

                await onChanged();

                resetEditor();

                showMessage(
                    savedCharacter.published ?
                    "Compañero publicado correctamente ♡" :
                    "Compañero guardado como borrador ♡"
                );

            } catch (error) {
                console.error(error);

                showMessage(
                    error.message
                );

            } finally {
                saveButton.disabled = false;
            }
        }
    );


    /* ========================================
       CANCELAR EDICIÓN
    ======================================== */

    cancelButton.addEventListener(
        "click",
        resetEditor
    );


    /* ========================================
       EDITAR / ELIMINAR
    ======================================== */

    list.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.id;

            const character =
                characters.find(
                    item => item.id === id
                );

            if (!character) {
                return;
            }


            /* EDITAR */

            if (
                button.dataset.action === "edit"
            ) {
                editingId = character.id;

                form.elements.namedItem("name").value =
                    character.name;
                form.elements
                    .namedItem("relationshipLabelOverride")
                    .value =
                    character.relationshipLabelOverride || "";

                form.elements
                    .namedItem("specialEmote")
                    .value =
                    character.specialEmote || "";

                updateEmotePreview();

                form.elements.namedItem("opinion").value =
                    character.opinion;

                form.elements.namedItem("relationship").value =
                    character.relationship;

                form.elements.namedItem("published").checked =
                    character.published;

                heading.textContent =
                    "Editar compañero";

                saveButton.textContent =
                    "Guardar cambios ♡";

                cancelButton.hidden = false;

                form.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                return;
            }


            /* ELIMINAR */

            if (
                button.dataset.action === "delete"
            ) {
                const confirmed = confirm(
                    `¿Eliminar a "${character.name}"? Esta acción no se puede deshacer.`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    await deleteCharacter(id);

                    if (editingId === id) {
                        resetEditor();
                    }

                    await refresh();

                    await onChanged();

                    showMessage(
                        "Compañero eliminado."
                    );

                } catch (error) {
                    showMessage(
                        error.message
                    );
                }
            }
        }
    );


    /* ========================================
       LIMPIAR AL CERRAR SESIÓN
    ======================================== */

    function clear() {
        characters = [];

        list.innerHTML = "";

        resetEditor();

        showMessage("");
    }


    return {
        refresh,
        clear
    };
}