# StudyFlow

**StudyFlow** es un sistema operativo personal para la facultad: una app móvil premium para planificar, organizar y hacer seguimiento del estudio universitario. Ayuda a distribuir materias durante la semana, trackear contenidos por tema/subtema, medir el progreso real y llegar preparado a cada parcial.

> Estado actual: **Etapa 3 — Home / Planificador semanal** completada. Frontend-only, sin backend todavía (mocks persistidos localmente).

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
    perfil.tsx                       # Perfil (incluye reset de onboarding para QA)
  (onboarding)/               # Flujo de alta (splash lo maneja _layout.tsx)
    _layout.tsx
    welcome.tsx                 # Bienvenida
    auth.tsx                     # Login / Registro (segmented control)
    forgot-password.tsx           # Recuperar contraseña (modal)
    subjects.tsx                   # Tus materias (agregar/editar/eliminar/ordenar)
    study-mode.tsx                  # Modalidad de estudio (Estándar/Profundo/Libre)
    complete.tsx                     # Configuración completada
  materia/
    [id].tsx                    # Contexto de una materia (accesos a Contenidos/Plan/Archivos/...)

src/
  theme/          # Colores, tipografía, spacing, radios, sombras (design tokens)
  components/     # SplashView + ui/ (librería reutilizable) + planner/ (planificador semanal)
  services/       # Capa mock (auth, materias, onboarding, plan semanal, storage)
  store/          # AppStateProvider — estado global (sesión, materias, modalidad, plan semanal)
  hooks/          # Hooks compartidos (ej. useToast)
  types/          # Entidades de dominio (preparadas para Supabase)
  constants/      # Constantes de layout y app
  utils/          # Helpers (ids, validadores, fechas de la semana)
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
- Tocar una materia asignada navega a `/materia/[id]`, el "contexto" de esa materia (progreso, días asignados, accesos a Contenidos/Plan de estudio/Archivos/Parciales/Flashcards/Tests — todavía como vista previa hasta la Etapa 5).
- Todo se persiste por semana (`weeklyPlanService`, clave `studyflow/weekly-plan/<lunes-de-la-semana>`) para que cerrar y reabrir la app conserve la distribución.

## Modelo de datos

`src/types` define las entidades de dominio de forma independiente de cualquier backend: `User`, `Subject`, `Unit`/`Topic`/`Subtopic`, `StudySession`, `WeeklyPlan`, `Exam`, `StudyMaterial`/`Folder`, `Flashcard`/`FlashcardDeck`, `Quiz`/`QuizQuestion`, `StudyStats`, `AppNotification`, `Achievement`. Estos tipos van a ser consumidos tanto por los mocks (próximas etapas) como, más adelante, por una capa de servicios conectada a Supabase, sin necesidad de reescribir la UI.

## Roadmap (próximas etapas)

1. ~~Foundation + Design System~~ ✅
2. ~~Onboarding (splash, login/registro, selección de materias, modalidad de estudio)~~ ✅
3. ~~Home / Planificador semanal (drag & drop de materias sobre los días)~~ ✅
4. Sesiones de estudio (timer, pausas, resumen)
5. Materias (home de materia, accesos a contenidos/plan/archivos/parciales/flashcards/tests)
6. Contenidos jerárquicos (unidad → tema → subtema)
7. Planificación por materia
8. Archivos (biblioteca estilo Finder)
9. Integración de Google Drive (mock)
10. Banco de parciales
11. Flashcards
12. Tests
13. Calendario global de parciales
14. Estadísticas
15. Perfil y configuración
16. Insights
17. Pulido final

Ver `PROJECT_PROGRESS.md` para el detalle de lo realizado en cada etapa.
