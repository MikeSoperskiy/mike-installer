# Mike Installer

Быстрый и удобный установщик "всё в одном месте" на Electron.

## Описание

Mike Installer - это удобное приложение на Electron, которое позволяет по одному клику устанавливать необходимые программы для разработки.

## Список программ

### Браузеры
- Google Chrome
- Vivaldi

### Разработка
- WebStorm
- PyCharm
- Visual Studio
- Visual Studio Code (optional)
- Git
- GitHub Desktop

### Языки программирования
- Rust
- Python
- Node.js
- Go
- C++ (MSVC Build Tools)
- GCC (via MSYS2)

### Инструменты
- MSYS2
- C++ Build Tools

### Приложения
- Steam
- Discord
- Яндекс Музыка
- Hiddify

## ФунCaционал

- ✅ Установка программ по клику
- ✅ Выбор программ для установки
- ✅ Возможность добавления новых программ через интерфейс
- ✅ Удобный интерфейс Electron
- ✅ Проверка установленных программ

## Технологии

- Electron
- Node.js
- HTML/CSS/JavaScript
- Package managers (winget, chocolatey, или прямые ссылки)

## Установка

```bash
# Клонирование репозитория
git clone https://github.com/MikeSoperskiy/mike-installer.git
cd mike-installer

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start
```

## Сборка

```bash
# Сборка для Windows
npm run build:win

# Сборка для macOS
npm run build:mac

# Сборка для Linux
npm run build:linux
```

## Лицензия

MIT

## Автор

Mike Soperskiy
