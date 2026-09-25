/* ========================================
   ESCAPAR TEXTO PARA HTML
======================================== */

export function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ========================================
   RELACIÓN ENTRE 0 Y 10
======================================== */

export function clampRelationship(value) {
    return Math.max(
        0,
        Math.min(10, Number(value) || 0)
    );
}