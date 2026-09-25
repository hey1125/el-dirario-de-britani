import {
    getSession,
    login,
    logout,
    getAdminEntries,
    createEntry,
    updateEntry,
    deleteEntry
} from "../api.js";


import {
    escapeHTML
} from "../utils.js";


import {
    initializeCharactersAdmin
} from "./characters.js";


/* ========================================
   ADMINISTRACIÓN DEL DIARIO
======================================== */

export function initializeEditor(
    onChanged,
    onCharactersChanged
) {

    const toggleButton =
        document.getElementById(
            "toggle-editor"
        );

    const panel =
        document.getElementById(
            "editor-panel"
        );

    const loginForm =
        document.getElementById(
            "login-form"
        );

    const adminContent =
        document.getElementById(
            "admin-content"
        );

    const entryForm =
        document.getElementById(
            "entry-form"
        );

    const entryList =
        document.getElementById(
            "admin-entry-list"
        );

    const message =
        document.getElementById(
            "admin-message"
        );

    const heading =
        document.getElementById(
            "editor-heading"
        );

    const cancelEditButton =
        document.getElementById(
            "cancel-edit"
        );

    const logoutButton =
        document.getElementById(
            "logout-button"
        );

    const saveButton =
        document.getElementById(
            "save-entry"
        );


    let editingId = null;

    let adminEntries = [];


    /* ========================================
       INICIALIZAR COMPAÑEROS
    ======================================== */

    const charactersAdmin =
        initializeCharactersAdmin(
            onCharactersChanged
        );


    /* ========================================
       MENSAJES
    ======================================== */

    function showMessage(text) {
        message.textContent = text;
    }


    /* ========================================
       ESTADO DE SESIÓN
    ======================================== */

    function setAuthenticated(
        authenticated
    ) {
        loginForm.hidden =
            authenticated;

        adminContent.hidden = !authenticated;

        if (!authenticated) {
            editingId = null;

            adminEntries = [];

            entryList.innerHTML = "";

            charactersAdmin.clear();
        }
    }


    /* ========================================
       LIMPIAR FORMULARIO
    ======================================== */

    function resetEditor() {
        editingId = null;

        entryForm.reset();

        heading.textContent =
            "Una nueva aventura";

        saveButton.textContent =
            "Guardar aventura ♡";

        cancelEditButton.hidden =
            true;
    }


    /* ========================================
       MOSTRAR AVENTURAS
    ======================================== */

    function renderAdminEntries() {

        if (
            adminEntries.length === 0
        ) {
            entryList.innerHTML = `
                <p>
                    Todavía no hay aventuras guardadas.
                </p>
            `;

            return;
        }

        entryList.innerHTML =
            adminEntries
            .map(entry => `

                    <article class="admin-entry">

                        <div>

                            <strong>
                                ${escapeHTML(entry.title)}
                            </strong>

                            <p>
                                Sesión ${escapeHTML(entry.session)}
                                · ${escapeHTML(entry.date)}
                            </p>

                            <span class="entry-status">
                                ${
                                    entry.published
                                        ? "♡ Publicada"
                                        : "✎ Borrador"
                                }
                            </span>

                        </div>


                        <div class="admin-entry-actions">

                            <button
                                type="button"
                                class="page-button"
                                data-action="edit"
                                data-id="${entry.id}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="page-button"
                                data-action="delete"
                                data-id="${entry.id}"
                            >
                                Eliminar
                            </button>

                        </div>

                    </article>

                `)
            .join("");
    }


    /* ========================================
       RECARGAR AVENTURAS
    ======================================== */

    async function refreshAdminEntries() {
        adminEntries =
            await getAdminEntries();

        renderAdminEntries();
    }


    /* ========================================
       ABRIR / CERRAR ADMINISTRACIÓN
    ======================================== */

    toggleButton.addEventListener(
        "click",

        async() => {
            panel.hidden = !panel.hidden;

            if (
                panel.hidden
            ) {
                return;
            }

            try {
                showMessage("");

                const session =
                    await getSession();

                setAuthenticated(
                    session.authenticated
                );

                if (
                    session.authenticated
                ) {
                    await refreshAdminEntries();

                    await charactersAdmin.refresh();
                }

            } catch (error) {
                showMessage(
                    error.message
                );
            }
        }
    );


    /* ========================================
       INICIAR SESIÓN
    ======================================== */

    loginForm.addEventListener(
        "submit",

        async event => {
            event.preventDefault();

            const password =
                document.getElementById(
                    "admin-password"
                ).value;

            try {
                showMessage("");

                await login(
                    password
                );

                loginForm.reset();

                setAuthenticated(true);

                await refreshAdminEntries();

                await charactersAdmin.refresh();

                showMessage(
                    "¡Bienvenida al rincón secreto!"
                );

            } catch (error) {
                showMessage(
                    error.message
                );
            }
        }
    );


    /* ========================================
       CERRAR SESIÓN
    ======================================== */

    logoutButton.addEventListener(
        "click",

        async() => {
            try {
                await logout();

                resetEditor();

                setAuthenticated(false);

                showMessage(
                    "Sesión cerrada."
                );

            } catch (error) {
                showMessage(
                    error.message
                );
            }
        }
    );


    /* ========================================
       CANCELAR EDICIÓN
    ======================================== */

    cancelEditButton.addEventListener(
        "click",

        resetEditor
    );


    /* ========================================
       LEER FORMULARIO
    ======================================== */

    function readForm() {
        const formData =
            new FormData(entryForm);

        return {
            title: String(
                formData.get("title") || ""
            ).trim(),

            session: Number(
                formData.get("session") || 0
            ),

            date: String(
                formData.get("date") || ""
            ).trim(),

            content: String(
                formData.get("content") || ""
            ).trim(),

            note: String(
                formData.get("note") || ""
            ).trim(),

            published: formData.has("published")
        };
    }


    /* ========================================
       GUARDAR / ACTUALIZAR
    ======================================== */

    entryForm.addEventListener(
        "submit",

        async event => {
            event.preventDefault();

            const entry =
                readForm();

            saveButton.disabled = true;

            try {
                showMessage("");

                let savedEntry;

                if (editingId) {
                    savedEntry =
                        await updateEntry(
                            editingId,
                            entry
                        );

                } else {
                    savedEntry =
                        await createEntry(
                            entry
                        );
                }

                await refreshAdminEntries();

                await onChanged(
                    savedEntry.id
                );

                resetEditor();

                showMessage(
                    savedEntry.published ?
                    "Aventura publicada correctamente ♡" :
                    "Aventura guardada como borrador ♡"
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
       EDITAR / ELIMINAR
    ======================================== */

    entryList.addEventListener(
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

            const entry =
                adminEntries.find(
                    item => item.id === id
                );

            if (!entry) {
                return;
            }


            /* EDITAR */

            if (
                button.dataset.action === "edit"
            ) {
                editingId =
                    entry.id;

                entryForm.elements
                    .namedItem("title")
                    .value =
                    entry.title;

                entryForm.elements
                    .namedItem("session")
                    .value =
                    entry.session;

                entryForm.elements
                    .namedItem("date")
                    .value =
                    entry.date;

                entryForm.elements
                    .namedItem("content")
                    .value =
                    entry.content;

                entryForm.elements
                    .namedItem("note")
                    .value =
                    entry.note;

                entryForm.elements
                    .namedItem("published")
                    .checked =
                    entry.published;

                heading.textContent =
                    "Editar aventura";

                saveButton.textContent =
                    "Guardar cambios ♡";

                cancelEditButton.hidden =
                    false;

                entryForm.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                return;
            }


            /* ELIMINAR */

            if (
                button.dataset.action === "delete"
            ) {
                const confirmed =
                    confirm(
                        `¿Eliminar "${entry.title}"? Esta acción no se puede deshacer.`
                    );

                if (!confirmed) {
                    return;
                }

                try {
                    await deleteEntry(
                        id
                    );

                    if (
                        editingId === id
                    ) {
                        resetEditor();
                    }

                    await refreshAdminEntries();

                    await onChanged(null);

                    showMessage(
                        "Aventura eliminada."
                    );

                } catch (error) {
                    showMessage(
                        error.message
                    );
                }
            }
        }
    );
}