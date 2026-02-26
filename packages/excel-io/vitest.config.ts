import base from "@khal/config/vitest.base";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["test/**/*.test.ts"]
    }
  })
);