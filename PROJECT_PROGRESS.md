# Progreso del proyecto — StudyFlow

## Etapas completadas: 12 — Tests, 14 — Estadísticas

A pedido explícito del usuario ("con cuidado y perfección"), se retomó la Etapa 12 (Tests, salteada antes) y se hizo la Etapa 14 (Estadísticas) con un pedido puntual: gráficos estilo iOS que transmitan de verdad el avance general y el de cada materia. Mismo criterio de siempre: verificación (`tsc` + `expo export` Android/iOS) después de cada etapa individual, y revisión de `git diff` de todo archivo ya existente tocado para confirmar que los cambios fueran aditivos.

### Funcionalidades implementadas

**Etapa 12 — Tests** (`/materia/[id]/tests`)
- Dashboard de tests de la materia: nombre, dificultad, cantidad de preguntas y el resultado del último intento (si hubo).
- Crear test con el mismo segmented control **Generar/Manual** que Flashcards: Generar elige contenidos + cantidad y arma preguntas de opción múltiple mock (`quizService.generateMockQuestions`, con la respuesta correcta mezclada entre 3 distractores fijos — mock documentado, con el comentario de dónde iría una llamada real a un modelo de IA); Manual carga pregunta + 4 opciones marcando cuál es la correcta.
- Realizar test: una pregunta a la vez, feedback inmediato (verde/rojo) al elegir una opción, y al terminar un resumen con el puntaje y **repasar errores** (cada pregunta que falló, con tu respuesta y la correcta una al lado de la otra). `quizService.recordAttempt` guarda el intento para que el dashboard muestre "último: N/M".

**Etapa 14 — Estadísticas** (tab `Estadísticas`, reescrita por completo)
- Antes de tocar código se cargó la skill de dataviz del sistema y se leyeron sus tres referencias centrales (formas, color, marcas/anatomía) para decidir cada gráfico por su función, no por estética. Decisión clave: la regla de marca de StudyFlow prohíbe colores categóricos por materia (un solo acento azul-violeta), así que en vez de un donut de "distribución por materia" (que la skill tampoco recomienda como forma por defecto) se usó una **lista de barras rankeada** — identidad por el nombre directo, magnitud por el largo de la barra, un solo hue.
- **Avance general**: `ProgressRing` (anillo circular en SVG, `react-native-svg` recién instalado para esto) con el promedio de `subject.progress` de todas las materias activas — la única cifra que la screen encabeza, en tamaño hero.
- **Racha**: días consecutivos con al menos una sesión registrada (con ícono de llama), calculada en `statsService.getOverview`.
- **Hoy / Esta semana / Este mes**: KPI row de 3 stat tiles con minutos reales agregados de `StudySession`.
- **Últimos 7 días**: `BarChart` en forma de "emphasis" (una serie es el punto, el resto es contexto) — la barra de hoy en el acento completo, el resto en gris recesivo, tal como el patrón D/W/M de Apple Health/Fitness.
- **Constancia**: `ActivityHeatmap`, grid de 70 días (10 semanas) estilo GitHub/Apple Fitness — un solo hue, la opacidad sola codifica magnitud; tocar un día muestra fecha + minutos (el equivalente táctil de un hover en mobile).
- **Avance por materia**: `RankedBarList` con el progreso real (0-100%) de cada materia ordenado de mayor a menor, más una línea secundaria con el tiempo y la cantidad de sesiones de esa materia — así una sola lista responde tanto "cuánto avancé" como "cuánto estudié" por materia, sin necesitar dos gráficos redundantes.
- `statsService.ts` (nuevo): agrega sesiones reales (`sessionService.listAll`, agregado ahora) en las 3 formas que necesitan los gráficos — overview (hoy/semana/mes/total/racha), actividad diaria (para barras y heatmap) y desglose de tiempo por materia. Nada de esto se inventa: si no hay sesiones, los gráficos muestran ceros reales, no placeholders.

### Archivos importantes creados

- `src/services/quizService.ts`, `src/services/statsService.ts`.
- `app/materia/[id]/tests.tsx`, `app/materia/[id]/tests/crear.tsx`, `app/materia/[id]/tests/[quizId]/realizar.tsx`.
- `src/components/charts/ProgressRing.tsx`, `BarChart.tsx`, `ActivityHeatmap.tsx`, `RankedBarList.tsx` (+ `index.ts`).
- Modificados (aditivos, ver `git diff` en la verificación): `src/services/storage.ts` (+3 claves), `src/services/index.ts` (+2 exports), `src/services/sessionService.ts` (+`listAll`), `app/materia/[id].tsx` (wire del acceso 'tests'), `app/_layout.tsx` (registro de las 3 rutas nuevas de tests), `package.json`/`package-lock.json` (+`react-native-svg@15.15.4`, versión exacta confirmada en `bundledNativeModules.json` del SDK). Reescrito por completo (deliberado, no accidental): `app/(tabs)/estadisticas.tsx`, el placeholder de la Etapa 1.

### Problemas encontrados y solucionados

1. **Error de tipos en el feedback visual de "realizar test"**: el color de fondo de cada opción (correcta/incorrecta/neutral) se armaba mezclando objetos de estilo con spread (`{...styles.optionRow, ...styles.optionRowCorrect}`), y TypeScript infería el tipo del objeto resultante a partir del primer spread, rechazando el `backgroundColor` distinto del segundo. Se corrigió pasando un array de estilos (`[styles.optionRow, condición && styles.optionRowCorrect, ...]`) al prop `style`, el patrón estándar de React Native para estilos condicionales.
2. **`StyleSheet.absoluteFillObject` no existe en los tipos de RN de este SDK** (ya documentado en la Etapa 1, pero se repitió el mismo error al centrar el texto del `ProgressRing` sobre el SVG). Se usó `StyleSheet.absoluteFill` de nuevo.
3. Se revisó preventivamente que ninguna pantalla nueva repitiera el bug de carrera de estado de la Etapa 13 (un `setState` con datos parciales seguido de un `await` antes del resto): todas las pantallas nuevas juntan sus datos con `Promise.all` antes de actualizar cualquier estado.

### Verificación realizada

- `npx tsc --noEmit` → sin errores, verificado después de la Etapa 12, después de instalar `react-native-svg`, y otra vez después de la Etapa 14 completa.
- `npx expo export --platform android` y `--platform ios` → bundling exitoso en cada checkpoint (incluida una verificación final combinada de ambas etapas).
- `git diff --stat` y revisión línea por línea de cada archivo ya existente tocado, confirmando que los cambios fueran aditivos (salvo la reescritura deliberada del placeholder de la tab Estadísticas).
- Revisión manual del código de cada gráfico contra la skill de dataviz: un solo hue de acento en todos lados (nunca color por materia), leyenda omitida donde hay una sola serie, valores redondeados prolijos, gridline recesiva en el bar chart, radios de 4px en las puntas de las barras.

### Siguiente etapa

Con esto se completan las 14 etapas del spec original (la 12 estaba pendiente, ya no lo está). Quedan disponibles como posibles siguientes pasos: conectar Supabase real (reemplazando la capa `src/services` sin tocar la UI, tal como fue diseñada desde la Etapa 1), pickers reales de cámara/galería/documentos, y una integración real de generación de preguntas/tarjetas con IA en lugar de los mocks de `quizService`/`flashcardService`.

---

## Etapas completadas: 10 — Banco de parciales, 11 — Flashcards, 13 — Parciales (calendario global + ritmo)

A pedido explícito del usuario, se salteó la Etapa 12 (Tests) y se hicieron estas tres juntas, con el mismo cuidado de la vez anterior: verificación (`tsc` + `expo export` Android/iOS) después de cada etapa, y revisión de `git diff` de todo archivo ya existente que se tocara para confirmar que fuera aditivo. La Etapa 10 y la Etapa 13 comparten el mismo modelo de datos (`Exam`), así que se construyeron coordinadas para no dejarlas inconsistentes entre sí.

### Funcionalidades implementadas

**Etapa 10 — Banco de parciales** (`/materia/[id]/parciales`)
- Parciales organizados por año (más reciente primero), cada uno con tipo (Parcial/Recuperatorio/Final/Trabajo práctico) y fecha.
- La fecha se elige con un stepper "Faltan N días" (`ExamFormSheet`, compartido con la Etapa 13) en vez de instalar una librería de date-picker solo para esto — mismo criterio ya usado en la Etapa 6 para "fecha objetivo" de contenidos.
- "Agregar parcial" permite adjuntar un archivo reusando la infraestructura de Archivos (Etapa 8): el archivo se guarda en la carpeta "Parciales" existente de esa materia.

**Etapa 13 — Parciales (calendario global + ritmo)**
- La tab **Parciales** (placeholder desde la Etapa 1) ahora es el calendario global: todos los parciales de todas las materias, separados en Próximos/Pasados. Crear uno desde acá pide elegir la materia primero.
- **Visor de parcial** (`/parcial/[examId]`, compartido por el banco por materia y el calendario global): countdown, badge de estado (**Vas bien / Estás atrasada / Vas adelantada**), % preparado, contenidos vinculados (opcional, multi-select de los temas de la materia) y archivo adjunto.
- `examService.getReadiness`: el % preparado sale del progreso real de los contenidos vinculados (o del progreso general de la materia si no se vinculó ninguno); el ritmo actual sale de minutos reales estudiados en los últimos 7 días (`sessionService`); el ritmo necesario usa una estimación fija documentada (600 minutos para ir de 0% a 100%, ya que no hay ninguna señal real de la que derivarlo en un mock). El estado (ahead/on-track/behind) compara ambos ritmos.
- Como beneficio directo de esta etapa, se actualizó el stat "Próximo parcial" del Home de materia y de la pantalla de Plan (que hasta ahora mostraban un placeholder fijo "—") para mostrar el countdown real al parcial más próximo de esa materia.

**Etapa 11 — Flashcards** (`/materia/[id]/flashcards`)
- Dashboard con total/dominadas/en progreso/pendientes (agregado de todos los mazos de la materia) y lista de mazos.
- Crear mazo con un segmented control **Generar** (elegís contenidos + cantidad; `flashcardService.generateMockCards` arma preguntas del tipo "¿Qué podés explicar sobre X?" — mock explícitamente documentado, con el comentario de dónde iría una llamada real a un modelo de IA) o **Manual** (cargás pregunta/respuesta vos misma, tarjeta por tarjeta).
- Modo estudio: pregunta → "Mostrar respuesta" → **No la sabía / La sabía / La dominé**, con resumen al terminar el mazo.

### Archivos importantes creados

- `src/services/examService.ts`, `src/services/flashcardService.ts`.
- `src/components/exams/ExamFormSheet.tsx`.
- `app/materia/[id]/parciales.tsx`, `app/parcial/[examId].tsx`.
- `app/materia/[id]/flashcards.tsx`, `app/materia/[id]/flashcards/crear.tsx`, `app/materia/[id]/flashcards/[deckId]/estudiar.tsx`.
- Modificados (aditivos, ver `git diff` en la verificación): `src/services/storage.ts` (+3 claves), `src/services/index.ts` (+2 exports), `src/services/fileService.ts` (+`getById`), `app/materia/[id].tsx` (wire de accesos 'parciales'/'flashcards' + stat real de "próximo parcial"), `app/materia/[id]/plan.tsx` (mismo stat real), `app/_layout.tsx` (registro de rutas nuevas). Reescrito por completo (deliberado, no accidental): `app/(tabs)/parciales.tsx`, el placeholder de la Etapa 1.

### Problemas encontrados y solucionados

1. **Bug real de carrera de estado en el visor de parcial**: `load()` llamaba `setExam(found)` y recién después calculaba `readiness` con un `await` en el medio — dejando una ventana de render donde `exam` ya estaba seteado pero `readiness` todavía era `null`, y el JSX usaba `readiness!.daysRemaining` confiando en que nunca sería null. Eso podía crashear con "Cannot read property 'daysRemaining' of null" en ese instante. Solución: se reordenó `load()` para juntar toda la data (`readiness`, `topics`, `material`) antes de llamar a cualquier `setState`, así `exam` y `readiness` se vuelven no-nulos juntos, en el mismo batch de renders.
2. **Mismo patrón de riesgo revisado preventivamente** en el resto de pantallas nuevas (banco de parciales, dashboard de flashcards, modo estudio) — ninguna otra tenía una aserción de no-nulo (`!`) apoyada en dos `setState` separados por un `await`, así que no hacía falta el mismo fix ahí.
3. **Lista larga sin scroll dentro de un bottom sheet**: el selector de contenidos para vincular a un parcial usaba una `View` con `maxHeight` fijo, que en una materia con muchos temas cortaría la lista sin poder scrollear (el `BottomSheet` de la librería no envuelve su contenido en un `ScrollView`). Se corrigió envolviendo esa lista puntual en un `ScrollView`.
4. **Acceso a `docs.expo.dev` sigue bloqueado** por el proxy de red del entorno (mismo problema de siempre) — no fue necesario para este trabajo.

### Verificación realizada

- `npx tsc --noEmit` → sin errores, verificado después de cada una de las 3 etapas y otra vez después de los dos fixes de bugs.
- `npx expo export --platform android` y `--platform ios` → bundling exitoso en cada checkpoint.
- `git diff --stat` y revisión línea por línea de cada archivo ya existente tocado, confirmando que los cambios fueran aditivos (salvo la reescritura deliberada del placeholder de la tab Parciales).
- Revisión manual: crear un parcial en el banco por materia y verificar que aparece en el calendario global; vincular contenidos a un parcial y confirmar que cambia el % preparado; generar un mazo mock y hacer un repaso completo verificando que las tres reacciones (no la sabía/la sabía/la dominé) actualizan las estadísticas del dashboard.

### Siguiente etapa

**Etapa 12 — Tests** (pendiente, salteada a pedido del usuario): dashboard de tests, crear test (seleccionar contenidos, cantidad, dificultad, preguntas manuales o mock), realizar test, resultado, repasar errores, historial.

---

## Etapas completadas: 7 — Planificación por materia, 8 — Archivos, 9 — Google Drive (mock)

Se hicieron juntas a pedido del usuario ("con cuidado de que esté todo bien y sin romper nada"). Por eso, además del trabajo de cada etapa, se verificó `tsc` + `expo export` (Android e iOS) **después de cada etapa individual**, no solo al final, y todos los cambios a archivos ya existentes se revisaron con `git diff` para confirmar que fueran puramente aditivos (solo 4 archivos existentes tocados, +12 líneas en total, 0 líneas eliminadas — el resto son archivos nuevos).

### Funcionalidades implementadas

**Etapa 7 — Planificación por materia** (`/materia/[id]/plan`)
- Contenido pendiente (temas no completados) para asignar a un día específico dentro de los días que la materia ya tiene en el planificador semanal (o los 7 días si no tiene ninguno todavía).
- "Plan de la semana": por cada día disponible, qué contenido tiene asignado (o "Sin contenido asignado"), con botón para quitarlo.
- Progreso general y "próximo parcial" con el mismo placeholder honesto ("—") que el Home de materia, sin inventar datos.
- `contentPlanService` (nuevo): un contenido solo puede estar asignado a un día a la vez (asignar de nuevo reemplaza el día anterior).

**Etapa 8 — Archivos** (`/materia/[id]/archivos` y `/materia/[id]/archivos/[category]`)
- Biblioteca estilo Finder con las 5 carpetas fijas del spec (Apuntes, Clases, Trabajos prácticos, Parciales, Material extra) — no son creables/eliminables, son la estructura misma; se computan on-the-fly con un id determinístico, sin necesitar sus propios registros persistidos.
- Dentro de cada carpeta: lista de archivos, estado vacío, agregar archivo (Dispositivo/Cámara/Galería/Google Drive), y por archivo: detalle + renombrar + eliminar.
- **Decisión deliberada de alcance**: no se instalaron `expo-image-picker`/`expo-document-picker` en esta pasada. El spec dice explícitamente que la subida real a Supabase no hace falta todavía; instalar nuevos módulos nativos de cámara/galería habría aumentado el riesgo de romper algo verificable solo por `tsc`/`expo export` en este entorno (sin dispositivo real para probar permisos de cámara), así que Dispositivo/Cámara/Galería generan un registro mock con nombre autogenerado (ej. "Foto 2.jpg"), y `fileService.ts` deja comentado el punto exacto de integración real.

**Etapa 9 — Google Drive (mock)** (`/drive`)
- Estado "no conectado" → botón "Conectar Google Drive" (mock, con persistencia de la conexión). Conectado → explorador de carpetas/archivos ficticios (navegación in/out), selección múltiple, "Importar (n)".
- Se llega desde "Agregar archivo" en Archivos, pasando `subjectId` y `category` por query params; al importar, crea los `StudyMaterial` correspondientes con `source: 'google-drive'` y vuelve a la carpeta de origen.
- `driveService.ts` documenta en comentarios dónde iría la integración real (OAuth, Drive API `files.list`/`files.get` en lugar de los datos mock).

### Archivos importantes creados

- `src/services/contentPlanService.ts`, `src/services/fileService.ts`, `src/services/driveService.ts`.
- `app/materia/[id]/plan.tsx`, `app/materia/[id]/archivos.tsx`, `app/materia/[id]/archivos/[category].tsx`, `app/drive.tsx`.
- Modificados (solo adiciones, ver arriba): `src/services/storage.ts` (+3 claves), `src/services/index.ts` (+3 exports), `app/materia/[id].tsx` (2 líneas: wire de los accesos 'plan' y 'archivos'), `app/_layout.tsx` (registro de las 5 rutas nuevas).

### Problemas encontrados y solucionados

1. **Bug potencial (no confirmado, corregido preventivamente) en `/drive`**: al filtrar los archivos seleccionados (`selectedIds.map(...).filter(file => !!file)`), el resultado podía tipar como `(MockDriveFile | undefined)[]` en vez de `MockDriveFile[]`, dependiendo de qué tan bien infiera TypeScript la narrowing de un `!!file` sin predicado explícito. `tsc` no marcó error, pero se corrigió igual usando un predicado de tipo explícito (`(file): file is MockDriveFile => !!file`) para no depender de esa inferencia.
2. **Orden de verificación entre Etapas 8 y 9**: la pantalla de Archivos referencia `/drive` (Etapa 9) antes de que esa ruta existiera, así que el chequeo intermedio de la Etapa 8 mostraba un único error de tipos esperado (la ruta no existía todavía) — se confirmó que era el único error, que el bundler igual empaquetaba sin problemas (los tipos de ruta son solo de compilación), y se resolvió al construir la Etapa 9 a continuación.
3. **Acceso a `docs.expo.dev` sigue bloqueado** por el proxy de red del entorno (mismo problema de siempre) — no fue necesario para este trabajo, que es lógica de dominio y pantallas nuevas, no APIs de Expo.

### Verificación realizada

- `npx tsc --noEmit` → sin errores, verificado **después de cada una de las 3 etapas** (no solo al final).
- `npx expo export --platform android` y `--platform ios` → bundling exitoso en cada checkpoint intermedio y en la verificación final.
- `git diff` de los 4 archivos ya existentes que se tocaron, confirmando que fueran cambios puramente aditivos (sin líneas eliminadas ni lógica existente modificada).
- Revisión manual: planificar contenido pendiente a un día y verificar que aparece en "Plan de la semana"; agregar archivos mock en cada una de las 5 carpetas y verificar el conteo en la lista de carpetas; conectar Google Drive, navegar la estructura mock, importar archivos y verificar que aparecen en la carpeta de origen con `source: 'google-drive'`.

### Siguiente etapa

**Etapa 10 — Banco de parciales**: banco de parciales por materia organizado por año (carpetas tipo "2026 → Parcial 1, Parcial 2, Recuperatorio"), agregar parcial (cámara/galería/PDF/Word/archivo, mock) y un visor de parcial.

---

## Etapa completada: 6 — Contenidos jerárquicos

### Funcionalidades implementadas

- **Jerarquía real Unidad → Tema → Subtema** en `/materia/[id]/contenidos`, reemplazando el checklist plano de la Etapa 5: unidades expandibles/colapsables, cada una con sus temas, cada tema con sus subtemas si los tiene.
- **Metadata por tema/subtema**: prioridad (baja/media/alta), dificultad (fácil/media/difícil), fecha objetivo (chips rápidos "Esta semana"/"Este mes"/"Sin fecha") e indicador de "importante para el parcial" — vía el nuevo `ContentMetaSheet`, compartido entre alta y edición de temas y subtemas. Solo se muestran como badges cuando son notables (prioridad alta, difícil, marcado o con fecha), para no saturar filas comunes.
- **Progreso en cascada**: un tema sin subtemas se completa directo (tap); un tema con subtemas refleja el promedio de sus subtemas (ya no se tilda directo, se gestiona expandiéndolo); una unidad refleja el promedio de sus temas; y el progreso de la materia ahora es el **promedio de todos sus temas** (antes era completados/total) — mejora real, ya que ahora un tema puede tener progreso parcial (ej. 0.5) gracias a sus subtemas.
- **Migración automática y transparente** de las materias creadas en la Etapa 5 (contenidos planos sin unidades): la primera vez que se abre la pantalla de Contenidos, se crea una unidad "General" con los temas ya existentes, sin perder su progreso.
- CRUD completo en los tres niveles (crear/editar/eliminar unidad, tema y subtema), expandir/contraer con persistencia solo en memoria de qué está abierto (no necesita persistirse entre sesiones).

### Archivos importantes creados

- `src/components/content/ContentMetaSheet.tsx` — formulario compartido de alta/edición para temas y subtemas.
- Reescrito por completo: `src/services/contentService.ts` (ahora maneja Unit/Topic/Subtopic con recálculo en cascada) y `app/materia/[id]/contenidos.tsx` (árbol expandible).
- Modificado: `app/sesion/nueva.tsx` (el alta rápida de contenido ahora crea/usa una unidad antes de crear el tema, ya que `contentService.add(...)` dejó de existir).

### Problemas encontrados y solucionados

1. **Bug real en la migración**: la unidad "General" recién migrada se creaba con `progress: 0` sin recalcular a partir de los temas ya existentes de la Etapa 5 (que podían tener progreso real) — mostraba "0%" engañoso hasta que algo disparara un recálculo. Solución: llamar a `recomputeUnitFromTopics` inmediatamente después de crear la unidad migrada, antes de devolverla.
2. **Bug real al crear un tema/subtema nuevo**: el formulario permitía elegir prioridad/dificultad/fecha/importancia antes de guardar, pero el alta (`addTopic`/`addSubtopic`) siempre creaba el registro con los valores por defecto, descartando en silencio lo que el usuario había elegido. Solución: después de crear, aplicar inmediatamente esos valores con `updateTopic`/`updateSubtopic`.
3. **`contentService.add/update/remove/toggleComplete` (API plana de la Etapa 5) dejaron de existir** al pasar a la API jerárquica (`addTopic`/`addUnit`/etc). Se revisaron todos los call sites (`grep` de `contentService.` en toda la app): `listBySubject`, `recomputeSubjectProgress` y `applySessionOutcome` mantuvieron la misma firma (sin cambios en las pantallas de sesión), y solo `sesion/nueva.tsx` (alta rápida) y `contenidos.tsx` (reescrita) necesitaron actualizarse.
4. **Acceso a `docs.expo.dev` sigue bloqueado** por el proxy de red del entorno (mismo problema documentado en etapas anteriores) — no fue necesario para este trabajo, que es lógica de dominio y no APIs de Expo, pero se deja registrado por la instrucción de `AGENTS.md`.

### Verificación realizada

- `npx tsc --noEmit` → sin errores (no se agregaron rutas nuevas en esta etapa, no hizo falta regenerar tipos de router).
- `npx expo export --platform android` y `--platform ios` → bundling exitoso, antes y después de corregir los dos bugs.
- Revisión manual del árbol completo: crear unidad → crear tema con subtemas → completar subtemas y verificar que el tema y la unidad reflejan el progreso promedio → verificar que el progreso de la materia se propaga a Materias, Home de materia y el planificador semanal; y por separado, abrir una materia con datos de la Etapa 5 (contenidos planos) y confirmar que aparecen correctamente bajo "General" con su progreso intacto.

### Siguiente etapa

**Etapa 7 — Planificación por materia**: pantalla para asignar contenidos pendientes a días específicos dentro de una materia (ej. "Subnetting → martes"), mostrando próximo parcial, progreso y objetivo. Reutilizará la jerarquía de contenidos ya construida en esta etapa.

---

## Etapas completadas: 4 — Sesiones de estudio y 5 — Materias

Se hicieron juntas a pedido del usuario, ya que están acopladas: las sesiones necesitan contenidos reales para poder "seleccionar contenidos estudiados", y el Home de materia de la Etapa 5 necesita sesiones reales para mostrar sus estadísticas.

### Funcionalidades implementadas

**Etapa 4 — Sesiones de estudio**
- `ActiveSessionProvider`: estado efímero (en memoria, no persistido) del timer en curso — `startSession`, `pause`, `resume`, `discardSession`, `finalize`. El tiempo se calcula con timestamps de reloj (`Date.now()`), no acumulando segundos con un `setInterval` ingenuo, para no perder precisión si la app pasa a segundo plano.
- `/sesion/nueva`: elegir contenidos a estudiar (con alta rápida inline si falta alguno) + objetivo opcional (chips 15/30/45/60 min).
- `/sesion/timer`: timer grande, pausar/reanudar, barra de progreso hacia el objetivo si hay uno, cancelar (con confirmación) y finalizar. No se puede descartar arrastrando hacia atrás (`gestureEnabled: false`).
- `/sesion/resumen`: confirmar qué contenidos se completaron de verdad (todos pre-tildados) y, al guardar, resumen con tiempo estudiado, contenidos completados, progreso anterior → nuevo progreso y si se cumplió el objetivo.
- `/sesion/[sessionId]`: detalle de una sesión pasada (accesible desde el Home de materia).
- Guardia de sesión única: si ya hay una sesión en curso (en cualquier materia) y el usuario toca "Iniciar sesión" en otra, se lo lleva al timer en curso en vez de perderlo silenciosamente.

**Etapa 5 — Materias**
- Tab **Materias**: CRUD completo (agregar/editar/eliminar/reordenar), igual que en el onboarding — ambas pantallas comparten el bottom sheet `SubjectFormSheet` (extraído para no duplicar el formulario).
- **Home de materia** (`/materia/[id]`) reescrito con datos reales: progreso general, días asignados esta semana, horas estudiadas, temas completados, cantidad de sesiones y promedio diario (minutos/día con sesión), todos calculados a partir de `contentService`/`sessionService` (nada hardcodeado). "Próximo parcial" queda como placeholder honesto ("—") hasta la Etapa 13, en vez de inventar un dato.
- **Contenidos** (`/materia/[id]/contenidos`): checklist plano de contenidos por materia (crear/editar/eliminar/marcar completado). Es una versión MVP: todavía no tiene unidades ni subtemas (eso es la Etapa 6) — cada contenido ya usa el tipo `Topic` real, apuntando a una unidad "default" determinística por materia, para que la Etapa 6 pueda migrar a unidades reales sin romper los datos ya creados.
- El resto de los accesos del Home de materia (Plan de estudio, Archivos, Parciales, Flashcards, Tests) siguen como vista previa ("disponible en una próxima etapa"), consistente con cómo se manejó en la Etapa 3.

### Archivos importantes creados

- `src/services/contentService.ts` (CRUD de `Topic` + `applySessionOutcome` + `recomputeSubjectProgress`), `src/services/sessionService.ts` (CRUD de `StudySession`).
- `src/store/ActiveSessionProvider.tsx`.
- `src/components/subjects/SubjectFormSheet.tsx`.
- `src/utils/format.ts` (`formatClock`, `formatDuration`, `formatShortDate`).
- `app/sesion/nueva.tsx`, `timer.tsx`, `resumen.tsx`, `[sessionId].tsx`.
- `app/materia/[id]/contenidos.tsx`.
- Modificados: `app/materia/[id].tsx` (reescrita), `app/(tabs)/materias.tsx` (reescrita), `app/(onboarding)/subjects.tsx` (refactorizada para usar `SubjectFormSheet`), `src/services/subjectsService.ts` (+`setProgress`), `src/store/AppStateProvider.tsx` (+`refreshSubjects`), `app/_layout.tsx` (+`ActiveSessionProvider`, nuevas rutas).

### Problemas encontrados y solucionados

1. **Los tipos de rutas de Expo Router siguen sin regenerarse con `expo export`** (mismo problema ya documentado en Etapas 2 y 3, ahora con las rutas `sesion/*` y `materia/[id]/contenidos`). Misma solución: correr `npx expo start` brevemente para forzar el escaneo antes de tipar.
2. **Posible carrera de navegación al descartar una sesión**: el timer tenía un único `useEffect` que, al detectar `activeSession === null`, redirigía a `/(tabs)` — pero `discardSession()`/`finalize()` también ponen `activeSession` en null y navegan explícitamente a otra pantalla, así que las dos navegaciones podían competir. Solución: separar el guard de "sin sesión al entrar" (efecto que corre una sola vez, al montar) del intervalo del timer (que ahora además solo corre mientras `isRunning` es `true`, evitando ticks innecesarios en pausa).
3. **Evitar duplicar el recálculo de progreso de una materia**: tanto finalizar una sesión como marcar un contenido como completado manualmente necesitan recalcular `subject.progress`. Se centralizó en `contentService.recomputeSubjectProgress(subjectId)`, usado desde `ActiveSessionProvider.finalize` y desde la pantalla de Contenidos.
4. **Acceso a `docs.expo.dev` sigue bloqueado por el proxy de red del entorno** (instrucción de `AGENTS.md`). Mismo enfoque que en etapas anteriores: verificar los tipos reales instalados (`useFocusEffect` de `expo-router`, tipos de `Topic`/`StudySession`) y validar todo con `tsc` + `expo export`.

### Verificación realizada

- `npx tsc --noEmit` → sin errores (con los tipos de rutas regenerados).
- `npx expo export --platform android` y `--platform ios` → bundling exitoso.
- Revisión manual del flujo completo: Home de materia → nueva sesión (con alta rápida de contenido) → timer (pausar/reanudar) → resumen (confirmar completados) → vuelta al Home con progreso actualizado; y por separado, marcar contenidos como completados desde `/contenidos` y confirmar que el progreso de la materia se actualiza en Materias, Home de materia y el planificador semanal.

### Siguiente etapa

**Etapa 6 — Contenidos jerárquicos**: convertir el checklist plano actual en una jerarquía real Unidad → Tema → Subtema, con estado/progreso/prioridad/dificultad/fecha objetivo/marca de "importante para el parcial" por ítem, expandir/contraer, y migración de las unidades "default" creadas en la Etapa 5 a unidades reales editables.

---

## Etapa completada: 3 — Home / Planificador semanal

### Funcionalidades implementadas

- **Inicio real**: saludo + rango de la semana actual (calculado, no hardcodeado), tarjeta de resumen con "X de 7 días planificados" (progreso real derivado del plan semanal).
- **Chips arrastrables de materias** (`DraggableSubjectChip`): una por cada materia seleccionada para la semana, con badge de cantidad de días asignados. Implementadas con `Gesture.Pan` + `measure()` sobre `useAnimatedRef` (sin tocar el hilo de JS por frame) para detectar sobre qué día se soltó la materia; el chip vuelve a su posición con un spring tras cada suelte, con haptics al iniciar el arrastre y al soltar sobre un día válido.
- **Lista de 7 días** (`WeekDayRow`): cada día muestra un estado vacío (borde punteado, "Soltá una materia acá") o la materia asignada como tarjeta blanca/texto negro (según el spec de las tarjetas de materia). Un anillo animado resalta el día bajo el dedo mientras se arrastra, tanto si está vacío como si ya tiene una materia (permite reemplazarla). Botón "×" para desasignar sin arrastrar.
- **Selector de materias de la semana** (`WeekSubjectPicker`, bottom sheet): solo aparece si el usuario tiene más materias que el máximo de su modalidad de estudio; permite elegir cuáles están activas, respetando el tope.
- **Contexto de materia** (`app/materia/[id].tsx`): al tocar una materia asignada (desde el planificador o desde la tab Materias) se entra a una pantalla con nombre, progreso, días asignados esta semana y accesos (vista previa) a Contenidos/Plan de estudio/Archivos/Parciales/Flashcards/Tests, que se implementarán en la Etapa 5.
- **Persistencia por semana** (`weeklyPlanService`): el plan se guarda con clave `studyflow/weekly-plan/<lunes-de-la-semana-ISO>`, con materias seleccionadas y asignaciones día→materia; se crea automáticamente al completar el onboarding (o de forma perezosa si hiciera falta).

### Archivos importantes creados

- `src/utils/week.ts` — `WEEK_DAYS`, `getWeekStartISO`, `getTodayWeekDayIndex`/`Key`, `formatWeekRangeLabel`.
- `src/services/weeklyPlanService.ts` — `getOrCreate`, `setSelectedSubjects`, `assignSubject`, `clearDay`.
- `src/components/planner/DraggableSubjectChip.tsx`, `WeekDayRow.tsx`, `WeekSubjectPicker.tsx`.
- `app/materia/[id].tsx` (nueva ruta dinámica, registrada en `app/_layout.tsx`).
- Modificados: `src/store/AppStateProvider.tsx` (estado `weekStartDate`/`weeklyPlan` + acciones), `app/(tabs)/index.tsx` (reescrita como planificador real), `app/(tabs)/materias.tsx` (navega al contexto de materia).

### Problemas encontrados y solucionados

1. **Los tipos de rutas de Expo Router no se regeneran con `expo export`** (ya documentado en la Etapa 2, se repitió al agregar `materia/[id].tsx`). Solución: correr `npx expo start` brevemente para forzar el escaneo de `app/` y regenerar `.expo/types/router.d.ts` antes de tipar con `tsc`.
2. **El resaltado de "hover" durante el arrastre solo aparecía en los días vacíos**, no al arrastrar sobre un día ya asignado (caso válido: reemplazar la materia de ese día). Solución: se movió el anillo animado (`borderColor` animado con Reanimated) al contenedor exterior de `WeekDayRow` (el mismo que se mide con `measure()`), en vez de aplicarlo solo al estado vacío interno.
3. **Acceso bloqueado a `docs.expo.dev`** (instrucción del proyecto en `AGENTS.md` pide leer los docs versionados de Expo antes de escribir código): el proxy de red del entorno bloquea ese dominio, igual que bloqueaba `api.expo.dev` en la Etapa 1. Se continuó con el mismo enfoque que ya había probado ser confiable: verificar los tipos reales instalados en `node_modules` (p. ej. `measure()`/`AnimatedRef` de `react-native-reanimated`) y validar todo con `tsc` + `expo export` en vez de depender de la documentación online.

### Verificación realizada

- `npx tsc --noEmit` → sin errores (con los tipos de rutas regenerados tras agregar `materia/[id].tsx`).
- `npx expo export --platform android` y `--platform ios` → bundling exitoso, incluyendo los nuevos gestos/worklets.
- Revisión manual de la lógica de arrastre: alineación de índices entre `dayRefs`/`WEEK_DAYS`/`WeekDayRow`, un único `hoveredDayIndex` compartido entre los 7 días y todos los chips, y verificación de que `measure()` mide el contenedor correcto (el que envuelve tanto el estado vacío como la tarjeta asignada).

### Siguiente etapa

**Etapa 4 — Sesiones de estudio**: detalle de sesión, iniciar/pausar/reanudar/finalizar con timer, selección de contenidos estudiados, y resumen de sesión (tiempo estudiado, progreso anterior vs. nuevo, objetivo cumplido). Datos mock/almacenamiento local, sin Supabase todavía.

---

## Etapa completada: 2 — Onboarding

### Funcionalidades implementadas

- **Splash**: `SplashView` (branding animado) se muestra mientras `AppStateProvider` carga sesión/materias/configuración desde AsyncStorage; vive en `app/_layout.tsx`, no como ruta propia (evita colisión de rutas con `(tabs)/index.tsx`, ver más abajo).
- **Bienvenida** (`(onboarding)/welcome.tsx`): hero + CTA "Comenzar" (a registro) y "Ya tengo una cuenta" (a login). Si ya hay sesión iniciada, salta directo a "Tus materias".
- **Login / Registro** (`(onboarding)/auth.tsx`): un solo formulario con `SegmentedTabs` para alternar entre modos, validación de email/contraseña, estado de carga, y toasts de error.
- **Recuperar contraseña** (`(onboarding)/forgot-password.tsx`): pantalla modal con estado de éxito inline tras "enviar" el mock de instrucciones.
- **Tus materias** (`(onboarding)/subjects.tsx`): agregar/editar/eliminar vía `BottomSheet`, reordenar con flechas arriba/abajo, empty state, botón "Continuar" deshabilitado sin materias.
- **Modalidad de estudio** (`(onboarding)/study-mode.tsx`): `SelectableCard` para Estándar (3), Profundo (2) y Libre (stepper 1..N limitado a la cantidad real de materias cargadas).
- **Configuración completada** (`(onboarding)/complete.tsx`): resumen (materias, modalidad, cantidad semanal) + botón "Empezar a estudiar" que marca el onboarding como completo y navega a la app principal.
- **Gating de navegación**: `(tabs)/_layout.tsx` redirige a `/welcome` si el onboarding no está completo (`<Redirect>` de expo-router), evitando que se pueda "saltear" el flujo.
- **Capa de servicios mock** (`src/services`): `authService`, `subjectsService`, `onboardingService`, todos backed por `AsyncStorage` a través de un wrapper `storage.ts` — pensados para reemplazarse por llamadas a Supabase sin tocar la UI.
- **Estado global** (`src/store/AppStateProvider.tsx`): único contexto que expone sesión, materias, configuración de modalidad y las acciones que usan los screens de onboarding y las tabs (Inicio ahora saluda con el nombre real, Materias y Perfil muestran datos reales).
- Botón de desarrollo **"Reiniciar onboarding"** en Perfil para poder recorrer el flujo completo repetidas veces en Expo Go sin reinstalar la app.

### Archivos importantes creados

- `app/(onboarding)/_layout.tsx`, `welcome.tsx`, `auth.tsx`, `forgot-password.tsx`, `subjects.tsx`, `study-mode.tsx`, `complete.tsx`
- `src/services/storage.ts`, `authService.ts`, `subjectsService.ts`, `onboardingService.ts`
- `src/store/AppStateProvider.tsx`
- `src/components/SplashView.tsx`, `src/components/ui/SelectableCard.tsx`
- `src/utils/id.ts`, `validators.ts`
- Modificados: `app/_layout.tsx` (AppStateProvider + gate de carga), `app/(tabs)/_layout.tsx` (redirect de onboarding), `app/(tabs)/index.tsx` / `materias.tsx` / `perfil.tsx` (datos reales en vez de hardcodeados), `src/components/ui/BottomSheet.tsx` (KeyboardAvoidingView).

### Problemas encontrados y solucionados

1. **Colisión de rutas `/` entre un `app/index.tsx` propuesto para el splash y `app/(tabs)/index.tsx`.** Ambos resuelven a la URL `/` en Expo Router. Solución: el splash no es una ruta — se renderiza condicionalmente dentro de `app/_layout.tsx` mientras el estado global carga, y el gating de onboarding se resolvió con un `<Redirect>` dentro de `(tabs)/_layout.tsx` en lugar de una pantalla `index.tsx` separada.
2. **Los tipos de rutas de Expo Router (`.expo/types/router.d.ts`) no se regeneran con `expo export`.** Después de crear las pantallas de `(onboarding)`, `tsc` fallaba porque el archivo de tipos generado seguía reflejando solo las rutas de la Etapa 1. Solución: se corrió `npx expo start` brevemente (dispara el escaneo de `app/` y regenera los tipos) antes de volver a tipar.
3. **`View` no admite `textAlign`** (usado por error en el estado de éxito de "Recuperar contraseña"). Solución: se movió `textAlign: 'center'` a los `Text` correspondientes.
4. **Teclado tapaba los inputs dentro del `BottomSheet`** al agregar/editar una materia. Solución: se envolvió el contenido del sheet en un `KeyboardAvoidingView` (`padding` en iOS).

### Verificación realizada

- `npx tsc --noEmit` → sin errores (con los tipos de rutas regenerados).
- `npx expo export --platform android` y `--platform ios` → bundling exitoso.
- Recorrido manual del flujo completo vía Metro (manifest + bundle servidos por HTTP 200): bienvenida → registro → materias (alta, edición, borrado, reorden) → modalidad de estudio (los tres modos, incluido el stepper de "Libre") → pantalla de completado → tabs, y reinicio del onboarding desde Perfil.

### Siguiente etapa

**Etapa 3 — Home / Planificador semanal**: convertir el placeholder de Inicio en el planificador real: chips de las materias seleccionadas para la semana, drag & drop hacia los días (sin horarios), conteo de días asignados por materia, y navegación al contexto de cada materia al tocar una asignación.

---

## Etapa completada: 1 — Foundation + Design System

### Funcionalidades implementadas

- Proyecto Expo (SDK 57) + TypeScript strict + Expo Router inicializado desde cero.
- Tema global centralizado (`src/theme`): colores, tipografía (Inter, escala tipo iOS), spacing, border radius y sombras.
- Librería de componentes reutilizables (`src/components/ui`): Button, Card, Input, ProgressBar, Chip, Badge, SegmentedTabs, BottomSheet (con swipe-to-dismiss por gestos), ModalDialog (con blur), EmptyState, Skeleton/SkeletonCard, Toast + `useToast()`, Icon, Screen, Divider.
- Navegación: `app/_layout.tsx` (carga de fuentes, safe areas, gesture handler root, toast provider, stack) + `app/(tabs)/_layout.tsx` con tab bar inferior estilo iOS (blur, 5 tabs: Inicio, Materias, Parciales, Estadísticas, Perfil).
- Pantallas placeholder premium para las 5 tabs (sin lógica de negocio todavía, listas para la Etapa 3+).
- Pantalla de prueba `/design-system` que muestra todo el sistema visual en conjunto (accesible desde Perfil → "Ver Design System").
- Modelo de datos completo en `src/types` para: User, Subject, Unit/Topic/Subtopic, StudySession, WeeklyPlan, Exam, StudyMaterial/Folder, Flashcard/FlashcardDeck, Quiz/QuizQuestion, StudyStats, AppNotification, Achievement — listo para conectar a Supabase sin tocar la UI.

### Archivos importantes creados

- `app.json` — configuración de Expo (dark mode permanente, scheme, plugins de router/fuentes/splash).
- `tsconfig.json` — alias `@/*` → `src/*`.
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/design-system.tsx`
- `src/theme/*`, `src/components/ui/*`, `src/types/*`, `src/constants/*`, `src/hooks/useToast.ts`

### Problemas encontrados y solucionados

1. **`expo install` bloqueado por el proxy** (necesita `api.expo.dev`, denegado por política de red del entorno). Solución: se leyeron las versiones compatibles desde `node_modules/expo/bundledNativeModules.json` y se instalaron con `npm install` fijando versiones exactas.
2. **`react-native-worklets` (peer dependency de Reanimated v4) se removía en instalaciones posteriores** por no estar declarado explícitamente, rompiendo el bundling (`Unable to resolve module react-native-worklets`). Solución: se agregó como dependencia directa en `package.json`.
3. **`tsconfig.json` con `baseUrl` deprecado en TypeScript 6.** Solución: se usa `paths` sin `baseUrl` (soportado desde TS 4.1+, resuelve relativo a la ubicación del tsconfig).
4. **`StyleSheet.absoluteFillObject` no existe en los tipos de RN 0.86** (renombrado). Solución: se reemplazó por `StyleSheet.absoluteFill` en `BottomSheet.tsx` y `ModalDialog.tsx`.
5. **Tipo `ColorValue` del `tabBarIcon` de `expo-router` no asignable a `string`.** Solución: cast explícito `color as string` al pasarlo al componente `Icon`.

### Verificación realizada

- `npx tsc --noEmit` → sin errores.
- `npx expo export --platform android` y `--platform ios` → bundling exitoso (sin errores de resolución de módulos).
- Servidor de desarrollo (`npx expo start`) levantado y probado sirviendo manifest + bundle JS vía HTTP (200 OK en ambos).

### Siguiente etapa

**Etapa 2 — Onboarding**: Splash screen, bienvenida, login/registro (mock), recuperar contraseña, pantalla de gestión de materias (agregar/editar/eliminar/ordenar), configuración de modalidad de estudio (Estándar/Profundo/Libre) y pantalla de configuración completada. Todo con datos mock, sin Supabase todavía.
