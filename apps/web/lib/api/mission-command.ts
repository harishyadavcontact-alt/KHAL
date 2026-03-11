import { toMonolithAppData } from "./app-data";
import { readOperatorProfile } from "./operator";
import { ok, withDb } from "./shared";
import { loadRuntimeProjection } from "../runtime/authority";
import { loadSourceMapProfiles } from "./source-map";
import { loadWarGameDoctrineChains } from "./wargaming-doctrine";

export async function handleMissionCommandBootstrapGet() {
  return withDb((db, dbPath) => {
    const projection = loadRuntimeProjection({ db, dbPath });
    const operator = readOperatorProfile(db);
    const responseLogic = loadWarGameDoctrineChains(db);
    const sourceMapProfiles = loadSourceMapProfiles(db);
    const profilesBySourceId = new Map<string, typeof sourceMapProfiles>();
    for (const profile of sourceMapProfiles) {
      const list = profilesBySourceId.get(profile.sourceId) ?? [];
      list.push(profile);
      profilesBySourceId.set(profile.sourceId, list);
    }

    const monolith = toMonolithAppData(projection);
    return ok({
      ...monolith,
      user: operator.user,
      onboarding: { onboarded: operator.onboarded },
      runtimeInvariants: projection.runtimeInvariants,
      responseLogic,
      sources: (monolith.sources ?? []).map((source: (typeof monolith.sources)[number]) => ({
        ...source,
        mapProfiles: profilesBySourceId.get(source.id) ?? []
      }))
    });
  });
}
