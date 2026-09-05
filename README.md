# StudyFlow

**StudyFlow** es un sistema operativo personal para la facultad: una app móvil premium para planificar, organizar y hacer seguimiento del estudio universitario. Ayuda a distribuir materias durante la semana, trackear contenidos por tema/subtema, medir el progreso real y llegar preparado a cada parcial.

> Estado actual: **Etapa 16 — Insights** completada (incluye Etapa 15 — Perfil y configuración). Frontend-only, sin backend todavía (mocks persistidos localmente).

## Stack

- [Expo](https://expo.dev) (SDK 57) + React Native 0.86
- TypeScript (modo `strict`)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) + Gesture Handler para microinteracciones y gestos
- Tipografía [Inter](https://rsms.me/inter/) vía `@expo-google-fonts/inter`
- `@expo/vector-icons` (Ionicons) para el sistema de íconos
- `@react-native-async-storage/async-storage` para persistencia local de los mocks (sesión, materias, configuración)
- Arquitectura preparada para integrar **Supabase** más adelante (capa de servicios ya separada de la UI)

## Cómo ejecutar el proyecto

```bash
npm install
npx expo start
```

Luego escaneá el QR con la app **Expo Go** (Android/iOS) o presioná `a` / `i` en la terminal si tenés un emulador/simulador configurado.

Otros comandos:

```bash
npm run android   # abre en emulador/dispositivo Android
npm run ios       # abre en simulador iOS (requiere macOS)
npm run web       # preview en navegador (soporte parcial)
npx tsc --noEmit  # chequeo de tipos
```

## Estructura del proyecto

```
app/                        # Rutas (Expo Router)
  _layout.tsx                # Layout raíz: fuentes, AppStateProvider, gate de carga, stack
  +not-found.tsx
  design-system.tsx          # Pantalla de prueba del sistema de diseño
  (tabs)/                    # App principal (requiere onboarding completo)
    _layout.tsx               # Tab bar inferior estilo iOS + redirect a onboarding
    index.tsx                  # Inicio
    materias.tsx                # Materias
    parciales.tsx                # Parciales
    estadisticas.tsx               # Estadísticas
    perfil.tsx                       # Perfil: editar perfil, modalidad, notificaciones, reset de onboarding (QA)
  perfil/
    modalidad.tsx                # Cambiar modalidad de estudio después del onboarding
  (onboarding)/               # Flujo de alta (splash lo maneja _layout.tsx)
    _layout.tsx
    welcome.tsx                 # Bienvenida
    auth.tsx                     # Login / Registro (segmented control)
    forgot-password.tsx           # Recuperar contraseña (modal)
    subjects.tsx                   # Tus materias (agregar/editar/eliminar/ordenar)
    study-mode.tsx                  # Modalidad de estudio (Estándar/Profundo/Libre)
    complete.tsx                     # Configuración completada
  materia/
    [id].tsx                    # Home de la materia: progreso, stats, sesiones recientes, accesos
    [id]/
      contenidos.tsx             # Árbol Unidad → Tema → Subtema (expandir/colapsar, CRUD, progreso en cascada)
      plan.tsx                    # Planificación por materia: asignar contenido pendiente a días
      archivos.tsx                 # Biblioteca de archivos: lista de carpetas (5 categorías fijas)
      archivos/
        [category].tsx              # Archivos dentro de una carpeta: agregar/renombrar/eliminar
      parciales.tsx                # Banco de parciales de la materia, organizado por año
      flashcards.tsx                # Dashboard de flashcards (total/dominadas/en progreso/pendientes)
      flashcards/
        crear.tsx                    # Crear mazo: generar (mock) o manual
        [deckId]/
          estudiar.tsx                 # Modo estudio: pregunta → respuesta → no la sabía/la sabía/la dominé
      tests.tsx                    # Dashboard de tests (dificultad, preguntas, último resultado)
      tests/
        crear.tsx                    # Crear test: generar (mock) o manual (opción múltiple)
        [quizId]/
          realizar.tsx                 # Realizar test: pregunta a pregunta → resultado → repasar errores
  parcial/
    [examId].tsx                # Visor de parcial: countdown, % preparado, ritmo, contenidos, archivo
  sesion/
    nueva.tsx                   # Setup: elegir contenidos a estudiar + objetivo
    timer.tsx                    # Timer con pausar/reanudar/finalizar
    resumen.tsx                   # Confirmar completados + resumen de la sesión
    [sessionId].tsx                 # Detalle de una sesión pasada
  drive.tsx                    # Explorador mock de Google Drive para importar archivos

src/
  theme/          # Colores, tipografía, spacing, radios, sombras (design tokens)
  components/     # SplashView + ui/ (librería reutilizable, incluye Switch) + planner/ + subjects/ + content/ + exams/ + charts/
  services/       # Capa mock (auth, materias, contenidos, sesiones, plan de contenidos, archivos, Drive, parciales, flashcards, tests, estadísticas, insights, logros, preferencias, onboarding, plan semanal, storage)
  store/          # AppStateProvider (estado global) + ActiveSessionProvider (timer en curso)
  hooks/          # Hooks compartidos (ej. useToast)
  types/          # Entidades de dominio (preparadas para Supabase)
  constants/      # Constantes de layout y app
  utils/          # Helpers (ids, validadores, fechas de la semana, formato de duración)
```

### Alias de importación

`@/*` apunta a `src/*` (configurado en `tsconfig.json`). Ejemplo: `import { colors } from '@/theme'`.

## Sistema de diseño

Dark mode permanente, minimalista, inspirado en iOS. Fondo negro/casi negro, texto blanco, gris solo para información secundaria y un único color de acento (azul-violeta `#7C6BFF`). Las tarjetas de materia usan fondo blanco con texto negro (variante `light` del componente `Card`).

Componentes disponibles en `src/components/ui`:

- `Button` (variantes primary/secondary/ghost/destructive, tamaños, loading, ícono)
- `Card` (surface/elevated/outline/light)
- `Input` (label, error, íconos, estado de foco animado)
- `ProgressBar` (animada, con label opcional)
- `Chip` (seleccionable, usado para materias)
- `Badge` (estados: neutral/accent/success/warning/danger)
- `SegmentedTabs` (control segmentado estilo iOS con indicador animado)
- `BottomSheet` (con gesto de swipe-to-dismiss)
- `ModalDialog` (confirmaciones con blur de fondo)
- `EmptyState`, `Skeleton` / `SkeletonCard` (loading states)
- `Toast` + `useToast()` (feedback global)
- `SelectableCard` (tarjetas de opción única, usada en modalidad de estudio)
- `Icon`, `Screen`, `Divider`

Podés ver todos los componentes juntos en la pantalla **Perfil → Ver Design System** dentro de la app.

## Navegación

Tab bar inferior persistente con 5 secciones: **Inicio, Materias, Parciales, Estadísticas, Perfil**. Usa blur translúcido, color de acento para el estado seleccionado y respeta el área segura en iOS y Android.

## Flujo de onboarding

Al abrir la app, `app/_layout.tsx` muestra un **splash** animado mientras `AppStateProvider` carga la sesión/materias/configuración persistidas. Si el onboarding no está completo, `(tabs)/_layout.tsx` redirige automáticamente a `/welcome`. El flujo es:

`Bienvenida → Login/Registro → Tus materias (CRUD + orden) → Modalidad de estudio (Estándar 3 / Profundo 2 / Libre N) → Configuración completada → Inicio`

Todo se persiste con `@react-native-async-storage/async-storage` a través de `src/services` (mock de auth y de materias), así que cerrar y reabrir la app conserva el progreso. Desde **Perfil → Reiniciar onboarding** podés volver a recorrer el flujo completo para QA.

## Home / Planificador semanal

El tab **Inicio** es el planificador semanal real (no un calendario de horarios): arriba se muestran chips arrastrables con las materias seleccionadas para la semana (con la cantidad de días asignados como badge), y debajo una lista de los 7 días donde soltar cada materia. Detalles de implementación:

- El drag & drop usa `react-native-gesture-handler` (`Gesture.Pan`) + `react-native-reanimated` (`measure()` sobre `useAnimatedRef`) para detectar en qué día se soltó la materia sin pasar por el hilo de JS en cada frame — el chip vuelve a su lugar con un spring tras cada suelte.
- Si tenés más materias que el máximo de tu modalidad de estudio, un botón "Editar" abre un selector (`WeekSubjectPicker`) para elegir cuáles están activas esta semana.
- Tocar una materia asignada navega a `/materia/[id]`, el "contexto" de esa materia.
- Todo se persiste por semana (`weeklyPlanService`, clave `studyflow/weekly-plan/<lunes-de-la-semana>`) para que cerrar y reabrir la app conserve la distribución.

## Materias y Home de materia

La tab **Materias** tiene CRUD completo (agregar/editar/eliminar/reordenar) igual que en el onboarding — ambas pantallas comparten el bottom sheet `SubjectFormSheet`. Tocar una materia entra a su **Home** (`/materia/[id]`), que se siente como el "universo" de esa materia:

- Progreso general, próximo parcial (real desde la Etapa 13 — countdown al parcial más cercano de esa materia, o "—" si todavía no cargaste ninguno), días asignados esta semana, horas estudiadas, temas completados, cantidad de sesiones y promedio diario — todo calculado a partir de datos reales (contenidos, sesiones y parciales), no hardcodeado.
- Botón **Iniciar sesión** (con guardia: si ya hay una sesión en curso en otra materia, te lleva a esa antes de perderla).
- Últimas 3 sesiones, con acceso al detalle de cada una.
- Grilla de accesos: **Contenidos**, **Plan de estudio**, **Archivos**, **Parciales**, **Flashcards** y **Tests** ya son reales.

## Contenidos (Unidad → Tema → Subtema)

`/materia/[id]/contenidos` muestra la jerarquía real de la materia: **Unidades** expandibles, cada una con sus **Temas**, y cada tema con sus **Subtemas** si los tiene. Cada tema/subtema puede tener prioridad (baja/media/alta), dificultad (fácil/media/difícil), fecha objetivo y una marca de "importante para el parcial" — solo se muestran como badges cuando son notables (prioridad alta, difícil, marcado, o con fecha), para no saturar la lista en el caso común.

El progreso se calcula en cascada, siempre de abajo hacia arriba:
- Un **tema sin subtemas** se completa directamente (tap para tildar).
- Un **tema con subtemas** refleja el promedio de sus subtemas — no se tilda directo, se expande para trabajar sus subtemas.
- Una **unidad** refleja el promedio de sus temas.
- El **progreso de la materia** (mostrado en Materias, el Home de materia y el planificador semanal) es el promedio de todos sus temas — ya no un simple conteo de completados/total, para reflejar mejor el progreso parcial que viene de subtemas.

Las materias creadas en la Etapa 5 (contenidos planos, sin unidades) se migran automáticamente a una unidad "General" la primera vez que se abre esta pantalla, sin perder el progreso ya registrado.

## Planificación por materia

`/materia/[id]/plan` toma el contenido pendiente (temas no completados) y deja asignarlo a un día específico dentro de los días que esa materia ya tiene en el planificador semanal (o los 7 días si todavía no le asignaste ninguno). Muestra progreso general, cuánto te falta planificar y el countdown real al próximo parcial de esa materia. Un contenido solo puede estar asignado a un día a la vez; se persiste con `contentPlanService`.

## Archivos

`/materia/[id]/archivos` es una biblioteca estilo Finder con 5 carpetas fijas por materia (**Apuntes, Clases, Trabajos prácticos, Parciales, Material extra**) — no son creables ni eliminables, son la estructura misma. Adentro de cada una: lista de archivos, estado vacío, y un botón **Agregar archivo** con 4 orígenes (Dispositivo, Cámara, Galería, Google Drive). Tocar un archivo abre sus detalles con **Renombrar** y **Eliminar**.

Como pide esta etapa, todavía no hay subida real: Dispositivo/Cámara/Galería crean un registro mock con un nombre generado (ej. "Foto 2.jpg"), y `fileService.ts` deja comentado exactamente dónde se conectaría cada uno más adelante (`expo-image-picker`, `expo-document-picker`, Supabase Storage para los bytes reales).

## Google Drive (mock)

Desde "Agregar archivo", la opción **Google Drive** abre `/drive`: un conector mock con su propio estado de "no conectado" (botón Conectar) y, una vez conectado, un explorador de carpetas/archivos ficticios con selección múltiple e "Importar (n)". `driveService.ts` dejá documentado en comentarios el punto exacto de integración real (OAuth vía `expo-auth-session`, Drive API `files.list`/`files.get` en vez de los datos mock).

## Parciales (banco por materia, calendario global y ritmo)

- **Banco por materia** (`/materia/[id]/parciales`): parciales organizados por año, con tipo (Parcial/Recuperatorio/Final/Trabajo práctico) y fecha (elegida con un stepper "Faltan N días" en vez de un date-picker completo, para no sumar una librería nueva solo para esto).
- **Calendario global** (tab **Parciales**, antes un placeholder de la Etapa 1): todos los parciales de todas las materias, separados en Próximos/Pasados. Crear uno desde acá primero pide elegir la materia.
- **Visor de parcial** (`/parcial/[examId]`, compartido por el banco y el calendario global): countdown, un estado — **Vas bien / Estás atrasada / Vas adelantada** — según se compare tu ritmo real de estudio (minutos/día, calculado de tus sesiones de los últimos 7 días) contra el ritmo que necesitarías para llegar al 100%. El % preparado sale del progreso real de los contenidos que vincules al parcial (o del progreso general de la materia si todavía no vinculaste ninguno). También podés adjuntar un archivo (usa la misma carpeta "Parciales" de Archivos) y editar/eliminar el parcial.

> El ritmo necesario usa una estimación fija (600 minutos para pasar de 0% a 100% de preparación) porque no hay ninguna señal real de la que derivarlo en un mock — está documentado como tal en `examService.ts`. El resto del cálculo (ritmo actual, % preparado, countdown) sí sale de datos reales de la app.

## Flashcards

Desde el Home de materia, **Flashcards** (`/materia/[id]/flashcards`) muestra el dashboard con total/dominadas/en progreso/pendientes y la lista de mazos. **Crear mazo** ofrece dos modos con un segmented control: **Generar** (elegís contenidos + cantidad y arma preguntas del tipo "¿Qué podés explicar sobre X?" — un mock claramente marcado en `flashcardService.generateMockCards`, con un comentario de dónde iría una llamada real a un modelo de IA) o **Manual** (cargás pregunta/respuesta vos misma). El **modo estudio** (`/materia/[id]/flashcards/[deckId]/estudiar`) es pregunta → "Mostrar respuesta" → **No la sabía / La sabía / La dominé**, con un resumen al terminar el mazo.

## Tests

Desde el Home de materia, **Tests** (`/materia/[id]/tests`) muestra el dashboard con la lista de tests (dificultad, cantidad de preguntas, resultado del último intento). **Crear test** ofrece el mismo segmented control que Flashcards: **Generar** (elegís contenidos + cantidad; `quizService.generateMockQuestions` arma preguntas de opción múltiple con la respuesta correcta mezclada entre 3 distractores fijos — mock documentado) o **Manual** (cargás pregunta + 4 opciones, marcando cuál es la correcta). **Realizar test** (`/materia/[id]/tests/[quizId]/realizar`) es una pregunta a la vez con feedback inmediato (verde/rojo) al elegir, y al terminar te muestra el puntaje y una sección para **repasar errores** (tu respuesta vs. la correcta, pregunta por pregunta). Cada intento se guarda (`quizService.recordAttempt`) para que el dashboard muestre el último resultado.

## Sesiones de estudio

Desde el Home de una materia, **Iniciar sesión** abre `/sesion/nueva`: elegís qué contenidos vas a estudiar (con alta rápida si te falta alguno) y un objetivo opcional (15/30/45/60 min). El timer (`/sesion/timer`) usa timestamps de reloj (no un contador ingenuo) para no perder precisión si la app pasa a segundo plano, con pausar/reanudar y cancelar. Al finalizar, `/sesion/resumen` te deja confirmar cuáles contenidos completaste de verdad y muestra tiempo estudiado, contenidos completados, progreso anterior → nuevo progreso y si cumpliste el objetivo. Todo lo maneja `ActiveSessionProvider` (estado efímero del timer) en conjunto con `contentService` y `sessionService` (persistencia).

## Estadísticas

El tab **Estadísticas** (antes un placeholder de la Etapa 1) es un dashboard de progreso construido con la skill de dataviz del sistema — cada gráfico se eligió por la función que cumple, no por estética, y respeta la regla de marca de un solo color de acento (nunca colores distintos por materia):

- **Avance general**: `ProgressRing`, un anillo circular (SVG, `react-native-svg`) con el promedio de progreso de todas las materias activas — la cifra hero de la pantalla.
- **Racha**: días consecutivos con al menos una sesión de estudio registrada.
- **Hoy / Esta semana / Este mes**: minutos reales estudiados, en una fila de 3 stat tiles.
- **Últimos 7 días**: `BarChart` en forma "emphasis" — la barra de hoy en el acento completo, el resto en gris recesivo (mismo patrón que el gráfico D/W/M de Apple Health/Fitness).
- **Constancia**: `ActivityHeatmap`, una grilla de 70 días estilo GitHub/Apple Fitness — un solo hue, la opacidad sola codifica cuánto estudiaste ese día. Tocar un día muestra la fecha y los minutos.
- **Avance por materia**: `RankedBarList`, una lista de barras horizontales rankeada de mayor a menor progreso — identidad por el nombre directo de la materia, magnitud por el largo de la barra (nunca por color, siguiendo la regla de acento único), con el tiempo estudiado y la cantidad de sesiones como dato secundario de cada fila.

Todo sale de `statsService.ts`, que agrega las `StudySession` reales (no hay datos inventados: sin sesiones, los gráficos muestran ceros).

## Insights y logros

Arriba del dashboard de Estadísticas, dos secciones más de gamificación/analítica derivada, ambas calculadas a partir de datos reales (nunca inventadas):

- **Insights** (`insightsService.ts`): un carrusel horizontal de tarjetas con hallazgos puntuales — racha activa (a partir de 3 días), el parcial más urgente cuyo ritmo real está atrasado (reusa `examService.getReadiness`), la materia a la que más tiempo le dedicaste, tu día de la semana históricamente más productivo, y la tendencia de esta semana vs. la anterior (±15% o más). Cada insight se muestra solo si la condición es realmente significativa — sin sesiones o sin parciales atrasados, el carrusel simplemente no aparece.
- **Logros** (`achievementsService.ts`): 5 logros fijos (`Achievement` de `src/types/notification.ts`) — primera sesión, racha de 7 días, racha de 30 días, materia completada al 100% y "semana perfecta" (cumpliste todos los días planificados de la semana, certificado solo el domingo). Una vez desbloqueado un logro se persiste con su fecha y queda desbloqueado para siempre, aunque la condición deje de cumplirse después (ej. se corta la racha).

## Perfil y configuración

Desde el tab **Perfil**: tocar la tarjeta de perfil abre un `BottomSheet` para editar nombre y email (`authService.updateUser`, wireado en `AppStateProvider`). La sección **Configuración** tiene **Modalidad de estudio** (`/perfil/modalidad`, la misma pantalla que en el onboarding pero para cambiarla después, tal como promete su propio texto: "vas a poder cambiarlo cuando quieras") y **Notificaciones** con dos switches mock (recordatorio diario, alertas de parciales) persistidos en `preferencesService.ts` — no hay push notifications reales todavía (haría falta `expo-notifications` + permisos), pero la preferencia ya se guarda para cuando se conecte esa integración.

## Modelo de datos

`src/types` define las entidades de dominio de forma independiente de cualquier backend: `User`, `Subject`, `Unit`/`Topic`/`Subtopic`, `StudySession`, `WeeklyPlan`, `Exam`, `StudyMaterial`/`Folder`, `Flashcard`/`FlashcardDeck`, `Quiz`/`QuizQuestion`, `StudyStats`, `AppNotification`, `Achievement`. Estos tipos van a ser consumidos tanto por los mocks (próximas etapas) como, más adelante, por una capa de servicios conectada a Supabase, sin necesidad de reescribir la UI.

## Roadmap (próximas etapas)

1. ~~Foundation + Design System~~ ✅
2. ~~Onboarding (splash, login/registro, selección de materias, modalidad de estudio)~~ ✅
3. ~~Home / Planificador semanal (drag & drop de materias sobre los días)~~ ✅
4. ~~Sesiones de estudio (timer, pausas, resumen)~~ ✅
5. ~~Materias (home de materia, accesos a contenidos/plan/archivos/parciales/flashcards/tests)~~ ✅
6. ~~Contenidos jerárquicos (unidad → tema → subtema)~~ ✅
7. ~~Planificación por materia~~ ✅
8. ~~Archivos (biblioteca estilo Finder)~~ ✅
9. ~~Integración de Google Drive (mock)~~ ✅
10. ~~Banco de parciales~~ ✅
11. ~~Flashcards~~ ✅
12. ~~Tests~~ ✅
13. ~~Calendario global de parciales~~ ✅
14. ~~Estadísticas~~ ✅
15. ~~Perfil y configuración~~ ✅
16. ~~Insights~~ ✅
17. Pulido final

Ver `PROJECT_PROGRESS.md` para el detalle de lo realizado en cada etapa.
