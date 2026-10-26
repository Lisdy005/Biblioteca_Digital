/* interfaz.js: renderizado, eventos y conexión con la interfaz HTML */
(() => {
  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
  let vistaActual = "catalogo";
  let filtroPrestamos = "activos";
  let libroEnEdicion = null;
  let accionPendiente = null;

  const escapar = (valor) => String(valor).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fecha = (valor) => valor ? new Date(valor + "T00:00:00").toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  function notificar(mensaje, tipo = "exito") {
    const nodo = document.createElement("div");
    nodo.className = `notificacion ${tipo}`;
    nodo.textContent = mensaje;
    $("#notificaciones").append(nodo);
    setTimeout(() => nodo.remove(), 4000);
  }
  function cambiarVista(nombre) {
    vistaActual = nombre;
    $$(".vista").forEach(v => v.classList.toggle("activa", v.id === `vista-${nombre}`));
    $$("[data-vista]").forEach(b => b.classList.toggle("activo", b.dataset.vista === nombre && b.classList.contains("enlace-nav")));
    if (nombre === "catalogo") renderizarCatalogo();
    if (nombre === "prestamos") renderizarPrestamos();
    if (nombre === "resumen") renderizarResumen();
    if (nombre === "formulario") $("#titulo-libro").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function llenarGeneros() {
    const select = $("#filtro-genero");
    const seleccionado = select.value;
    const generos = [...new Set(Datos.libros.map(l => l.genero))].sort((a, b) => a.localeCompare(b, "es"));
    select.innerHTML = '<option value="">Todos los géneros</option>' + generos.map(g => `<option value="${escapar(g)}">${escapar(g)}</option>`).join("");
    select.value = generos.includes(seleccionado) ? seleccionado : "";
  }
  function renderizarContadores() {
    const r = Logica.resumen();
    $("#total-libros").textContent = r.total;
    $("#total-disponibles").textContent = r.disponibles;
    $("#total-prestados").textContent = r.prestados;
  }
  function renderizarCatalogo() {
    llenarGeneros();
    renderizarContadores();
    const libros = Logica.buscarLibros({
      texto: $("#buscar-libros").value, genero: $("#filtro-genero").value,
      estado: $("#filtro-estado").value, orden: $("#ordenar-por").value, direccion: $("#direccion-orden").value
    });
    $("#lista-libros").innerHTML = libros.map(libro => {
      const estado = Logica.estadoLibro(libro);
      const prestamo = Logica.prestamoActivo(libro.id);
      const badge = estado === "coleccion" ? "Colección" : estado === "prestado" ? "Prestado" : "Disponible";
      const clase = estado === "coleccion" ? "badge-coleccion" : estado === "prestado" ? "badge-prestado" : "badge-disponible";
      return `<article class="libro-card">
        <div class="libro-portada ${clase}"><span class="portada-simbolo">▤</span><span>${escapar(libro.genero)}</span></div>
        <div class="libro-info"><div class="libro-meta"><span class="badge ${clase}">${badge}</span><span>${libro.anio}</span></div>
          <h3>${escapar(libro.titulo)}</h3><p class="autor">${escapar(libro.autor)}</p>
          ${prestamo ? `<p class="detalle-prestamo">Prestado a ${escapar(prestamo.persona)}</p>` : ""}
          <div class="libro-acciones">
            <button class="boton boton-pequeno boton-principal" type="button" data-accion="prestar" data-id="${libro.id}" ${estado !== "disponible" ? "disabled" : ""}>Prestar</button>
            <button class="boton boton-pequeno boton-secundario" type="button" data-accion="editar" data-id="${libro.id}">Editar</button>
            <button class="boton boton-pequeno boton-texto" type="button" data-accion="eliminar" data-id="${libro.id}">Eliminar</button>
          </div>
        </div></article>`;
    }).join("");
    $("#mensaje-catalogo-vacio").classList.toggle("oculto", libros.length !== 0);
  }
  function renderizarPrestamos() {
    const prestamos = Logica.obtenerPrestamos(filtroPrestamos);
    $("#lista-prestamos").innerHTML = prestamos.map(p => {
      const libro = Logica.libroPorId(p.idLibro);
      const vencido = Logica.estaVencido(p);
      const etiqueta = p.fechaDevolucion ? "Devuelto" : vencido ? "Vencido" : "Activo";
      const clase = p.fechaDevolucion ? "badge-disponible" : vencido ? "badge-vencido" : "badge-prestado";
      return `<article class="prestamo-card"><div class="prestamo-icono">↗</div><div class="prestamo-detalle"><div class="libro-meta"><span class="badge ${clase}">${etiqueta}</span><span>Préstamo: ${fecha(p.fechaPrestamo)}</span></div><h3>${escapar(libro ? libro.titulo : "Libro eliminado")}</h3><p>Persona: <strong>${escapar(p.persona)}</strong></p><p>Fecha límite: ${fecha(p.fechaLimite)}${p.fechaDevolucion ? ` · Devolución: ${fecha(p.fechaDevolucion)}` : ""}</p>${vencido ? `<p class="texto-peligro">Retraso: ${Logica.diasRetraso(p)} día(s)</p>` : ""}</div>
      ${p.fechaDevolucion === null ? `<button class="boton boton-secundario" data-accion="devolver" data-id="${p.id}" type="button">Registrar devolución</button>` : `<span class="estado-final">✓ Completado</span>`}</article>`;
    }).join("");
    $("#mensaje-prestamos-vacio").classList.toggle("oculto", prestamos.length !== 0);
    $$(".pestana").forEach(b => b.classList.toggle("activa", b.dataset.filtroPrestamo === filtroPrestamos));
  }
  function renderizarResumen() {
    const r = Logica.resumen();
    const datos = [
      ["Total de libros", r.total, "Todos los títulos registrados", "violeta"],
      ["Disponibles", r.disponibles, "Listos para prestar", "verde"],
      ["Préstamos activos", r.prestados, "Libros actualmente prestados", "naranja"],
      ["Libros de colección", r.coleccion, "No se pueden prestar", "azul"],
      ["Préstamos vencidos", r.vencidos, "Necesitan seguimiento", "rojo"],
      ["Devoluciones", r.devueltos, "Préstamos completados", "verde"]
    ];
    $("#tarjetas-resumen").innerHTML = datos.map(d => `<article class="estadistica-card"><span class="mini-icono ${d[3]}">▦</span><strong>${d[1]}</strong><h3>${d[0]}</h3><p>${d[2]}</p></article>`).join("");
    $("#ajuste-tema").checked = document.body.classList.contains("tema-oscuro");
  }
  function limpiarFormulario() {
    $("#formulario-libro").reset();
    $("#id-libro").value = "";
    libroEnEdicion = null;
    $("#titulo-formulario").textContent = "Gestionar libros";
    $("#guardar-libro").textContent = "Guardar libro";
    $("#cancelar-edicion").classList.add("oculto");
    $("#mensaje-formulario").textContent = "";
  }
  function editarLibro(id) {
    const l = Logica.libroPorId(id);
    if (!l) return;
    libroEnEdicion = id;
    $("#id-libro").value = l.id; $("#titulo-libro").value = l.titulo;
    $("#autor-libro").value = l.autor; $("#anio-libro").value = l.anio;
    $("#genero-libro").value = l.genero; $("#coleccion-libro").checked = l.coleccion;
    $("#titulo-formulario").textContent = "Editar libro";
    $("#guardar-libro").textContent = "Guardar cambios";
    $("#cancelar-edicion").classList.remove("oculto");
    cambiarVista("formulario");
  }
  function abrirPrestamo(id) {
    const libro = Logica.libroPorId(id);
    if (!libro) return;
    $("#id-libro-prestamo").value = id;
    $("#nombre-libro-modal").textContent = libro.titulo;
    $("#persona-prestamo").value = "";
    $("#mensaje-modal-prestamo").textContent = "";
    $("#modal-prestamo").showModal();
    $("#persona-prestamo").focus();
  }
  function pedirConfirmacion(titulo, texto, accion) {
    $("#titulo-confirmacion").textContent = titulo;
    $("#texto-confirmacion").textContent = texto;
    accionPendiente = accion;
    $("#modal-confirmacion").showModal();
  }
  function manejarAccion(accion, id) {
    if (accion === "prestar") abrirPrestamo(id);
    if (accion === "editar") editarLibro(id);
    if (accion === "eliminar") {
      const libro = Logica.libroPorId(id);
      pedirConfirmacion("¿Eliminar este libro?", `Se eliminará "${libro ? libro.titulo : "este libro"}" y su historial. Esta acción no se puede deshacer.`, () => {
        const resultado = Logica.eliminarLibro(id);
        notificar(resultado.mensaje, resultado.ok ? "exito" : "error");
        renderizarTodo();
      });
    }
    if (accion === "devolver") {
      const p = Datos.prestamos.find(x => x.id === id);
      pedirConfirmacion("¿Registrar devolución?", `Confirma que ${p ? p.persona : "la persona"} ha devuelto el libro.`, () => {
        const resultado = Logica.devolverPrestamo(id);
        notificar(resultado.mensaje, resultado.ok ? "exito" : "error");
        renderizarPrestamos(); renderizarContadores();
      });
    }
  }
  function renderizarTodo() {
    $("#ordenar-por").value = Datos.orden;
    $("#direccion-orden").value = Datos.direccionOrden;
    renderizarCatalogo(); renderizarPrestamos(); renderizarResumen();
  }
  function aplicarTema(tema) {
    document.body.classList.toggle("tema-oscuro", tema === "oscuro");
    Datos.guardarTema(tema);
    $("#ajuste-tema").checked = tema === "oscuro";
  }

  document.addEventListener("click", e => {
    const navegacion = e.target.closest("[data-vista]");
    if (navegacion) { e.preventDefault(); cambiarVista(navegacion.dataset.vista); return; }
    const accion = e.target.closest("[data-accion]");
    if (accion) manejarAccion(accion.dataset.accion, accion.dataset.id);
    const cerrar = e.target.closest("[data-cerrar-modal]");
    if (cerrar) cerrar.closest("dialog").close();
  });

  $("#buscar-libros").addEventListener("input", renderizarCatalogo);
  $("#filtro-genero").addEventListener("change", renderizarCatalogo);
  $("#filtro-estado").addEventListener("change", renderizarCatalogo);
  $("#ordenar-por").addEventListener("change", () => { Datos.guardarOrden($("#ordenar-por").value); renderizarCatalogo(); });
  $("#direccion-orden").addEventListener("change", () => { Datos.guardarDireccionOrden($("#direccion-orden").value); renderizarCatalogo(); });
  $$(".pestana").forEach(b => b.addEventListener("click", () => { filtroPrestamos = b.dataset.filtroPrestamo; renderizarPrestamos(); }));

  $("#formulario-libro").addEventListener("submit", e => {
    e.preventDefault();
    const estabaEditando = libroEnEdicion !== null;
    const resultado = Logica.agregarOEditarLibro({
      id: $("#id-libro").value, titulo: $("#titulo-libro").value, autor: $("#autor-libro").value,
      anio: $("#anio-libro").value, genero: $("#genero-libro").value, coleccion: $("#coleccion-libro").checked
    });
    $("#mensaje-formulario").textContent = resultado.mensaje;
    $("#mensaje-formulario").className = `mensaje-formulario campo-completo ${resultado.ok ? "mensaje-ok" : "mensaje-error"}`;
    if (resultado.ok) {
      limpiarFormulario(); renderizarTodo(); notificar(resultado.mensaje); cambiarVista("catalogo");
      if (estabaEditando) notificar("Los cambios del libro se guardaron correctamente.");
    }
  });
  $("#cancelar-edicion").addEventListener("click", () => { limpiarFormulario(); cambiarVista("catalogo"); });
  $("#limpiar-formulario").addEventListener("click", () => setTimeout(limpiarFormulario, 0));

  $("#formulario-prestamo").addEventListener("submit", e => {
    e.preventDefault();
    const resultado = Logica.prestarLibro($("#id-libro-prestamo").value, $("#persona-prestamo").value);
    $("#mensaje-modal-prestamo").textContent = resultado.mensaje;
    $("#mensaje-modal-prestamo").className = `mensaje-formulario ${resultado.ok ? "mensaje-ok" : "mensaje-error"}`;
    if (resultado.ok) { $("#modal-prestamo").close(); notificar(resultado.mensaje); renderizarTodo(); }
  });
  $("#confirmar-accion").addEventListener("click", () => {
    if (accionPendiente) accionPendiente();
    accionPendiente = null; $("#modal-confirmacion").close();
  });
  $("#boton-tema").addEventListener("click", () => aplicarTema(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro"));
  $("#ajuste-tema").addEventListener("change", e => aplicarTema(e.target.checked ? "oscuro" : "claro"));
  $("#restablecer-datos").addEventListener("click", () => pedirConfirmacion("¿Restablecer la biblioteca?", "Se reemplazarán tus datos actuales por los datos de ejemplo.", () => {
    Datos.restablecer(); limpiarFormulario(); renderizarTodo(); notificar("La biblioteca se ha restablecido.");
  }));

  aplicarTema(Datos.tema);
  renderizarTodo();
})();
