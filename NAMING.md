# Naming de materiales

Este archivo explica cómo nombrar archivos y dónde ponerlos para que pasen la validación del sitio.

## Formato del archivo

```text
CODIGOCURSO_AÑO_SEMESTRE_NOMBRECURSO_TIPO_NUMERO[_PROFESOR].ext
```

Ejemplo:

```text
CIT1100_2026_1_programacion_guia_1.pdf
```

Si hay más de un material del mismo tipo y número para el mismo curso, se puede agregar el apellido del profesor al final:

```text
CIT1100_2026_1_programacion_control_2_frez1.pdf
CIT1100_2026_1_programacion_control_2_frez2.pdf
CIT1100_2026_1_programacion_control_2_venegas.pdf
```

## Partes del nombre

`CODIGOCURSO`: código oficial del ramo. Usar exactamente el código listado en `COURSES.md`.

`AÑO`: año con cuatro dígitos.

`SEMESTRE`: `1`, `2` o `verano`.

`NOMBRECURSO`: nombre corto del curso en el sitio. Usar el ID listado en `COURSES.md`.

`TIPO`: tipo de material. Debe ser uno de los valores de la tabla siguiente.

`NUMERO`: número del material dentro de su tipo. Ejemplo: `guia_1`, `control_2`, `tarea_3`.

`PROFESOR`: opcional. Usarlo solo cuando ayude a distinguir materiales que tendrían el mismo nombre.

## Tipos y carpetas

| Tipo en archivo/JSON | Carpeta |
| --- | --- |
| ayudantia | ayudantias |
| guia | guias |
| control | controles |
| prueba | pruebas |
| examen | examenes |
| resumen | resumenes |
| apunte | apuntes |
| tarea | tareas |
| laboratorio | laboratorios |
| codigo | codigo |
| dataset | datasets |

## Kind del material

En el JSON, `kind` debe ser uno de estos valores:

```text
enunciado, pauta, solucion, slides, codigo, dataset, grabacion, material
```

## Ruta del archivo

El archivo físico va dentro de `public/`:

```text
public/files/courses/NOMBRECURSO/AÑO-SEMESTRE/CARPETA/CODIGOCURSO_AÑO_SEMESTRE_NOMBRECURSO_TIPO_NUMERO.ext
```

Ejemplo:

```text
public/files/courses/programacion/2026-1/guias/CIT1100_2026_1_programacion_guia_1.pdf
```

En el JSON, la ruta va sin `public`:

```text
/files/courses/programacion/2026-1/guias/CIT1100_2026_1_programacion_guia_1.pdf
```

## Entrada en el JSON

Ejemplo para `src/data/courses/programacion.json`:

```json
{
  "id": "guia-1-2026-1",
  "title": "Guía 1",
  "period": "2026-1",
  "type": "guia",
  "kind": "enunciado",
  "sequence": 1,
  "version": 1,
  "path": "/files/courses/programacion/2026-1/guias/CIT1100_2026_1_programacion_guia_1.pdf"
}
```

## Antes de abrir PR

Validar rutas, nombres y JSON:

```bash
npm run validate
```

Validar y construir el sitio:

```bash
npm run check
```
