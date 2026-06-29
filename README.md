# my-app

An Electron application with Vue and TypeScript

## Description

Стек: Создали базу приложения на Electron + Vue 3 (TS) + Tailwind CSS с переключателем темной темы.

Безопасность (IPC): Связали интерфейс Vue и главный процесс Electron через изолированный preload-скрипт.

База данных: Подключили SQLite и настроили CRUD (создание, чтение, обновление, удаление пользователей).

Форма и баги фокуса: Исправили зависание инпутов, заменив нативный confirm() на безопасный dialog.showMessageBox от Electron.

Веб-сокеты: Создали отдельный модуль src/main/socket.ts (на базе ws) — теперь приложение работает как WebSocket-сервер на порту 8080 и передает данные напрямую во Vue.


## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
