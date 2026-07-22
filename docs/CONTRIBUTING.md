# Subir materiales

Este es el proceso para agregar materiales al sitio.

## 1. Crear una rama

Usar una rama temporal por tanda de materiales. No hace falta crear una rama por archivo.

```bash
git switch main
git pull
git switch -c carga-materiales-tanto-tanto
```

## 2. Buscar el curso

Revisar [COURSES.md](/docs/COURSES.md) y ubicar:

- el ID del curso;
- el código oficial;
- la carpeta base;
- el JSON que hay que editar.

Ejemplo:

```text
Programación | programacion | CIT1100
```

## 3. Nombrar el archivo

Usar la regla de [NAMING.md](/docs/NAMING.md).

Ejemplo:

```text
CIT1100_2026_1_programacion_guia_1.pdf
```

## 4. Poner el archivo en su carpeta

Si la carpeta no existe, crearla.

Ejemplo para una guía de Programación del primer semestre de 2026:

```text
public/files/courses/programacion/2026-1/guias/
```

El archivo quedaría así:

```text
public/files/courses/programacion/2026-1/guias/CIT1100_2026_1_programacion_guia_1.pdf
```

## 5. Editar el JSON del curso

Abrir el JSON indicado en [COURSES.md](/docs/COURSES.md).

Ejemplo:

```text
src/data/courses/programacion.json
```

Agregar el material dentro de `materials`:

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

La ruta en el JSON no lleva `public`.

## 6. Validar

Validar rutas, nombres y JSON (en tu terminal):

```bash
npm run validate
```

Validar y construir el sitio:

```bash
npm run check
```

## 7. Subir la rama

Agregar los archivos y hacer commit:

```bash
git add public/files/courses src/data/courses
git commit -m "add: materiales tanto tanto"
git push -u origin carga-materiales-tanto-tanto
```

## 8. Abrir PR

Abrir una pull request hacia `main`.

Antes de pedir merge, revisar que:

- el check de github pase;
- el material esté en el curso correcto;
- el nombre del archivo siga [NAMING.md](/docs/NAMING.md);
- el JSON apunte al archivo correcto.

## 9. Review y merge

Otra persona (ojalá mínimo 2) debe(n) revisar la PR.

Después del merge, github elimina la rama, así que bacán.
