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

### 6. Config `tsconfig.json`

### 7. Add `ESLint` + `Prettier` config files

- Modify `eslint.config.mjs` file
- Add `.prettierrc` + `.prettierrc` files
- **MEMO**: For VSCode IDE, `ESLint` and `Prettier - Code formatter` extensions must be installed

### 8. Config editor

- Add `.editorconfig` file
- **MEMO**: For VSCode IDE, `EditorConfig for VS Code` extension must be installed

### 9. Config `nodemon`

- Add `nodemon.json` file

### 10. Modify scripts in `package.json` file

### 11. Add `type.d.ts` + `index.ts` files

- Add 2 files in `/src` folder

### 12. Running application

#### 1. Run app in dev env

```shell
npm run dev
```

#### 2. Build app (from JS to TS)

```shell
npm run build
```

```shell
npm run start
```

#### 3. Check for any `ESLint` / `Prettier` errors

- `ESlint`:

  ```shell
  npm run lint
  ```

  ```shell
  npm run lint:fix
  ```

- `Prettier`:

  ```shell
  npm run prettier
  ```

  ```shell
  npm run prettier:fix
  ```
