# Biblioteca Digital

Aplicación web académica para gestionar una biblioteca con HTML, CSS y JavaScript. Permite consultar un catálogo, buscar y filtrar libros, registrar préstamos y devoluciones, administrar libros y revisar estadísticas

## Funcionalidades
- Cuatro vistas sin recargar la página: catálogo, préstamos, gestión de libros y resumen
- Crear y editar libros con validaciones de título, autor, año, género y duplicados
- Registrar préstamos de 14 días y devoluciones conservando el historial
- Bloquear préstamos de libros de colección y libros que ya tienen un préstamo activo
- Búsqueda por título o autor, filtros por género/estado y ordenación
- Persistencia de datos y preferencia de tema con `localStorage`
- Tema claro/oscuro, modales, notificaciones y diseño adaptable a móviles
- Estadísticas calculadas a partir de los datos registrados

## Cómo ejecutar
1. Descarga o descomprime la carpeta
2. Abre `index.html` en un navegador moderno
3. No requiere instalación de dependencias ni servidor

## Estructura
```text
Biblioteca_Digital/
├── index.html
├── css/
│   └── estilos.css
├── js/
│   ├── datos.js
│   ├── logica.js
│   └── interfaz.js
└── README.md
```

## Organización del código
- `datos.js`: datos iniciales y almacenamiento en el navegador
- `logica.js`: reglas del sistema y validaciones
- `interfaz.js`: renderizado, eventos y conexión con el HTML
- `estilos.css`: diseño visual, responsividad y temas

Proyecto académico de Programación Web
