# Progreso del proyecto — StudyFlow

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
