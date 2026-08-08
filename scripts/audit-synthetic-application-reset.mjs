import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260808164000_restore_synthetic_reset_after_finalization.sql"), "utf8")

function requirePattern(pattern, message) {
  if (!pattern.test(migration)) throw new Error(message)
}

function forbidPattern(pattern, message) {
  if (pattern.test(migration)) throw new Error(message)
}

requirePattern(/tg_op = 'DELETE'[\s\S]*old\.data_scope = 'synthetic_test'[\s\S]*current_setting\('kleio\.synthetic_cleanup'/, "Immutable-version deletion exception must require DELETE + synthetic scope + transaction-local cleanup flag.")
forbidPattern(/tg_op = 'UPDATE'[\s\S]*return old/i, "Synthetic cleanup must never allow mutation of an immutable submission version.")
requirePattern(/cleanup_synthetic_application_package\(target_package_id uuid\)/, "Synthetic cleanup must use one dedicated server-only function.")
requirePattern(/if package_row\.data_scope <> 'synthetic_test'[\s\S]*synthetic_cleanup_real_package_forbidden/, "Cleanup must fail closed for every non-synthetic package.")
requirePattern(/set_config\('kleio\.synthetic_cleanup', 'on', true\)/, "Synthetic cleanup authorization must be transaction-local.")
requirePattern(/delete from public\.application_deliveries[\s\S]*delete from public\.application_recipient_access[\s\S]*delete from public\.application_submission_versions[\s\S]*delete from public\.application_packages/, "Cleanup order must remove version-restricting delivery/access rows before immutable versions and the package.")
requirePattern(/revoke all on function private\.cleanup_synthetic_application_package\(uuid\) from public, anon, authenticated/, "Synthetic cleanup helper must not be callable from public/anonymous/authenticated client roles.")
requirePattern(/reset_my_kleio_practice_submission\(\)[\s\S]*artist_user_id = current_user_id[\s\S]*data_scope = 'synthetic_test'[\s\S]*cleanup_synthetic_application_package/, "Artist practice reset must remain owner-scoped, synthetic-only, and route through the controlled cleanup function.")
requirePattern(/preserved_artist_data/, "Practice reset must continue stating that artist-owned Passport/media data is preserved.")
forbidPattern(/disable trigger|session_replication_role/i, "Synthetic cleanup must not disable database integrity triggers globally or locally.")

console.log("Synthetic application reset audit passed: real submission immutability remains absolute while owner-scoped synthetic practice/QA packages can be removed through a server-only transaction-local exception.")
