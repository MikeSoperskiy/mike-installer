# Contributing to Mike Installer

Спасибо за интерес к Mike Installer!

## Как добавить новую программу

1. Откройте файл `src/renderer/programs.js`
2. Найдите нужную категорию или создайте новую
3. Добавьте объект программы:

```javascript
{
  id: 'unique-id',
  name: 'Название программы',
  wingetId: 'Publisher.ProgramName',
  description: 'Описание'
}
```

### Как найти Winget ID

```bash
winget search "название программы"
```

## Структура проекта

```
mike-installer/
├── src/
│   ├── main.js           # Основной процесс Electron
│   ├── preload.js        # Мост между main и renderer
│   └── renderer/
│       ├── index.html    # Интерфейс
│       ├── styles.css    # Стили
│       ├── programs.js   # База программ
│       └── app.js        # Логика приложения
├── assets/             # Иконки
├── package.json
└── README.md
```

## Pull Requests

1. Fork репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Сделайте commit (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## Стандарты кода

- Используйте 2 пробела для отступов
- Комментарии на английском
- Пользовательские сообщения на русском
- ES6+ синтаксис
