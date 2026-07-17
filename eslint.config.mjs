import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Several existing client components hydrate browser storage and external
      // sessions inside effects. Keep these visible while allowing unrelated
      // reliability work to ship; migrate them incrementally to lazy state or
      // useSyncExternalStore before promoting this rule back to an error.
      "react-hooks/set-state-in-effect": "warn",
      // One legacy Assist component selects an icon component during render.
      // Preserve visibility without treating the inherited pattern as a release blocker.
      "react-hooks/static-components": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
