import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleDraftPromote, handleDraftSave } from "../lib/drafts/store";
import { cleanupFixtureDb, createFixtureDb, restoreSettings, snapshotSettings, writeFixtureSettings } from "./support/fixture-db";

const SAMPLE = `Looxmax mostly comes down to sleep, training, and diet.
Grooming stack: beard, hair, eyebrows, hygiene.
Never make appearance changes right before important events.
If travel disrupts sleep then reduce intensity and protect recovery.`;

describe("draft runtime promotions", () => {
  let previousSettings: string | null = null;
  let dbPath = "";

  beforeEach(() => {
    previousSettings = snapshotSettings();
    dbPath = createFixtureDb("khal-draft-runtime-", "KHAL-draft-runtime.sqlite");
    writeFixtureSettings(dbPath);
  });

  afterEach(() => {
    restoreSettings(previousSettings);
    cleanupFixtureDb(dbPath);
  });

  it("persists provenance, landing links, and runtime invariant summaries on promotion", async () => {
    const saveResponse = await handleDraftSave({ title: "Looxmax Draft", input: SAMPLE });
    const saved = await saveResponse.json();
    const stackAnchor = saved.draft.anchors.find((item: { candidateEntityType: string }) => item.candidateEntityType === "stack");
    expect(stackAnchor).toBeTruthy();

    const promoteResponse = await handleDraftPromote({
      id: saved.draft.draft.id,
      title: "Looxmax Draft",
      input: SAMPLE,
      anchorId: stackAnchor.id
    });
    const promoted = await promoteResponse.json();
    expect(promoteResponse.status).toBe(200);
    expect(promoted.link.linkStatus).toBe("linked");
    expect(promoted.promotion.createdEntityType).toBe("stack");
    expect(promoted.runtimeInvariants.hardViolationCount).toBe(0);
  });
});
