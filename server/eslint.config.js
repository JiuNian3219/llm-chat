import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_", // 忽略以 _ 开头的变量
          argsIgnorePattern: "^_", // 忽略以 _ 开头的参数
        },
      ],
      "no-console": "off", // 允许使用 console（在后端项目中很常见）
      "no-process-exit": "off", // 允许使用 process.exit
      "no-process-env": "off", // 允许使用 process.env
    },
  },
];