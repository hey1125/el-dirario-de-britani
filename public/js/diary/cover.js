/* ========================================
   PORTADA DE BRITANI
======================================== */

export function renderCoverPage(pageContent) {

    pageContent.innerHTML = `

        <section class="home diary-page">

            <div class="home-decoration">
                ✿ ♡ ✿
            </div>

            <h2 class="home-title">
                ¡Hola! Soy Britani
            </h2>

            <p class="home-subtitle">
                ¡Bienvenido a mi diario!
            </p>

            <img
                src="./images/britani-nina.png"
                alt="Britani a los 11 años"
                class="britani-image"
            >

            <p class="home-description">

                Me llamo Britani y tengo 11 años.

                <br><br>

                Me gusta conocer cosas nuevas,
                hacer preguntas y descubrir lugares.

                <br><br>

                Aquí voy a escribir mis aventuras
                y lo que pienso de las personas
                que conozca.

            </p>

            <p class="page-hint">

                Dale a <strong>Siguiente</strong>
                para pasar la hoja.

            </p>

        </section>

    `;

}