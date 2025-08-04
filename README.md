# Node.js boilerplate

## Info:

- Node version: 24.5.0

## Setup steps:

### 1. Create `package.json` file

```shell
npm init -y
```

### 2. Add TypeScript as a dev dependency

```shell
npm i typescript --save-dev
```

### 3. Install TypeScript type definitions for Node.js

```shell
npm install @types/node --save-dev
```

### 4. Setup `ESLint`

```shell
npm init @eslint/config@latest
```

### 5. Setup config packages

```shell
npm install prettier eslint-config-prettier eslint-plugin-prettier tsx tsc-alias rimraf nodemon --save-dev
```
