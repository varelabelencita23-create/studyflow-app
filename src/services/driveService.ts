/**
 * Google Drive import is NOT implemented — it needs a Google Cloud OAuth
 * client (Client ID + Client Secret), the Drive API enabled on that project,
 * and a redirect URI registered for this app (e.g. via `expo-auth-session`),
 * none of which exist yet. Rather than fake a working "Connect"/browse/import
 * flow with mock folders, this service only reports that state honestly so
 * the UI can say so instead of pretending to import real files.
 *
 * To actually build this later:
 * 1. Register an OAuth client in Google Cloud Console, enable the Drive API.
 * 2. Authenticate with `expo-auth-session` (or a Supabase Edge Function
 *    brokering the token exchange) to get an access token.
 * 3. Call the Drive API's `files.list` (`'<folderId>' in parents`) to browse
 *    real folders/files.
 * 4. On import, download the file (`files.get` with `alt=media`, or
 *    `files.export` for native Google Docs formats) and hand the bytes to
 *    `fileService.uploadFile` exactly like a device/gallery pick.
 */
export const driveService = {
  isConfigured(): boolean {
    return false;
  },
};
