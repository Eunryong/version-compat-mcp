import { SupportedLibrary } from "../src/types/common.js";
import { RawDocumentSnapshot } from "./chunkers/markdownAstChunker.js";

export interface SetupTemplateSeed {
  library: SupportedLibrary;
  major_version: number;
  version: string;
  framework_context: string;
  required_node: string | null;
  install_commands: Array<{
    step: number;
    description: string;
    npm_command: string;
    source_url: string;
  }>;
  config_examples: Array<{
    file_path: string;
    description: string;
    content: string;
    source_url: string;
  }>;
  obsolete_patterns: string[];
  source_url: string;
  git_tag: string;
}

export interface IndexedVersionSeed {
  library: SupportedLibrary;
  version: string;
  major: number;
  minor: number;
  patch: number;
  git_tag: string;
  release_date: string;
  required_node: string | null;
}

export const INDEXED_VERSIONS_SEED: IndexedVersionSeed[] = [
  // Tailwind CSS
  {
    library: "tailwindcss",
    version: "3.4.17",
    major: 3,
    minor: 4,
    patch: 17,
    git_tag: "v3.4.17",
    release_date: "2024-12-18",
    required_node: ">=14.0.0",
  },
  {
    library: "tailwindcss",
    version: "4.0.0",
    major: 4,
    minor: 0,
    patch: 0,
    git_tag: "v4.0.0",
    release_date: "2025-01-22",
    required_node: ">=20.0.0",
  },
  // ESLint
  {
    library: "eslint",
    version: "8.57.1",
    major: 8,
    minor: 57,
    patch: 1,
    git_tag: "v8.57.1",
    release_date: "2024-09-25",
    required_node: "^12.22.0 || ^14.17.0 || >=16.0.0",
  },
  {
    library: "eslint",
    version: "9.14.0",
    major: 9,
    minor: 14,
    patch: 0,
    git_tag: "v9.14.0",
    release_date: "2024-11-01",
    required_node: "^18.18.0 || ^20.9.0 || >=21.1.0",
  },
  // Next.js
  {
    library: "nextjs",
    version: "13.5.6",
    major: 13,
    minor: 5,
    patch: 6,
    git_tag: "v13.5.6",
    release_date: "2023-10-16",
    required_node: ">=16.14.0",
  },
  {
    library: "nextjs",
    version: "14.2.15",
    major: 14,
    minor: 2,
    patch: 15,
    git_tag: "v14.2.15",
    release_date: "2024-10-09",
    required_node: ">=18.17.0",
  },
  {
    library: "nextjs",
    version: "15.0.3",
    major: 15,
    minor: 0,
    patch: 3,
    git_tag: "v15.0.3",
    release_date: "2024-11-07",
    required_node: "^18.18.0 || ^19.8.0 || >= 20.0.0",
  },
  // React
  {
    library: "react",
    version: "18.3.1",
    major: 18,
    minor: 3,
    patch: 1,
    git_tag: "v18.3.1",
    release_date: "2024-04-26",
    required_node: ">=14.0.0",
  },
  {
    library: "react",
    version: "19.0.0",
    major: 19,
    minor: 0,
    patch: 0,
    git_tag: "v19.0.0",
    release_date: "2024-12-05",
    required_node: ">=18.0.0",
  },
  // Vite
  {
    library: "vite",
    version: "4.5.5",
    major: 4,
    minor: 5,
    patch: 5,
    git_tag: "v4.5.5",
    release_date: "2024-09-26",
    required_node: "^14.18.0 || >=16.0.0",
  },
  {
    library: "vite",
    version: "5.4.11",
    major: 5,
    minor: 4,
    patch: 11,
    git_tag: "v5.4.11",
    release_date: "2024-11-12",
    required_node: "^18.0.0 || >=20.0.0",
  },
  {
    library: "vite",
    version: "6.0.0",
    major: 6,
    minor: 0,
    patch: 0,
    git_tag: "v6.0.0",
    release_date: "2024-11-26",
    required_node: "^18.0.0 || ^20.0.0 || >=22.0.0",
  },
  // TypeScript
  {
    library: "typescript",
    version: "5.7.2",
    major: 5,
    minor: 7,
    patch: 2,
    git_tag: "v5.7.2",
    release_date: "2024-11-22",
    required_node: ">=14.17",
  },
  // Node.js
  {
    library: "node",
    version: "18.20.4",
    major: 18,
    minor: 20,
    patch: 4,
    git_tag: "v18.20.4",
    release_date: "2024-07-08",
    required_node: ">=18.0.0",
  },
  {
    library: "node",
    version: "20.18.0",
    major: 20,
    minor: 18,
    patch: 0,
    git_tag: "v20.18.0",
    release_date: "2024-10-03",
    required_node: ">=20.0.0",
  },
  {
    library: "node",
    version: "22.11.0",
    major: 22,
    minor: 11,
    patch: 0,
    git_tag: "v22.11.0",
    release_date: "2024-10-29",
    required_node: ">=22.0.0",
  },
  // Python
  {
    library: "python",
    version: "3.10.14",
    major: 3,
    minor: 10,
    patch: 14,
    git_tag: "v3.10.14",
    release_date: "2024-03-19",
    required_node: null,
  },
  {
    library: "python",
    version: "3.11.9",
    major: 3,
    minor: 11,
    patch: 9,
    git_tag: "v3.11.9",
    release_date: "2024-04-02",
    required_node: null,
  },
  {
    library: "python",
    version: "3.12.7",
    major: 3,
    minor: 12,
    patch: 7,
    git_tag: "v3.12.7",
    release_date: "2024-10-01",
    required_node: null,
  },
  {
    library: "python",
    version: "3.13.0",
    major: 3,
    minor: 13,
    patch: 0,
    git_tag: "v3.13.0",
    release_date: "2024-10-07",
    required_node: null,
  },
  // Pydantic
  {
    library: "pydantic",
    version: "1.10.18",
    major: 1,
    minor: 10,
    patch: 18,
    git_tag: "v1.10.18",
    release_date: "2024-09-04",
    required_node: null,
  },
  {
    library: "pydantic",
    version: "2.10.6",
    major: 2,
    minor: 10,
    patch: 6,
    git_tag: "v2.10.6",
    release_date: "2025-01-23",
    required_node: null,
  },
  // FastAPI
  {
    library: "fastapi",
    version: "0.100.0",
    major: 0,
    minor: 100,
    patch: 0,
    git_tag: "0.100.0",
    release_date: "2023-07-11",
    required_node: null,
  },
  {
    library: "fastapi",
    version: "0.115.6",
    major: 0,
    minor: 115,
    patch: 6,
    git_tag: "0.115.6",
    release_date: "2024-12-09",
    required_node: null,
  },
  // SQLAlchemy
  {
    library: "sqlalchemy",
    version: "1.4.53",
    major: 1,
    minor: 4,
    patch: 53,
    git_tag: "rel_1_4_53",
    release_date: "2024-06-19",
    required_node: null,
  },
  {
    library: "sqlalchemy",
    version: "2.0.36",
    major: 2,
    minor: 0,
    patch: 36,
    git_tag: "rel_2_0_36",
    release_date: "2024-10-18",
    required_node: null,
  },
  // LangChain
  {
    library: "langchain",
    version: "0.1.20",
    major: 0,
    minor: 1,
    patch: 20,
    git_tag: "v0.1.20",
    release_date: "2024-05-10",
    required_node: null,
  },
  {
    library: "langchain",
    version: "0.2.16",
    major: 0,
    minor: 2,
    patch: 16,
    git_tag: "v0.2.16",
    release_date: "2024-08-30",
    required_node: null,
  },
  {
    library: "langchain",
    version: "0.3.7",
    major: 0,
    minor: 3,
    patch: 7,
    git_tag: "v0.3.7",
    release_date: "2024-11-06",
    required_node: null,
  },
  // uv
  {
    library: "uv",
    version: "0.4.30",
    major: 0,
    minor: 4,
    patch: 30,
    git_tag: "0.4.30",
    release_date: "2024-10-31",
    required_node: null,
  },
  {
    library: "uv",
    version: "0.5.2",
    major: 0,
    minor: 5,
    patch: 2,
    git_tag: "0.5.2",
    release_date: "2024-11-20",
    required_node: null,
  },
];

export const SETUP_TEMPLATES_SEED: SetupTemplateSeed[] = [
  // Tailwind CSS v4 (Vite)
  {
    library: "tailwindcss",
    major_version: 4,
    version: "4.0.0",
    framework_context: "vite",
    required_node: ">=20.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install Tailwind CSS v4 and the official Vite plugin",
        npm_command: "npm install tailwindcss @tailwindcss/vite",
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-vite.mdx#L18-L25",
      },
    ],
    config_examples: [
      {
        file_path: "vite.config.ts",
        description: "Register @tailwindcss/vite plugin in Vite config",
        content: `import { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'\n\nexport default defineConfig({\n  plugins: [\n    tailwindcss(),\n  ],\n})`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-vite.mdx#L28-L39",
      },
      {
        file_path: "src/index.css",
        description: "Import Tailwind CSS v4 using standard CSS @import",
        content: `@import "tailwindcss";`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-vite.mdx#L42-L46",
      },
    ],
    obsolete_patterns: [
      "Do NOT run 'npx tailwindcss init -p' (the init command was removed in Tailwind CSS v4).",
      "Do NOT create tailwind.config.js by default (Tailwind v4 uses CSS-first '@theme' configuration).",
      "Do NOT use '@tailwind base; @tailwind components; @tailwind utilities;' (replaced by '@import \"tailwindcss\";').",
    ],
    source_url:
      "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-vite.mdx",
    git_tag: "v4.0.0",
  },
  // Tailwind CSS v4 (Next.js / PostCSS / Standalone)
  {
    library: "tailwindcss",
    major_version: 4,
    version: "4.0.0",
    framework_context: "standalone",
    required_node: ">=20.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install Tailwind CSS v4 and @tailwindcss/postcss",
        npm_command: "npm install tailwindcss @tailwindcss/postcss postcss",
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-postcss.mdx#L15-L24",
      },
    ],
    config_examples: [
      {
        file_path: "postcss.config.mjs",
        description: "Configure @tailwindcss/postcss plugin",
        content: `export default {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n};`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-postcss.mdx#L27-L36",
      },
      {
        file_path: "src/app/globals.css",
        description: "Import Tailwind CSS v4 and customize theme via @theme",
        content: `@import "tailwindcss";\n\n@theme {\n  --font-display: "Satoshi", "sans-serif";\n}`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-postcss.mdx#L39-L48",
      },
    ],
    obsolete_patterns: [
      "Do NOT run 'npx tailwindcss init -p' (removed in v4).",
      "Do NOT configure 'tailwindcss: {}' directly in postcss.config.js (moved to '@tailwindcss/postcss').",
      "Do NOT use '@tailwind base' directives (use '@import \"tailwindcss\";').",
    ],
    source_url:
      "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/installation/using-postcss.mdx",
    git_tag: "v4.0.0",
  },
  // Tailwind CSS v3
  {
    library: "tailwindcss",
    major_version: 3,
    version: "3.4.17",
    framework_context: "standalone",
    required_node: ">=14.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install Tailwind CSS v3, PostCSS, and Autoprefixer",
        npm_command: "npm install -D tailwindcss@^3 postcss autoprefixer",
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx#L15-L22",
      },
      {
        step: 2,
        description: "Generate tailwind.config.js and postcss.config.js",
        npm_command: "npx tailwindcss init -p",
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx#L23-L28",
      },
    ],
    config_examples: [
      {
        file_path: "tailwind.config.js",
        description: "Tailwind CSS v3 content glob configuration",
        content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx#L32-L44",
      },
      {
        file_path: "src/index.css",
        description: "Tailwind CSS v3 directives",
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
        source_url:
          "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx#L47-L53",
      },
    ],
    obsolete_patterns: [
      "Do NOT use '@import \"tailwindcss\";' or '@tailwindcss/vite' in Tailwind v3 projects.",
    ],
    source_url:
      "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx",
    git_tag: "v3.4.17",
  },
  // ESLint v9
  {
    library: "eslint",
    major_version: 9,
    version: "9.14.0",
    framework_context: "standalone",
    required_node: "^18.18.0 || ^20.9.0 || >=21.1.0",
    install_commands: [
      {
        step: 1,
        description: "Install ESLint v9, @eslint/js, globals, and typescript-eslint",
        npm_command: "npm install -D eslint @eslint/js globals typescript-eslint",
        source_url:
          "https://github.com/eslint/eslint/blob/v9.14.0/docs/src/use/getting-started.md#L30-L45",
      },
    ],
    config_examples: [
      {
        file_path: "eslint.config.mjs",
        description: "ESLint v9 Flat Config with TypeScript support",
        content: `import js from "@eslint/js";\nimport globals from "globals";\nimport tseslint from "typescript-eslint";\n\nexport default tseslint.config(\n  { ignores: ["dist/**", "node_modules/**"] },\n  js.configs.recommended,\n  ...tseslint.configs.recommended,\n  {\n    languageOptions: {\n      globals: globals.browser,\n    },\n  }\n);`,
        source_url:
          "https://github.com/eslint/eslint/blob/v9.14.0/docs/src/use/getting-started.md#L55-L82",
      },
    ],
    obsolete_patterns: [
      "Do NOT create .eslintrc.json, .eslintrc.js, or .eslintignore in ESLint v9 (legacy eslintrc format is removed by default).",
      "Do NOT use 'env: { browser: true, node: true }' (replaced by 'languageOptions.globals').",
    ],
    source_url:
      "https://github.com/eslint/eslint/blob/v9.14.0/docs/src/use/getting-started.md",
    git_tag: "v9.14.0",
  },
  // ESLint v8
  {
    library: "eslint",
    major_version: 8,
    version: "8.57.1",
    framework_context: "standalone",
    required_node: "^12.22.0 || ^14.17.0 || >=16.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install ESLint v8",
        npm_command: "npm install -D eslint@^8.57.0",
        source_url:
          "https://github.com/eslint/eslint/blob/v8.57.1/docs/src/use/getting-started.md#L25-L38",
      },
    ],
    config_examples: [
      {
        file_path: ".eslintrc.json",
        description: "ESLint v8 legacy eslintrc configuration",
        content: `{\n  "env": {\n    "browser": true,\n    "es2021": true,\n    "node": true\n  },\n  "extends": ["eslint:recommended"],\n  "parserOptions": {\n    "ecmaVersion": "latest",\n    "sourceType": "module"\n  },\n  "rules": {}\n}`,
        source_url:
          "https://github.com/eslint/eslint/blob/v8.57.1/docs/src/use/configure/configuration-files.md#L40-L65",
      },
    ],
    obsolete_patterns: [],
    source_url:
      "https://github.com/eslint/eslint/blob/v8.57.1/docs/src/use/getting-started.md",
    git_tag: "v8.57.1",
  },
  // Next.js v15
  {
    library: "nextjs",
    major_version: 15,
    version: "15.0.3",
    framework_context: "standalone",
    required_node: "^18.18.0 || ^19.8.0 || >= 20.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install Next.js 15 with React 19",
        npm_command: "npm install next@15 react@19 react-dom@19",
        source_url:
          "https://github.com/vercel/next.js/blob/v15.0.3/docs/01-app/01-getting-started/01-installation.mdx#L65-L78",
      },
    ],
    config_examples: [
      {
        file_path: "next.config.ts",
        description: "Next.js 15 native TypeScript configuration",
        content: `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n  /* config options here */\n};\n\nexport default nextConfig;`,
        source_url:
          "https://github.com/vercel/next.js/blob/v15.0.3/docs/01-app/02-api-reference/05-next-config-js/index.mdx#L20-L35",
      },
    ],
    obsolete_patterns: [
      "Do NOT access cookies(), headers(), draftMode(), params, or searchParams synchronously in Next.js 15 (they are now Promises and must be awaited).",
      "Do NOT assume fetch() or GET Route Handlers are cached by default in Next.js 15.",
    ],
    source_url:
      "https://github.com/vercel/next.js/blob/v15.0.3/docs/01-app/01-getting-started/01-installation.mdx",
    git_tag: "v15.0.3",
  },
  // Next.js v14
  {
    library: "nextjs",
    major_version: 14,
    version: "14.2.15",
    framework_context: "standalone",
    required_node: ">=18.17.0",
    install_commands: [
      {
        step: 1,
        description: "Install Next.js 14 with React 18",
        npm_command: "npm install next@14 react@18 react-dom@18",
        source_url:
          "https://github.com/vercel/next.js/blob/v14.2.15/docs/01-app/01-building-your-application/08-upgrading/04-version-14.mdx#L18-L26",
      },
    ],
    config_examples: [
      {
        file_path: "next.config.mjs",
        description: "Next.js 14 ESM configuration (next.config.ts is NOT supported in v14)",
        content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\n\nexport default nextConfig;`,
        source_url:
          "https://github.com/vercel/next.js/blob/v14.2.15/docs/01-app/02-api-reference/05-next-config-js/index.mdx#L18-L28",
      },
    ],
    obsolete_patterns: [
      "Do NOT use next.config.ts in Next.js 14 (native TypeScript config was introduced in Next.js 15).",
    ],
    source_url:
      "https://github.com/vercel/next.js/blob/v14.2.15/docs/01-app/01-building-your-application/08-upgrading/04-version-14.mdx",
    git_tag: "v14.2.15",
  },
  // React v19
  {
    library: "react",
    major_version: 19,
    version: "19.0.0",
    framework_context: "standalone",
    required_node: ">=18.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install React 19 and React DOM 19",
        npm_command: "npm install react@19 react-dom@19",
        source_url: "https://github.com/facebook/react/blob/v19.0.0/CHANGELOG.md#L1-L25",
      },
    ],
    config_examples: [
      {
        file_path: "src/main.tsx",
        description: "Mount React 19 root with createRoot",
        content: `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);`,
        source_url: "https://github.com/facebook/react/blob/v19.0.0/CHANGELOG.md#L30-L52",
      },
    ],
    obsolete_patterns: [
      "Do NOT use ReactDOM.render or ReactDOM.hydrate (removed in React 19; use createRoot / hydrateRoot).",
      "Do NOT wrap new function components in forwardRef (pass ref directly as a prop in React 19).",
    ],
    source_url: "https://github.com/facebook/react/blob/v19.0.0/CHANGELOG.md",
    git_tag: "v19.0.0",
  },
  // Vite v6
  {
    library: "vite",
    major_version: 6,
    version: "6.0.0",
    framework_context: "standalone",
    required_node: "^18.0.0 || ^20.0.0 || >=22.0.0",
    install_commands: [
      {
        step: 1,
        description: "Install Vite v6",
        npm_command: "npm install -D vite@^6.0.0",
        source_url:
          "https://github.com/vitejs/vite/blob/v6.0.0/docs/guide/index.md#L40-L55",
      },
    ],
    config_examples: [
      {
        file_path: "vite.config.ts",
        description: "Vite v6 configuration",
        content: `import { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [],\n});`,
        source_url:
          "https://github.com/vitejs/vite/blob/v6.0.0/docs/guide/index.md#L60-L72",
      },
    ],
    obsolete_patterns: [
      "Do NOT use CommonJS vite.config.cjs when ESM is enabled; Vite CJS Node API is deprecated.",
    ],
    source_url: "https://github.com/vitejs/vite/blob/v6.0.0/docs/guide/index.md",
    git_tag: "v6.0.0",
  },
  // TypeScript v5
  {
    library: "typescript",
    major_version: 5,
    version: "5.7.2",
    framework_context: "standalone",
    required_node: ">=14.17",
    install_commands: [
      {
        step: 1,
        description: "Install TypeScript 5.x",
        npm_command: "npm install -D typescript@^5.7.0",
        source_url:
          "https://github.com/microsoft/TypeScript/blob/v5.7.2/README.md#L25-L38",
      },
    ],
    config_examples: [
      {
        file_path: "tsconfig.json",
        description: "TypeScript 5 modern bundler/ESM configuration",
        content: `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "verbatimModuleSyntax": true,\n    "strict": true,\n    "skipLibCheck": true\n  }\n}`,
        source_url:
          "https://github.com/microsoft/TypeScript/blob/v5.7.2/README.md#L40-L60",
      },
    ],
    obsolete_patterns: [
      "Do NOT use deprecated 'importsNotUsedAsValues' or 'preserveValueImports' (use 'verbatimModuleSyntax: true' in TypeScript 5+).",
    ],
    source_url: "https://github.com/microsoft/TypeScript/blob/v5.7.2/README.md",
    git_tag: "v5.7.2",
  },
  // Node.js v22
  {
    library: "node",
    major_version: 22,
    version: "22.11.0",
    framework_context: "standalone",
    required_node: ">=22.0.0",
    install_commands: [
      {
        step: 1,
        description: "Pin Node.js 22 LTS in .nvmrc",
        npm_command: "node -v",
        source_url:
          "https://github.com/nodejs/node/blob/v22.11.0/doc/api/deprecations.md#L1-L20",
      },
    ],
    config_examples: [
      {
        file_path: ".nvmrc",
        description: "Pin Node.js 22 LTS version",
        content: `22.11.0`,
        source_url:
          "https://github.com/nodejs/node/blob/v22.11.0/doc/api/deprecations.md#L1-L20",
      },
    ],
    obsolete_patterns: [
      "Avoid installing 'node-fetch' or 'dotenv' when running on Node.js 20/22+ unless legacy features are needed (native global fetch and --env-file are built in).",
    ],
    source_url:
      "https://github.com/nodejs/node/blob/v22.11.0/doc/api/deprecations.md",
    git_tag: "v22.11.0",
  },
  // Python 3.12
  {
    library: "python",
    major_version: 3,
    version: "3.12.7",
    framework_context: "standalone",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Set local Python version using .python-version",
        npm_command: "python3 -V",
        source_url:
          "https://github.com/python/cpython/blob/v3.12.7/Doc/whatsnew/3.12.rst",
      },
    ],
    config_examples: [
      {
        file_path: ".python-version",
        description: "Pin Python runtime version",
        content: `3.12.7\n`,
        source_url:
          "https://github.com/python/cpython/blob/v3.12.7/Doc/whatsnew/3.12.rst",
      },
      {
        file_path: "pyproject.toml",
        description: "Modern PEP 621 packaging metadata",
        content: `[project]\nname = "my-python-app"\nversion = "0.1.0"\nrequires-python = ">=3.12"\ndependencies = []\n`,
        source_url:
          "https://github.com/python/cpython/blob/v3.12.7/Doc/whatsnew/3.12.rst",
      },
    ],
    obsolete_patterns: [
      "Do NOT use setup.py with direct 'python setup.py install' (deprecated; use pyproject.toml with build backend).",
      "Do NOT use removed standard library modules (e.g. cgi, telnetlib, pipes, chunk, imghdr, sndhdr, crypt in Python 3.13).",
    ],
    source_url:
      "https://github.com/python/cpython/blob/v3.12.7/Doc/whatsnew/3.12.rst",
    git_tag: "v3.12.7",
  },
  // Pydantic v2
  {
    library: "pydantic",
    major_version: 2,
    version: "2.10.6",
    framework_context: "standalone",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Install Pydantic v2 and optional settings package",
        npm_command: "pip install \"pydantic>=2.10.0\" pydantic-settings",
        source_url:
          "https://github.com/pydantic/pydantic/blob/v2.10.6/docs/migration.md",
      },
    ],
    config_examples: [
      {
        file_path: "models.py",
        description: "Pydantic v2 modern model with model_dump and field_validator",
        content: `from pydantic import BaseModel, Field, field_validator\n\nclass UserModel(BaseModel):\n    id: int\n    name: str = Field(..., min_length=1)\n\n    @field_validator("name")\n    @classmethod\n    def validate_name(cls, v: str) -> str:\n        return v.strip().title()\n\n# Usage:\n# user = UserModel.model_validate({"id": 1, "name": "alice"})\n# data = user.model_dump()\n`,
        source_url:
          "https://github.com/pydantic/pydantic/blob/v2.10.6/docs/migration.md",
      },
    ],
    obsolete_patterns: [
      "Do NOT use '.dict()' in Pydantic v2 (deprecated; replace with '.model_dump()').",
      "Do NOT use '.json()' in Pydantic v2 (deprecated; replace with '.model_dump_json()').",
      "Do NOT use '@validator' in Pydantic v2 (deprecated; replace with '@field_validator').",
      "Do NOT use '@root_validator' in Pydantic v2 (deprecated; replace with '@model_validator').",
      "Do NOT import 'BaseSettings' from 'pydantic' directly (moved to 'pydantic-settings' package).",
      "Do NOT use 'parse_obj()' in Pydantic v2 (deprecated; replace with 'model_validate()').",
    ],
    source_url:
      "https://github.com/pydantic/pydantic/blob/v2.10.6/docs/migration.md",
    git_tag: "v2.10.6",
  },
  // FastAPI Lifespan
  {
    library: "fastapi",
    major_version: 0,
    version: "0.115.6",
    framework_context: "fastapi",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Install FastAPI and Uvicorn",
        npm_command: "pip install \"fastapi>=0.115.0\" \"uvicorn[standard]\"",
        source_url:
          "https://github.com/fastapi/fastapi/blob/0.115.6/docs/en/docs/advanced/events.md",
      },
    ],
    config_examples: [
      {
        file_path: "main.py",
        description: "FastAPI modern lifespan context manager",
        content: `from contextlib import asynccontextmanager\nfrom fastapi import FastAPI\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    # Startup logic: initialize database connection pool, cache\n    print("Starting up application...")\n    yield\n    # Shutdown logic: close database connections, cleanup resources\n    print("Shutting down application...")\n\napp = FastAPI(lifespan=lifespan)\n\n@app.get("/")\nasync def root():\n    return {"message": "Hello World"}\n`,
        source_url:
          "https://github.com/fastapi/fastapi/blob/0.115.6/docs/en/docs/advanced/events.md",
      },
    ],
    obsolete_patterns: [
      "Do NOT use '@app.on_event(\"startup\")' or '@app.on_event(\"shutdown\")' (deprecated; use lifespan async context manager).",
    ],
    source_url:
      "https://github.com/fastapi/fastapi/blob/0.115.6/docs/en/docs/advanced/events.md",
    git_tag: "0.115.6",
  },
  // SQLAlchemy 2.0
  {
    library: "sqlalchemy",
    major_version: 2,
    version: "2.0.36",
    framework_context: "standalone",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Install SQLAlchemy 2.0",
        npm_command: "pip install \"sqlalchemy>=2.0.0\"",
        source_url:
          "https://github.com/sqlalchemy/sqlalchemy/blob/rel_2_0_36/doc/build/changelog/migration_20.rst",
      },
    ],
    config_examples: [
      {
        file_path: "database.py",
        description: "SQLAlchemy 2.0 2.0-style DeclarativeBase, Mapped annotations, and select() queries",
        content: `from sqlalchemy import create_engine, select, String\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session\n\nclass Base(DeclarativeBase):\n    pass\n\nclass User(Base):\n    __tablename__ = "users"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    name: Mapped[str] = mapped_column(String(50))\n\nengine = create_engine("sqlite:///app.db")\nBase.metadata.create_all(engine)\n\nwith Session(engine) as session:\n    # 2.0 style query:\n    stmt = select(User).where(User.name == "alice")\n    user = session.scalars(stmt).first()\n`,
        source_url:
          "https://github.com/sqlalchemy/sqlalchemy/blob/rel_2_0_36/doc/build/changelog/migration_20.rst",
      },
    ],
    obsolete_patterns: [
      "Do NOT use legacy 'session.query(Model)' in SQLAlchemy 2.0 (deprecated/legacy; use 'session.scalars(select(Model))' or 'session.execute(select(Model))').",
      "Do NOT use 'declarative_base()' function for modern models (use subclass of 'DeclarativeBase').",
      "Do NOT use untyped 'Column()' in Declarative models (use 'Mapped[T]' with 'mapped_column()').",
    ],
    source_url:
      "https://github.com/sqlalchemy/sqlalchemy/blob/rel_2_0_36/doc/build/changelog/migration_20.rst",
    git_tag: "rel_2_0_36",
  },
  // LangChain 0.3
  {
    library: "langchain",
    major_version: 0,
    version: "0.3.7",
    framework_context: "standalone",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Install LangChain and langchain-core",
        npm_command: "pip install langchain langchain-core",
        source_url:
          "https://github.com/langchain-ai/langchain/blob/v0.3.7/docs/docs/how_to/migrate_chains.mdx",
      },
    ],
    config_examples: [
      {
        file_path: "agent.py",
        description: "Modern LangChain LCEL chain with pipe operator",
        content: `from langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\n\n# Modern LangChain 0.3 LCEL pipeline (prompt | model | parser)\nprompt = ChatPromptTemplate.from_template("Translate to Korean: {input}")\n# chain = prompt | model | StrOutputParser()\n# result = await chain.ainvoke({"input": "Hello world"})\n`,
        source_url:
          "https://github.com/langchain-ai/langchain/blob/v0.3.7/docs/docs/how_to/migrate_chains.mdx",
      },
    ],
    obsolete_patterns: [
      "Do NOT use legacy 'LLMChain' or 'initialize_agent' in LangChain 0.2/0.3 (deprecated; migrate to LangChain Expression Language (LCEL) or LangGraph).",
      "Do NOT import core classes from root 'langchain' package when available in 'langchain-core' (use 'langchain_core.prompts', 'langchain_core.messages').",
    ],
    source_url:
      "https://github.com/langchain-ai/langchain/blob/v0.3.7/docs/docs/how_to/migrate_chains.mdx",
    git_tag: "v0.3.7",
  },
  // uv
  {
    library: "uv",
    major_version: 0,
    version: "0.5.2",
    framework_context: "standalone",
    required_node: null,
    install_commands: [
      {
        step: 1,
        description: "Install or update uv CLI",
        npm_command: "pip install uv",
        source_url:
          "https://github.com/astral-sh/uv/blob/0.5.2/docs/getting-started/installation.md",
      },
    ],
    config_examples: [
      {
        file_path: "pyproject.toml",
        description: "uv-managed PEP 621 project configuration",
        content: `[project]\nname = "fastapi-uv-app"\nversion = "0.1.0"\nrequires-python = ">=3.12"\ndependencies = [\n    "fastapi>=0.115.0",\n    "uvicorn[standard]>=0.32.0",\n    "pydantic>=2.10.0",\n]\n\n[build-system]\nrequires = ["hatchling"]\nbuild-backend = "hatchling.build"\n`,
        source_url:
          "https://github.com/astral-sh/uv/blob/0.5.2/docs/getting-started/installation.md",
      },
    ],
    obsolete_patterns: [
      "Do NOT run 'pip install -r requirements.txt' in uv-managed projects (use 'uv add <pkg>' or 'uv sync').",
      "Do NOT run 'pip freeze > requirements.txt' (uv uses deterministic 'uv.lock').",
    ],
    source_url:
      "https://github.com/astral-sh/uv/blob/0.5.2/docs/getting-started/installation.md",
    git_tag: "0.5.2",
  },
];

export const RAW_DOCUMENT_SNAPSHOTS: RawDocumentSnapshot[] = [
  // ============================================================================
  // 1. Tailwind CSS v4.0.0 Upgrade Guide
  // ============================================================================
  {
    library: "tailwindcss",
    version: "4.0.0",
    major_version: 4,
    doc_type: "migration_guide",
    git_tag: "v4.0.0",
    base_source_url:
      "https://github.com/tailwindlabs/tailwindcss.com/blob/v4.0.0/src/docs/upgrade-guide.mdx",
    collected_at: "2026-10-15",
    codemod_command: "npx @tailwindcss/upgrade",
    markdown: `# Upgrading your Tailwind CSS projects from v3 to v4

## Using the upgrade tool (Automated Codemod)
If you are upgrading a project from Tailwind CSS v3 to v4, you can use our automated upgrade tool to handle most of the migration steps automatically. Running the upgrade tool requires **Node.js 20 or higher**.
\`\`\`bash
npx @tailwindcss/upgrade
\`\`\`
The upgrade tool will migrate your \`tailwind.config.js\` settings to CSS \`@theme\`, update your PostCSS/Vite dependencies, and replace deprecated utility classes in your templates.

## Removed @tailwind directives (Breaking Change)
In Tailwind CSS v4, you import Tailwind using a regular CSS \`@import\` statement instead of the \`@tailwind\` directives you used in v3:
\`\`\`css
/* Before (Tailwind CSS v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After (Tailwind CSS v4) */
@import "tailwindcss";
\`\`\`
 also note that \`npx tailwindcss init\` has been removed because v4 does not require a configuration file or directive scaffolding.

## Dedicated PostCSS and Vite plugin packages (Breaking Change)
In Tailwind CSS v4, the PostCSS plugin and CLI are no longer bundled directly inside the \`tailwindcss\` package.
- For **PostCSS / Next.js**, install \`@tailwindcss/postcss\` and update \`postcss.config.mjs\`:
\`\`\`js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
\`\`\`
- For **Vite**, install \`@tailwindcss/vite\` instead of using PostCSS:
\`\`\`ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
\`\`\`
- For the **Tailwind CLI**, install \`@tailwindcss/cli\`.

## CSS-first configuration with @theme (Breaking Change)
In Tailwind CSS v4, configuration is done directly in your CSS file using the \`@theme\` directive instead of \`tailwind.config.js\`:
\`\`\`css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";
  --color-brand-500: oklch(0.72 0.11 178);
}
\`\`\`
Automatic content detection is enabled by default in v4, so you no longer need a \`content: [...]\` array. If you still need to load a legacy JavaScript config file during migration, explicitly load it in CSS with \`@config "../../tailwind.config.js";\`.

## Removed deprecated utilities and renamed scale values (Breaking Change)
Tailwind CSS v4 removes utilities that were deprecated in v3 and adjusts several default scales:
- **Removed opacity utilities**: \`bg-opacity-*\`, \`text-opacity-*\`, \`border-opacity-*\`, \`ring-opacity-*\` are removed. Use slash opacity modifiers like \`bg-black/50\` or \`text-white/80\` instead.
- **Removed flex aliases**: \`flex-shrink-*\` is replaced by \`shrink-*\`, and \`flex-grow-*\` is replaced by \`grow-*\`.
- **Renamed shadow, radius, and blur scales**: \`shadow-sm\` is now \`shadow-xs\`, \`shadow\` is now \`shadow-sm\`, \`rounded-sm\` is now \`rounded-xs\`, \`rounded\` is now \`rounded-sm\`, and \`blur-sm\` is now \`blur-xs\`.
- **Default ring width and border color**: The \`ring\` utility now defaults to \`1px\` (was \`3px\` in v3; use \`ring-3\` for 3px). The default \`border\` color is now \`currentColor\` instead of \`gray-200\`.
`,
  },

  // ============================================================================
  // 2. Tailwind CSS v3.4.17 Setup & Configuration Reference
  // ============================================================================
  {
    library: "tailwindcss",
    version: "3.4.17",
    major_version: 3,
    doc_type: "setup_guide",
    git_tag: "v3.4.17",
    base_source_url:
      "https://github.com/tailwindlabs/tailwindcss.com/blob/v3.4.17/src/pages/docs/installation/using-postcss.mdx",
    collected_at: "2026-10-15",
    markdown: `# Installing Tailwind CSS v3 with PostCSS

## Tailwind v3 Configuration and @tailwind Directives
In Tailwind CSS v3 (` +
      "`3.4.x`" +
      `), configuration uses \`tailwind.config.js\` with an explicit \`content\` array, and CSS files use the \`@tailwind\` directives:
\`\`\`js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
\`\`\`
\`\`\`css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`
In v3, opacity utilities such as \`bg-black/50\` are recommended, though legacy \`bg-opacity-50\` classes are still present until v4.
`,
  },

  // ============================================================================
  // 3. ESLint v9.14.0 Migration Guide (v8 -> v9 Flat Config)
  // ============================================================================
  {
    library: "eslint",
    version: "9.14.0",
    major_version: 9,
    doc_type: "migration_guide",
    git_tag: "v9.14.0",
    base_source_url:
      "https://github.com/eslint/eslint/blob/v9.14.0/docs/src/use/migrate-to-9.0.0.md",
    collected_at: "2026-10-15",
    codemod_command: "npx @eslint/migrate-config .eslintrc.json",
    markdown: `# Migrate to ESLint v9.0.0

## Node.js < 18.18.0 and 19 are no longer supported (Breaking Change)
ESLint v9 drops support for Node.js versions prior to \`18.18.0\` and Node.js \`19.x\`. You must run Node.js \`^18.18.0\`, \`^20.9.0\`, or \`>=21.1.0\`.

## Flat Config (eslint.config.js / eslint.config.mjs) is now the default (Breaking Change)
In ESLint v9, **Flat Config** (\`eslint.config.js\`, \`eslint.config.mjs\`, or \`eslint.config.cjs\`) is the default configuration system. Legacy \`.eslintrc.*\` files (\`.eslintrc.json\`, \`.eslintrc.js\`, \`.eslintrc.yml\`) and \`package.json#eslintConfig\` are no longer loaded automatically.
To migrate an existing \`.eslintrc\` file automatically, run the official configuration migrator:
\`\`\`bash
npx @eslint/migrate-config .eslintrc.json
\`\`\`
Example \`eslint.config.mjs\` in ESLint v9:
\`\`\`js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "build/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  }
);
\`\`\`

## .eslintignore is no longer supported (Breaking Change)
In ESLint v9 with Flat Config, the \`.eslintignore\` file and \`--ignore-path\` CLI flag are removed. Configure ignored file patterns directly inside \`eslint.config.mjs\` using a top-level config object with only an \`ignores\` key:
\`\`\`js
// eslint.config.mjs
export default [
  {
    ignores: ["dist/**", "coverage/**", ".next/**"],
  },
];
\`\`\`

## Legacy plugins compatibility and FlatCompat
If an ESLint plugin does not yet export a native Flat Config object or uses removed \`context\` methods (such as \`context.getScope()\`, replaced by \`sourceCode.getScope(node)\`), use \`@eslint/eslintrc\` \`FlatCompat\` or \`@eslint/compat\` (\`fixupPluginRules\`) during transition.
`,
  },

  // ============================================================================
  // 4. ESLint v8.57.1 Configuration Guide
  // ============================================================================
  {
    library: "eslint",
    version: "8.57.1",
    major_version: 8,
    doc_type: "setup_guide",
    git_tag: "v8.57.1",
    base_source_url:
      "https://github.com/eslint/eslint/blob/v8.57.1/docs/src/use/configure/configuration-files.md",
    collected_at: "2026-10-15",
    markdown: `# Configuring ESLint v8 (.eslintrc)

## Using .eslintrc.json and .eslintignore in ESLint v8
In ESLint v8 (\`8.57.1\`), the default configuration format is \`.eslintrc.{js,cjs,json,yml}\` and ignored files are listed in \`.eslintignore\`.
Note: Formatting rules in ESLint v8.53.0+ were deprecated in favor of \`@stylistic/eslint-plugin\`, and ESLint v8 itself reached End-of-Life in October 2024.
`,
  },

  // ============================================================================
  // 5. Next.js v15.0.3 Upgrade Guide (v14 -> v15)
  // ============================================================================
  {
    library: "nextjs",
    version: "15.0.3",
    major_version: 15,
    doc_type: "migration_guide",
    git_tag: "v15.0.3",
    base_source_url:
      "https://github.com/vercel/next.js/blob/v15.0.3/docs/01-app/01-building-your-application/08-upgrading/02-version-15.mdx",
    collected_at: "2026-10-15",
    codemod_command: "npx @next/codemod@canary upgrade latest",
    markdown: `# Upgrading from Next.js 14 to Version 15

## Automated Upgrade with @next/codemod
To upgrade a Next.js 14 project to Next.js 15, run the official codemod CLI which updates dependencies and runs code transformations for breaking changes:
\`\`\`bash
npx @next/codemod@canary upgrade latest
\`\`\`

## React 19 and Node.js >= 18.18.0 Requirements (Breaking Change)
- **Node.js**: Next.js 15 requires Node.js \`^18.18.0 || ^19.8.0 || >= 20.0.0\`.
- **React 19**: Next.js 15 App Router uses React 19 (` +
      "`react@19` and `react-dom@19`" +
      `). Pages Router maintains backward compatibility with React 18, but mixing React 18 with third-party packages expecting React 19 or vice-versa can cause \`peerDependencies\` conflicts.

## Async Request APIs: cookies, headers, draftMode, params, searchParams (Breaking Change)
In Next.js 15, dynamic request-specific APIs that previously returned synchronous values now return **Promises** and must be awaited:
- \`cookies()\` from \`next/headers\`
- \`headers()\` from \`next/headers\`
- \`draftMode()\` from \`next/headers\`
- \`params\` and \`searchParams\` props in \`layout.tsx\`, \`page.tsx\`, \`route.ts\`, and \`generateMetadata\`

\`\`\`tsx
// Before (Next.js 14 - synchronous)
import { cookies, headers } from "next/headers";

export default function Page({ params }: { params: { slug: string } }) {
  const cookieStore = cookies();
  const headersList = headers();
  return <div>{params.slug}</div>;
}

// After (Next.js 15 - asynchronous)
import { cookies, headers } from "next/headers";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const { slug } = await params;
  return <div>{slug}</div>;
}
\`\`\`
You can automatically migrate synchronous calls with: \`npx @next/codemod@canary next-async-request-api .\`.

## Caching Semantics Changed: fetch, GET Route Handlers, and Client Router Cache are uncached by default (Breaking Change)
In Next.js 15, caching defaults changed from cached-by-default (in v14) to **uncached-by-default**:
1. **\`fetch()\` Requests**: Now use \`cache: 'no-store'\` by default instead of \`force-cache\`. Pass \`{ cache: 'force-cache' }\` explicitly or set \`export const fetchCache = 'default-cache'\` to cache.
2. **\`GET\` Route Handlers (\`app/api/.../route.ts\`)**: No longer cached by default. Add \`export const dynamic = 'force-static'\` to cache a GET Route Handler.
3. **Client Router Cache**: Page segments have a default \`staleTime\` of \`0\`, so navigating back/forward re-fetches fresh page data from the server.

## Runtime & Config Changes in Next.js 15 (next.config.ts, NextRequest geo/ip)
- **\`next.config.ts\`**: Next.js 15 supports writing configuration in TypeScript natively using \`import type { NextConfig } from 'next'\`.
- **Removed \`req.geo\` and \`req.ip\` on \`NextRequest\`**: In Next.js 15, \`NextRequest.geo\` and \`NextRequest.ip\` have been removed. Use \`ipAddress\` and \`geolocation\` helpers from \`@vercel/functions\` instead.
- **\`bundlePagesRouterDependencies\`**: \`experimental.bundlePagesExternals\` is now stable as \`bundlePagesRouterDependencies: true\`, and \`experimental.serverComponentsExternalPackages\` is now stable as \`serverExternalPackages\`.
`,
  },

  // ============================================================================
  // 6. Next.js v14.2.15 Upgrade Guide (v13 -> v14 & v14 Reference)
  // ============================================================================
  {
    library: "nextjs",
    version: "14.2.15",
    major_version: 14,
    doc_type: "migration_guide",
    git_tag: "v14.2.15",
    base_source_url:
      "https://github.com/vercel/next.js/blob/v14.2.15/docs/01-app/01-building-your-application/08-upgrading/04-version-14.mdx",
    collected_at: "2026-10-15",
    codemod_command: "npx @next/codemod@latest",
    markdown: `# Upgrading from Next.js 13 to Version 14

## Node.js 18.17 Minimum Version and Synchronous Request APIs in Next.js 14
- **Node.js 16 dropped (Breaking Change)**: Next.js 14 requires Node.js \`>=18.17.0\`.
- **Synchronous \`cookies()\` and \`headers()\` in Next.js 14**: In Next.js 14 (` +
      "`14.2.x`" +
      `), \`cookies()\`, \`headers()\`, and \`params\` are synchronous (e.g., \`const cookieStore = cookies();\`) and \`fetch()\` defaults to \`cache: 'force-cache'\`.

## Removed next export CLI and @next/font (Breaking Change)
- **\`next export\` CLI command removed**: Replace \`next export\` scripts with \`output: 'export'\` inside \`next.config.mjs\`.
- **\`@next/font\` package removed**: Replace imports from \`@next/font\` with built-in \`next/font\`.
- **\`ImageResponse\` import path changed**: Import \`ImageResponse\` from \`next/og\` instead of \`next/server\`.
`,
  },

  // ============================================================================
  // 7. React v19.0.0 Upgrade Guide (v18 -> v19)
  // ============================================================================
  {
    library: "react",
    version: "19.0.0",
    major_version: 19,
    doc_type: "migration_guide",
    git_tag: "v19.0.0",
    base_source_url: "https://github.com/facebook/react/blob/v19.0.0/CHANGELOG.md",
    collected_at: "2026-10-15",
    codemod_command: "npx codemod@latest react/19/migration-recipe",
    markdown: `# Upgrading from React 18 to React 19

## ref as a prop and forwardRef deprecation
In React 19, function components accept \`ref\` directly as a regular prop without wrapping the component in \`React.forwardRef\`:
\`\`\`tsx
// React 19: ref is a regular prop
function MyInput({ placeholder, ref }: { placeholder: string; ref?: React.Ref<HTMLInputElement> }) {
  return <input placeholder={placeholder} ref={ref} />;
}
\`\`\`

## Removed ReactDOM.render, ReactDOM.hydrate, and unmountComponentAtNode (Breaking Change)
- \`ReactDOM.render\` has been removed. Use \`createRoot\` from \`react-dom/client\`.
- \`ReactDOM.hydrate\` has been removed. Use \`hydrateRoot\` from \`react-dom/client\`.
- \`ReactDOM.unmountComponentAtNode\` has been removed. Use \`root.unmount()\`.
- \`ReactDOM.findDOMNode\` has been removed.

## useActionState replaces useFormState and TypeScript RefCallback changes (Breaking Change)
- \`ReactDOM.useFormState\` has been renamed to \`React.useActionState\` (imported from \`"react"\`, not \`"react-dom"\`).
- \`propTypes\` and \`defaultProps\` on function components have been removed in React 19 (use ES6 default parameters and TypeScript types).
- In TypeScript with \`@types/react@19\`, \`useRef()\` requires an explicit argument (e.g. \`useRef<HTMLDivElement>(null)\`), and ref callbacks must not implicitly return a value unless it is a cleanup function.
`,
  },

  // ============================================================================
  // 8. Vite v5 & v6 Migration Guides
  // ============================================================================
  {
    library: "vite",
    version: "5.4.11",
    major_version: 5,
    doc_type: "migration_guide",
    git_tag: "v5.4.11",
    base_source_url:
      "https://github.com/vitejs/vite/blob/v5.4.11/docs/guide/migration.md",
    collected_at: "2026-10-15",
    markdown: `# Migration from Vite 4 to Vite 5

## Node.js 18+ Required and CJS Node API Deprecated (Breaking Change)
- **Node.js Support**: Vite 5 drops support for Node.js 14, 16, 17, and 19. Node.js \`18+\` or \`20+\` is required.
- **Rollup 4**: Vite 5 is now powered by Rollup 4, which includes native bindings instead of \`@rollup/plugin-commonjs\` defaults.
- **CJS Node API Deprecated**: Importing Vite via \`require('vite')\` or using CommonJS config without ESM emits a deprecation warning. Add \`"type": "module"\` to \`package.json\` or rename config to \`vite.config.mts\` / \`vite.config.mjs\`.
`,
  },
  {
    library: "vite",
    version: "6.0.0",
    major_version: 6,
    doc_type: "migration_guide",
    git_tag: "v6.0.0",
    base_source_url:
      "https://github.com/vitejs/vite/blob/v6.0.0/docs/guide/migration.md",
    collected_at: "2026-10-15",
    markdown: `# Migration from Vite 5 to Vite 6

## Default Value of resolve.conditions and Modern Sass API (Breaking Change)
- **Node.js Support**: Vite 6 requires Node.js \`^18.0.0 || ^20.0.0 || >=22.0.0\`.
- **\`resolve.conditions\`**: Vite 6 no longer overrides \`resolve.conditions\` completely when a custom array is passed; use \`defaultClientConditions\` / \`defaultServerConditions\` from \`vite\`.
- **Sass modern API by default**: Vite 6 uses the \`modern-compiler\` API for Sass/SCSS by default instead of the legacy Sass JS API.
- **Environment API**: Vite 6 introduces the new Environment API for SSR/edge framework authors.
`,
  },

  // ============================================================================
  // 9. TypeScript v5.7.2 Deprecations & Module Resolution
  // ============================================================================
  {
    library: "typescript",
    version: "5.7.2",
    major_version: 5,
    doc_type: "deprecation",
    git_tag: "v5.7.2",
    base_source_url:
      "https://github.com/microsoft/TypeScript/blob/v5.7.2/README.md",
    collected_at: "2026-10-15",
    markdown: `# TypeScript 5.x Configuration & Deprecated Compiler Options

## verbatimModuleSyntax and moduleResolution: bundler (Breaking / Deprecation)
In TypeScript 5.0+, the following \`tsconfig.json\` options are deprecated and will stop working in TypeScript 5.5+ unless \`ignoreDeprecations: "5.0"\` is set:
- \`importsNotUsedAsValues\` and \`preserveValueImports\` are deprecated. Replace both with \`"verbatimModuleSyntax": true\`.
- \`"target": "ES3"\`, \`"out"\`, \`"noImplicitUseStrict"\`, \`"keyofStringsOnly"\`, and \`"suppressImplicitAnyIndexErrors"\` are deprecated.
- For Vite, Next.js, or bundler-based projects, use \`"moduleResolution": "bundler"\` with \`"module": "ESNext"\`.
- For Node.js native ESM projects, use \`"moduleResolution": "NodeNext"\` with \`"module": "NodeNext"\`.
`,
  },

  // ============================================================================
  // 10. Node.js v20 & v22 Runtime Deprecations & Built-in Features
  // ============================================================================
  {
    library: "node",
    version: "22.11.0",
    major_version: 22,
    doc_type: "deprecation",
    git_tag: "v22.11.0",
    base_source_url:
      "https://github.com/nodejs/node/blob/v22.11.0/doc/api/deprecations.md",
    collected_at: "2026-10-15",
    markdown: `# Node.js v20 and v22 LTS Runtime Changes and Deprecations

## Native Built-ins: fetch, --env-file, require(esm), and node:sqlite
- **Native \`fetch\` and \`WebSocket\`**: Global \`fetch\` is stable in Node 20/22+, and global \`WebSocket\` client is enabled by default in Node 22.
- **Native \`.env\` file loading**: Use \`node --env-file=.env app.js\` or \`process.loadEnvFile()\` without external \`dotenv\` packages.
- **\`require(esm)\` support**: Node 22.12+ supports synchronous \`require()\` of ES modules that do not use top-level \`await\`.

## Deprecated Node.js APIs (DEP0040 punycode, DEP0169 url.parse, fs.rmdir recursive)
- **DEP0040 (\`punycode\`)**: The built-in \`punycode\` module is runtime-deprecated in Node 21/22+. Import the userland \`punycode/\` npm package instead.
- **DEP0169 (\`url.parse\`)**: \`url.parse()\` is deprecated due to non-standard host parsing behavior. Use the WHATWG \`new URL(input)\` API instead.
- **DEP0147 (\`fs.rmdir(path, { recursive: true })\`)**: Deprecated and throws in strict modes. Use \`fs.rm(path, { recursive: true, force: true })\` instead.
`,
  },

  // ============================================================================
  // 11. Python 3.12 & 3.13 Runtime Changes, PEP 695, and Removed Standard Modules
  // ============================================================================
  {
    library: "python",
    version: "3.13.0",
    major_version: 3,
    doc_type: "deprecation",
    git_tag: "v3.13.0",
    base_source_url:
      "https://github.com/python/cpython/blob/v3.13.0/Doc/whatsnew/3.13.rst",
    collected_at: "2026-10-25",
    markdown: `# Python 3.12 & 3.13 Release Notes and Breaking Changes

## PEP 594: Removal of Dead Batteries in Python 3.13 (Breaking Change)
In Python 3.13, 19 obsolete standard library modules have been permanently removed:
- Removed: \`cgi\`, \`cgitb\`, \`telnetlib\`, \`pipes\`, \`chunk\`, \`imghdr\`, \`sndhdr\`, \`crypt\`, \`aifc\`, \`audioop\`, \`mailcap\`, \`nis\`, \`nntplib\`, \`spwd\`, \`sunau\`, \`uu\`, \`xdrlib\`.
- Also removed: \`lib2to3\`, \`asyncore\`, \`asynchat\`.
- Replacement recommendations:
  - For \`cgi.parse_header\`: use \`email.message.EmailMessage\` or external libraries like \`multipart\` / \`starlette\`.
  - For \`telnetlib\`: use \`telnetlib3\` or \`asyncssh\`.
  - For \`crypt\`: use \`bcrypt\` or \`passlib\`.

## Experimental Free-Threaded CPython (PEP 703) and JIT Compiler in 3.13
- **Free-Threaded CPython**: Experimental build option (\`--disable-gil\`) allowing threads to execute Python bytecode concurrently without the Global Interpreter Lock (GIL).
- **Copy-on-write JIT Compiler**: Preliminary JIT compiler enabled via \`--enable-experimental-jit\`.

## PEP 695: Type Parameter Syntax in Python 3.12+
Python 3.12 introduced clean syntax for generic classes and functions:
\`\`\`python
# Python 3.12+ type parameter syntax:
type Point[T] = tuple[T, T]

def max_key[K, V](mapping: dict[K, V]) -> K:
    return max(mapping.keys())
\`\`\`
`,
  },

  // ============================================================================
  // 12. Pydantic v1 to v2 Migration Guide
  // ============================================================================
  {
    library: "pydantic",
    version: "2.10.6",
    major_version: 2,
    doc_type: "migration_guide",
    git_tag: "v2.10.6",
    base_source_url:
      "https://github.com/pydantic/pydantic/blob/v2.10.6/docs/migration.md",
    collected_at: "2026-10-25",
    markdown: `# Pydantic v1 to v2 Migration Guide

## Method Renames: model_dump, model_dump_json, and model_validate (Breaking Change)
Pydantic v2 moved validation logic to Rust (pydantic-core) with cleaner method naming:
- **\`.dict()\` -> \`.model_dump()\`**: \`user.dict()\` is deprecated. Replace with \`user.model_dump()\`.
- **\`.json()\` -> \`.model_dump_json()\`**: \`user.json()\` is deprecated. Replace with \`user.model_dump_json()\`.
- **\`parse_obj()\` -> \`model_validate()\`**: \`User.parse_obj(data)\` is deprecated. Replace with \`User.model_validate(data)\`.
- **\`parse_raw()\` -> \`model_validate_json()\`**: \`User.parse_raw(json_str)\` is deprecated. Replace with \`User.model_validate_json(json_str)\`.
- **\`from_orm()\` -> \`model_validate(obj, from_attributes=True)\`**: \`User.from_orm(db_obj)\` is deprecated.

## Validator Changes: @field_validator and @model_validator (Breaking Change)
- **\`@validator\` -> \`@field_validator\`**:
\`\`\`python
# Pydantic v2 modern validator:
from pydantic import BaseModel, field_validator

class User(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip().title()
\`\`\`
- **\`@root_validator\` -> \`@model_validator\`**: Use \`@model_validator(mode="before")\` or \`@model_validator(mode="after")\`.

## BaseSettings Separated into pydantic-settings
\`BaseSettings\` is no longer included in the core \`pydantic\` package.
Install \`pydantic-settings\` and import from it:
\`\`\`python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    database_url: str
\`\`\`
`,
  },

  // ============================================================================
  // 13. FastAPI Lifespan Events Migration Guide
  // ============================================================================
  {
    library: "fastapi",
    version: "0.115.6",
    major_version: 0,
    doc_type: "migration_guide",
    git_tag: "0.115.6",
    base_source_url:
      "https://github.com/fastapi/fastapi/blob/0.115.6/docs/en/docs/advanced/events.md",
    collected_at: "2026-10-25",
    markdown: `# FastAPI Lifespan Events Migration Guide

## Deprecation of @app.on_event("startup") and @app.on_event("shutdown") (Deprecation)
FastAPI and Starlette have officially deprecated \`@app.on_event("startup")\` and \`@app.on_event("shutdown")\`.
Use the modern \`lifespan\` async context manager instead:

\`\`\`python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code executed before the application starts taking requests:
    print("Application starting up: initializing DB pool...")
    yield
    # Code executed after the application finishes handling requests:
    print("Application shutting down: closing DB connections...")

app = FastAPI(lifespan=lifespan)
\`\`\`

## Lifespan State Sharing
Values yielded or stored on \`app.state\` during lifespan are available across route requests.
`,
  },

  // ============================================================================
  // 14. SQLAlchemy 1.4 to 2.0 Migration Guide
  // ============================================================================
  {
    library: "sqlalchemy",
    version: "2.0.36",
    major_version: 2,
    doc_type: "migration_guide",
    git_tag: "rel_2_0_36",
    base_source_url:
      "https://github.com/sqlalchemy/sqlalchemy/blob/rel_2_0_36/doc/build/changelog/migration_20.rst",
    collected_at: "2026-10-25",
    markdown: `# SQLAlchemy 1.4 to 2.0 Migration Guide

## Legacy Query API Removed: session.query(Model) -> session.scalars(select(Model)) (Breaking Change)
SQLAlchemy 2.0 removes the legacy \`Query\` object interface in favor of unified 2.0-style \`select()\`:
\`\`\`python
# 1.x legacy (removed in 2.0):
# users = session.query(User).filter_by(name="alice").all()

# 2.0 unified execution:
from sqlalchemy import select
stmt = select(User).where(User.name == "alice")
users = session.scalars(stmt).all()
\`\`\`

## DeclarativeBase and Mapped[] Annotations
SQLAlchemy 2.0 introduces fully type-annotated Declarative mappings:
\`\`\`python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    bio: Mapped[str | None] = mapped_column(String(200), default=None)
\`\`\`
`,
  },

  // ============================================================================
  // 15. LangChain 0.2 to 0.3 Migration Guide
  // ============================================================================
  {
    library: "langchain",
    version: "0.3.7",
    major_version: 0,
    doc_type: "migration_guide",
    git_tag: "v0.3.7",
    base_source_url:
      "https://github.com/langchain-ai/langchain/blob/v0.3.7/docs/docs/how_to/migrate_chains.mdx",
    collected_at: "2026-10-25",
    markdown: `# LangChain 0.2 & 0.3 Migration Guide

## Legacy Chains Deprecation: LLMChain -> LCEL Pipeline (Breaking Change)
LangChain 0.2 and 0.3 officially deprecated legacy classes such as \`LLMChain\`, \`ConversationChain\`, and \`initialize_agent\`.
Replace them with LangChain Expression Language (LCEL) using the \`|\` pipe operator:
\`\`\`python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Modern LCEL composition:
prompt = ChatPromptTemplate.from_template("Translate to Korean: {text}")
chain = prompt | model | StrOutputParser()

# Invoke:
result = await chain.ainvoke({"text": "Hello world"})
\`\`\`

## Package Decoupling: langchain-core and Provider Packages
Core interfaces (\`BaseChatModel\`, \`PromptTemplate\`, \`Runnable\`) reside in \`langchain-core\`.
Model providers are installed independently:
- \`langchain-openai\`
- \`langchain-anthropic\`
- \`langchain-community\`
`,
  },

  // ============================================================================
  // 16. uv Package Management & Modern Python Tooling
  // ============================================================================
  {
    library: "uv",
    version: "0.5.2",
    major_version: 0,
    doc_type: "setup_guide",
    git_tag: "0.5.2",
    base_source_url:
      "https://github.com/astral-sh/uv/blob/0.5.2/docs/getting-started/installation.md",
    collected_at: "2026-10-25",
    markdown: `# uv Modern Python Package Management & Tooling

## Core Commands and Workflow
uv is an extremely fast Python package manager and resolver written in Rust.
- **Project Initialization**: \`uv init [project-name]\` (creates modern PEP 621 \`pyproject.toml\`).
- **Add Dependencies**: \`uv add fastapi uvicorn\` (updates \`pyproject.toml\` and generates deterministic \`uv.lock\`).
- **Add Dev Dependencies**: \`uv add --dev pytest ruff\`.
- **Environment Synchronization**: \`uv sync\` (creates and updates \`.venv\` matching \`uv.lock\`).
- **Run Commands in Virtualenv**: \`uv run pytest\` or \`uv run python main.py\`.
- **Python Version Pinning**: \`uv python pin 3.12\` (writes to \`.python-version\`).
`,
  },
];
