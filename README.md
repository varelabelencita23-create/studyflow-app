# StudyFlow

**StudyFlow** es un sistema operativo personal para la facultad: una app móvil premium para planificar, organizar y hacer seguimiento del estudio universitario. Ayuda a distribuir materias durante la semana, trackear contenidos por tema/subtema, medir el progreso real y llegar preparado a cada parcial.

> Estado actual: **Etapa 1 — Foundation + Design System** completada. Frontend-only, sin backend todavía.

## Stack

- [Expo](https://expo.dev) (SDK 57) + React Native 0.86
- TypeScript (modo `strict`)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) + Gesture Handler para microinteracciones y gestos
- Tipografía [Inter](https://rsms.me/inter/) vía `@expo-google-fonts/inter`
- `@expo/vector-icons` (Ionicons) para el sistema de íconos
- Arquitectura preparada para integrar **Supabase** más adelante (sin implementar aún)

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
  _layout.tsx                # Layout raíz: fuentes, safe areas, gestos, toasts, stack
  +not-found.tsx
  design-system.tsx          # Pantalla de prueba del sistema de diseño
  (tabs)/
    _layout.tsx               # Tab bar inferior estilo iOS (blur, ícono + label)
    index.tsx                  # Inicio
    materias.tsx                # Materias
    parciales.tsx                # Parciales
    estadisticas.tsx               # Estadísticas
    perfil.tsx                       # Perfil

src/
  theme/          # Colores, tipografía, spacing, radios, sombras (design tokens)
  components/ui/  # Librería de componentes reutilizables
  hooks/          # Hooks compartidos (ej. useToast)
  types/          # Entidades de dominio (preparadas para Supabase)
  constants/      # Constantes de layout y app
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
- `Icon`, `Screen`, `Divider`

Podés ver todos los componentes juntos en la pantalla **Perfil → Ver Design System** dentro de la app.

## Navegación

Tab bar inferior persistente con 5 secciones: **Inicio, Materias, Parciales, Estadísticas, Perfil**. Usa blur translúcido, color de acento para el estado seleccionado y respeta el área segura en iOS y Android.

## Modelo de datos

`src/types` define las entidades de dominio de forma independiente de cualquier backend: `User`, `Subject`, `Unit`/`Topic`/`Subtopic`, `StudySession`, `WeeklyPlan`, `Exam`, `StudyMaterial`/`Folder`, `Flashcard`/`FlashcardDeck`, `Quiz`/`QuizQuestion`, `StudyStats`, `AppNotification`, `Achievement`. Estos tipos van a ser consumidos tanto por los mocks (próximas etapas) como, más adelante, por una capa de servicios conectada a Supabase, sin necesidad de reescribir la UI.

## Roadmap (próximas etapas)

1. ~~Foundation + Design System~~ ✅
2. Onboarding (splash, login/registro, selección de materias, modalidad de estudio)
3. Home / Planificador semanal (drag & drop de materias sobre los días)
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
