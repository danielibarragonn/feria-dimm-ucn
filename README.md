# Feria vocacional · DIMM UCN

Versión simplificada para mostrar en una pantalla táctil o TV en ferias vocacionales:
`https://danielibarragonn.github.io/feria-dimm-ucn/`

- **Las carreras:** qué hace cada una, temáticas, campo laboral, duración, título y grado.
- **La malla:** resumen año a año (sin prerrequisitos ni avance), con los ramos de proyecto
  destacados y un QR a la malla interactiva completa de esa carrera.
- **Arcade DIMM:** los tres minijuegos (`arcade.html`).
- **Cómo postular:** ponderaciones, vacantes 2027, puntaje de corte 2026, requisitos mínimos,
  vía Plan Común y contacto de Admisión, con QR a la página oficial de cada carrera.

La página usa un lienzo fijo de 1920×1080 que se ajusta a cualquier pantalla y vuelve sola al
inicio tras 90 s sin uso (150 s en el arcade; avisa 10 s antes). Toma los ramos del sitio de mallas interactivas
(`danielibarragonn.github.io/mallas-dimm-ucn/mallas.js`), así que cualquier corrección en ese
repositorio aparece también aquí. Sin internet usa la copia local `mallas.js`: si cambias una malla,
conviene copiar también ese archivo a este repositorio.

## Cómo usarla en el stand

1. Abre la URL en Chrome y presiona **F11** (o el botón "Pantalla completa" del inicio).
   Para un modo kiosko real: `chrome --kiosk https://danielibarragonn.github.io/feria-dimm-ucn/`
2. **Sin internet:** copia la carpeta del repositorio al computador, abre una terminal en ella y
   ejecuta `python -m http.server 8000`; luego abre `http://localhost:8000/`.
   Abrir el archivo con doble clic también funciona, pero en ese caso el arcade no puede detectar
   si alguien está jugando y espera 5 minutos antes de volver al inicio.
   Sin internet las fuentes usan la tipografía del sistema; todo lo demás funciona igual.

## Qué editar

Todo el contenido está en el bloque `FERIA` al inicio del `<script>` de `index.html`:
textos de cada carrera, datos de admisión (actualizarlos cada año desde admision.ucn.cl),
URLs de los QR (mallas, sitio del DIMM e Instagram) y tiempos de inactividad. Los QR se generan solos (`qr.js`).
