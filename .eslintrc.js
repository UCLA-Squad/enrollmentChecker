module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "jest/globals": true,
        "dom": true,
    },
    "extends": "eslint:recommended",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "semi": [2, "always"]
    },
    plugins: ["jest"]
}
