/* ========================================
   PETICIONES A LA API
======================================== */

async function request(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            `Error HTTP ${response.status}`
        );
    }

    return data;
}


function jsonOptions(method, data) {
    return {
        method,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
    };
}


/* ========================================
   AVENTURAS PÚBLICAS
======================================== */

export function getEntries() {
    return request("/api/entries");
}


/* ========================================
   AUTENTICACIÓN
======================================== */

export function getSession() {
    return request("/api/auth/session");
}


export function login(password) {
    return request(
        "/api/auth/login",
        jsonOptions("POST", {
            password
        })
    );
}


export function logout() {
    return request(
        "/api/auth/logout", {
            method: "POST"
        }
    );
}


/* ========================================
   ADMINISTRACIÓN DE AVENTURAS
======================================== */

export function getAdminEntries() {
    return request(
        "/api/admin/entries"
    );
}


export function createEntry(entry) {
    return request(
        "/api/admin/entries",
        jsonOptions("POST", entry)
    );
}


export function updateEntry(id, entry) {
    return request(
        `/api/admin/entries/${id}`,
        jsonOptions("PUT", entry)
    );
}


export function deleteEntry(id) {
    return request(
        `/api/admin/entries/${id}`, {
            method: "DELETE"
        }
    );
}

/* ========================================
   COMPAÑEROS PÚBLICOS
======================================== */

export function getCharacters() {
    return request("/api/characters");
}


/* ========================================
   COMPAÑEROS DEL ADMINISTRADOR
======================================== */

export function getAdminCharacters() {
    return request(
        "/api/admin/characters"
    );
}


/* ========================================
   AGREGAR COMPAÑERO
======================================== */

export function createCharacter(character) {
    return request(
        "/api/admin/characters",
        jsonOptions("POST", character)
    );
}


/* ========================================
   EDITAR COMPAÑERO
======================================== */

export function updateCharacter(id, character) {
    return request(
        `/api/admin/characters/${id}`,
        jsonOptions("PUT", character)
    );
}


/* ========================================
   ELIMINAR COMPAÑERO
======================================== */

export function deleteCharacter(id) {
    return request(
        `/api/admin/characters/${id}`, {
            method: "DELETE"
        }
    );
}