/* datos.js: datos iniciales y persistencia en localStorage */
const Datos = (() => {
  const CLAVE_LIBROS = "biblioteca_digital_libros";
  const CLAVE_PRESTAMOS = "biblioteca_digital_prestamos";
  const CLAVE_TEMA = "biblioteca_digital_tema";
  const CLAVE_ORDEN = "biblioteca_digital_orden";
  const CLAVE_DIRECCION = "biblioteca_digital_direccion";

  const librosIniciales = [
    { id: "l1", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", anio: 1967, genero: "Novela", coleccion: false },
    { id: "l2", titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", anio: 1605, genero: "Novela", coleccion: false },
    { id: "l3", titulo: "Breve historia del tiempo", autor: "Stephen Hawking", anio: 1988, genero: "Ciencia", coleccion: false },
    { id: "l4", titulo: "La Odisea", autor: "Homero", anio: 1000, genero: "Historia", coleccion: true },
    { id: "l5", titulo: "El principito", autor: "Antoine de Saint-Exupéry", anio: 1943, genero: "Fantasía", coleccion: false },
    { id: "l6", titulo: "Orgullo y prejuicio", autor: "Jane Austen", anio: 1813, genero: "Romance", coleccion: false },
    { id: "l7", titulo: "Romeo y Julieta", autor: "William Shakespeare", anio: 1597, genero: "Tragedia", coleccion: false },
    { id: "l8", titulo: "El arte de la guerra", autor: "Sun Tzu", anio: 2000, genero: "Ensayo", coleccion: true }
  ];

  const fechaRelativa = (dias) => {
    const f = new Date();
    f.setDate(f.getDate() + dias);
    return f.toISOString().slice(0, 10);
  };

  const prestamosIniciales = [
    { id: "p1", idLibro: "l1", persona: "Ana Pérez", fechaPrestamo: fechaRelativa(-20), fechaLimite: fechaRelativa(-6), fechaDevolucion: null },
    { id: "p2", idLibro: "l3", persona: "Carlos Díaz", fechaPrestamo: fechaRelativa(-4), fechaLimite: fechaRelativa(10), fechaDevolucion: null },
    { id: "p3", idLibro: "l2", persona: "Lucía Torres", fechaPrestamo: fechaRelativa(-30), fechaLimite: fechaRelativa(-16), fechaDevolucion: fechaRelativa(-18) },
    { id: "p4", idLibro: "l5", persona: "Marcos Ruiz", fechaPrestamo: fechaRelativa(-12), fechaLimite: fechaRelativa(2), fechaDevolucion: fechaRelativa(-3) }
  ];

  function leer(clave, alternativa) {
    try {
      const valor = localStorage.getItem(clave);
      return valor === null ? null : JSON.parse(valor);
    } catch (error) {
      console.warn("No se pudieron leer los datos guardados:", error);
      return alternativa;
    }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); }
    catch (error) { console.error("No se pudieron guardar los datos:", error); }
  }
  function clonar(valor) { return JSON.parse(JSON.stringify(valor)); }

  let libros = leer(CLAVE_LIBROS, null);
  let prestamos = leer(CLAVE_PRESTAMOS, null);
  if (!Array.isArray(libros)) { libros = clonar(librosIniciales); guardar(CLAVE_LIBROS, libros); }
  if (!Array.isArray(prestamos)) { prestamos = clonar(prestamosIniciales); guardar(CLAVE_PRESTAMOS, prestamos); }

  return {
    get libros() { return libros; },
    get prestamos() { return prestamos; },
    get tema() { return localStorage.getItem(CLAVE_TEMA) || "claro"; },
    get orden() { return localStorage.getItem(CLAVE_ORDEN) || "titulo"; },
    get direccionOrden() { return localStorage.getItem(CLAVE_DIRECCION) || "asc"; },
    guardarLibros() { guardar(CLAVE_LIBROS, libros); },
    guardarPrestamos() { guardar(CLAVE_PRESTAMOS, prestamos); },
    guardarTema(tema) { localStorage.setItem(CLAVE_TEMA, tema); },
    guardarOrden(orden) { localStorage.setItem(CLAVE_ORDEN, orden); },
    guardarDireccionOrden(direccion) { localStorage.setItem(CLAVE_DIRECCION, direccion); },
    generarId(prefijo) { return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; },
    restablecer() {
      libros = clonar(librosIniciales);
      prestamos = clonar(prestamosIniciales);
      guardar(CLAVE_LIBROS, libros);
      guardar(CLAVE_PRESTAMOS, prestamos);
    }
  };
})();
