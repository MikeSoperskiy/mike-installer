# Mike Installer API

## Electron IPC API

### Main Process -> Renderer

#### `install-progress`
Отправляет обновления о процессе установки.

```javascript
{
  programId: string,
  status: 'installing' | 'completed' | 'error',
  message: string
}
```

### Renderer -> Main Process

#### `check-installed(programId: string)`
Проверяет, установлена ли программа.

**Параметры:**
- `programId` - Winget ID программы

**Возвращает:** `Promise<boolean>`

#### `install-program(program: Program)`
Устанавливает программу.

**Параметры:**
```typescript
interface Program {
  id: string;
  name: string;
  wingetId: string;
  description?: string;
  installCommand?: string;
}
```

**Возвращает:**
```typescript
Promise<{
  success: boolean;
  output?: string;
  error?: string;
}>
```

#### `install-multiple(programs: Program[])`
Устанавливает несколько программ.

**Параметры:**
- `programs` - Массив программ

**Возвращает:** `Promise<Array<{program: string, result: any}>>`

#### `get-system-info()`
Получает информацию о системе.

**Возвращает:** `Promise<string>`

#### `add-custom-program(programData: CustomProgramData)`
Добавляет пользовательскую программу.

**Параметры:**
```typescript
interface CustomProgramData {
  name: string;
  wingetId: string;
  category: string;
  description?: string;
}
```

**Возвращает:** `Promise<{success: boolean}>`

## LocalStorage API

### `customPrograms`
Хранит пользовательские программы в формате JSON.

```javascript
const customPrograms = JSON.parse(localStorage.getItem('customPrograms') || '[]');
```

## Programs Database Structure

```javascript
const PROGRAMS = {
  categoryId: {
    name: string,
    icon: string,
    programs: Program[]
  }
}
```

### Program Object

```typescript
interface Program {
  id: string;              // Уникальный ID
  name: string;            // Название
  wingetId: string;        // Winget ID
  description: string;     // Описание
  installCommand?: string; // Кастомная команда
  custom?: boolean;        // Пользовательская
}
```

## Пример использования

```javascript
// Проверка установки
const isInstalled = await window.electronAPI.checkInstalled('Google.Chrome');

// Установка программы
const result = await window.electronAPI.installProgram({
  id: 'chrome',
  name: 'Google Chrome',
  wingetId: 'Google.Chrome',
  description: 'Браузер'
});

// Подписка на обновления
window.electronAPI.onInstallProgress((data) => {
  console.log(data.message);
});
```
