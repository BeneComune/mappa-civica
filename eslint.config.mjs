import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import stylistic from "@stylistic/eslint-plugin"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // General - null: "ignore" permits the `x == null` / `x != null` idiom
      // (checking null+undefined together), already used throughout this
      // codebase; all other loose equality is still forbidden.
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-debugger": "error",

      // Style - matches this codebase's existing convention (no semicolons).
      "@stylistic/semi": ["error", "never"],

      // Destructuring with 4+ properties goes multiline - short 2-3 property
      // destructures (`const { data, error } = useX()`) stay on one line
      // regardless of length. Scoped to ObjectPattern only (destructuring).
      "@stylistic/object-curly-newline": [
        "error",
        { ObjectPattern: { minProperties: 4, multiline: true, consistent: true } },
      ],

      // 100 chars - ignoreUrls/Strings/TemplateLiterals: a long string
      // shouldn't force an awkward wrap just to hit a number. ignoreComments:
      // JSDoc/comment lines aren't code. ignorePattern for `className="..."`:
      // Tailwind strings are left as-is rather than broken.
      "@stylistic/max-len": [
        "error",
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
          ignorePattern: 'className\\s*=\\s*"',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendor files copied verbatim from node_modules/maplibre-gl/dist/ (see
    // lib/map.ts) - minified, not our code.
    "public/maplibre-gl/**",
    // shadcn-generated primitives (see .fallowrc.json) - full generated API
    // kept intact, not hand-formatted to this project's stylistic rules, so
    // `shadcn add` can safely regenerate these files.
    "components/ui/**",
    // The Python data pipeline - no app code, and its .venv bundles vendored
    // JS (matplotlib, urllib3) that must not be linted as ours.
    "pipeline/**",
  ]),
])

export default eslintConfig
