/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    // should be removed when all @ts-ignores are fixed
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/semi": ["error", "never"],
  }
};