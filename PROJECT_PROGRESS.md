# Progreso del proyecto — StudyFlow

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
