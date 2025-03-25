import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import turboConfig from "eslint-config-turbo/flat";
import eslintConfigPrettier from "eslint-config-prettier";

const tsconf = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);

export default [...tsconf, ...turboConfig, eslintConfigPrettier];
