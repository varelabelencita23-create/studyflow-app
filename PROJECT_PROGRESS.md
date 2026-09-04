# Progreso del proyecto — StudyFlow

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
