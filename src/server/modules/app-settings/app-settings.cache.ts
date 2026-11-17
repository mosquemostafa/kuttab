import {
  buildCacheKey,
  invalidateByPrefix,
  invalidateCacheKey,
} from "@/server/modules/cache/cache.service";

const APP_SETTINGS_CACHE_PREFIX = "app-settings:v5";

export function appSettingsCacheKey(): string {
  return buildCacheKey(APP_SETTINGS_CACHE_PREFIX, ["default"]);
}

export async function invalidateAppSettingsCache(): Promise<void> {
  await invalidateCacheKey(appSettingsCacheKey());
  await invalidateByPrefix(`${APP_SETTINGS_CACHE_PREFIX}:`);
}
