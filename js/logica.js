/* logica.js: reglas de negocio. No manipula el DOM */
const Logica = (() => {
  const hoy = () => new Date().toISOString().slice(0, 10);
  const libroPorId = (id) => Datos.libros.find(libro => libro.id === id);
  const prestamoActivo = (idLibro) => Datos.prestamos.find(p => p.idLibro === idLibro && p.fechaDevolucion === null);
  const diasEntre = (inicio, fin) => Math.floor((new Date(fin + "T00:00:00") - new Date(inicio + "T00:00:00")) / 86400000);

  function estadoLibro(libro) {
    if (libro.coleccion) return "coleccion";
    return prestamoActivo(libro.id) ? "prestado" : "disponible";
  }
  function diasRetraso(prestamo) {
    const fechaFin = prestamo.fechaDevolucion || hoy();
    return Math.max(0, diasEntre(prestamo.fechaLimite, fechaFin));
  }
  function estaVencido(prestamo) {
    return prestamo.fechaDevolucion === null && prestamo.fechaLimite < hoy();
  }
  function validarLibro(datos, idActual = "") {
    const titulo = String(datos.titulo || "").trim();
    const autor = String(datos.autor || "").trim();
    const anio = Number(datos.anio);
    const genero = String(datos.genero || "").trim();
    if (titulo.length < 3 || titulo.length > 60) return "El título debe tener entre 3 y 60 caracteres.";
    if (!autor) return "Escribe el nombre del autor.";
    if (!Number.isInteger(anio) || anio < 1000 || anio > 2026) return "El año debe ser un número entre 1000 y 2026.";
    if (!genero) return "Selecciona un género.";
    const duplicado = Datos.libros.some(l => l.id !== idActual && l.titulo.trim().toLocaleLowerCase() === titulo.toLocaleLowerCase() && l.autor.trim().toLocaleLowerCase() === autor.toLocaleLowerCase());
    if (duplicado) return "Ya existe un libro con ese título y autor.";
    return "";
  }
  function agregarOEditarLibro(datos) {
    const id = datos.id || "";
    const error = validarLibro(datos, id);
    if (error) return { ok: false, mensaje: error };
    const libro = { id: id || Datos.generarId("libro"), titulo: datos.titulo.trim(), autor: datos.autor.trim(), anio: Number(datos.anio), genero: datos.genero, coleccion: Boolean(datos.coleccion) };
    if (id) {
      const indice = Datos.libros.findIndex(l => l.id === id);
      if (indice < 0) return { ok: false, mensaje: "No se encontró el libro que intentas editar." };
      Datos.libros[indice] = libro;
    } else Datos.libros.push(libro);
    Datos.guardarLibros();
    return { ok: true, mensaje: id ? "Libro actualizado correctamente." : "Libro agregado correctamente.", libro };
  }
  function eliminarLibro(id) {
    if (prestamoActivo(id)) return { ok: false, mensaje: "No puedes eliminar un libro que tiene un préstamo activo." };
    const indice = Datos.libros.findIndex(l => l.id === id);
    if (indice < 0) return { ok: false, mensaje: "El libro ya no existe." };
    Datos.libros.splice(indice, 1);
    for (let i = Datos.prestamos.length - 1; i >= 0; i--) if (Datos.prestamos[i].idLibro === id) Datos.prestamos.splice(i, 1);
    Datos.guardarLibros(); Datos.guardarPrestamos();
    return { ok: true, mensaje: "Libro eliminado junto con su historial de préstamos." };
  }
  function prestarLibro(idLibro, persona) {
    const nombre = String(persona || "").trim();
    if (nombre.length < 2 || nombre.length > 40) return { ok: false, mensaje: "El nombre debe tener entre 2 y 40 caracteres." };
    const libro = libroPorId(idLibro);
    if (!libro) return { ok: false, mensaje: "No se encontró el libro." };
    if (libro.coleccion) return { ok: false, mensaje: "Los libros de colección no se pueden prestar." };
    if (prestamoActivo(idLibro)) return { ok: false, mensaje: "Este libro ya tiene un préstamo activo." };
    const activos = Datos.prestamos.filter(p => p.fechaDevolucion === null).length;
    if (activos >= 3) return { ok: false, mensaje: "Se alcanzó el límite de 3 préstamos activos." };
    const fechaPrestamo = hoy();
    const limite = new Date(fechaPrestamo + "T00:00:00"); limite.setDate(limite.getDate() + 14);
    Datos.prestamos.push({ id: Datos.generarId("prestamo"), idLibro, persona: nombre, fechaPrestamo, fechaLimite: limite.toISOString().slice(0, 10), fechaDevolucion: null });
    Datos.guardarPrestamos();
    return { ok: true, mensaje: `Préstamo registrado para ${nombre}.` };
  }
  function devolverPrestamo(id) {
    const prestamo = Datos.prestamos.find(p => p.id === id);
    if (!prestamo || prestamo.fechaDevolucion !== null) return { ok: false, mensaje: "Este préstamo no está activo." };
    prestamo.fechaDevolucion = hoy();
    Datos.guardarPrestamos();
    return { ok: true, mensaje: "Devolución registrada correctamente." };
  }
  function buscarLibros(criterios = {}) {
    let resultado = Datos.libros.filter(libro => {
      const texto = (criterios.texto || "").trim().toLocaleLowerCase();
      const coincideTexto = !texto || libro.titulo.toLocaleLowerCase().includes(texto) || libro.autor.toLocaleLowerCase().includes(texto);
      const coincideGenero = !criterios.genero || libro.genero === criterios.genero;
      const estado = estadoLibro(libro);
      const coincideEstado = !criterios.estado || estado === criterios.estado;
      return coincideTexto && coincideGenero && coincideEstado;
    });
    const orden = criterios.orden || Datos.orden;
    const direccion = criterios.direccion || Datos.direccionOrden;
    resultado.sort((a, b) => {
      const va = a[orden], vb = b[orden];
      const comparacion = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
      return direccion === "desc" ? -comparacion : comparacion;
    });
    return resultado;
  }
  function obtenerPrestamos(tipo = "activos") {
    let resultado = [...Datos.prestamos];
    if (tipo === "activos") resultado = resultado.filter(p => p.fechaDevolucion === null);
    if (tipo === "vencidos") resultado = resultado.filter(estaVencido);
    if (tipo === "historial") resultado = resultado.filter(p => p.fechaDevolucion !== null);
    return resultado.sort((a, b) => b.fechaPrestamo.localeCompare(a.fechaPrestamo));
  }
  function resumen() {
    const activos = Datos.prestamos.filter(p => p.fechaDevolucion === null);
    return {
      total: Datos.libros.length,
      disponibles: Datos.libros.filter(l => estadoLibro(l) === "disponible").length,
      prestados: activos.length,
      coleccion: Datos.libros.filter(l => l.coleccion).length,
      vencidos: activos.filter(estaVencido).length,
      devueltos: Datos.prestamos.filter(p => p.fechaDevolucion !== null).length
    };
  }
  return { libroPorId, prestamoActivo, estadoLibro, diasRetraso, estaVencido, validarLibro, agregarOEditarLibro, eliminarLibro, prestarLibro, devolverPrestamo, buscarLibros, obtenerPrestamos, resumen, hoy };
})();
