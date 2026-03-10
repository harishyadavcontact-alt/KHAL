import { toMonolithAppData } from "./app-data";
import { readOperatorProfile } from "./operator";
import { ok, withDb } from "./shared";
import { loadRuntimeProjection } from "../runtime/authority";
import { toWarGamingBootstrapData } from "../war-room/bootstrap";
import { loadWarGameDoctrineChains } from "./wargaming-doctrine";
import { loadSourceMapProfiles } from "./source-map";

export async function handleWarGamingBootstrapGet() {
  return withDb((db, dbPath) => {
    const projection = loadRuntimeProjection({ db, dbPath });
    const operator = readOperatorProfile(db);
    const responseLogic = loadWarGameDoctrineChains(db);
    const monolith = toMonolithAppData(projection);
    const sourceMapProfiles = loadSourceMapProfiles(db);
    const profilesBySourceId = new Map<string, typeof sourceMapProfiles>();
    for (const profile of sourceMapProfiles) {
      const list = profilesBySourceId.get(profile.sourceId) ?? [];
      list.push(profile);
      profilesBySourceId.set(profile.sourceId, list);
    }
    return ok(toWarGamingBootstrapData({
      ...monolith,
      user: operator.user,
      sources: (monolith.sources ?? []).map((source: (typeof monolith.sources)[number]) => ({
        ...source,
        mapProfiles: profilesBySourceId.get(source.id) ?? []
      }))
    }, { onboarded: operator.onboarded }, responseLogic));
  });
}
