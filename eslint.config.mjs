import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/.open-next/**", "**/node_modules/**", "**/next-env.d.ts", ".runtime/**", "packages/database/generated/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
