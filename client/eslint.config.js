import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest", // 统一使用最新 ECMA 版本
      globals: {
        ...globals.browser, // 浏览器全局变量
        ...globals.es2020, // ES2020 特性（如 BigInt）
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
      env: {
        browser: true, // 明确浏览器环境
        es2020: true, // 启用 ES2020 全局变量
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]", // 忽略大写变量
          argsIgnorePattern: "^_", // 忽略以 _ 开头的参数
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
