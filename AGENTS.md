# AGENTS.md — Руководство по безопасности кода

## 🎨 TAC CSS методология (HTML-разметка)

### Запрещено в UI-компонентах

- **`<div>`** — запрещён. Используй семантические HTML-элементы или кастомные элементы.
- **`<span>`** — запрещён. Используй кастомные элементы (например, `<okr-status-badge>`, `<kr-title>`).

### Принципы TAC (Tag, Attributes, Classes)

1. **Tag** — семантические HTML-теги для структуры и кастомные элементы вместо `<div>`/`<span>`.
2. **Attributes** — вариации оформления через атрибуты (`data-variant`, `data-status`, `aria-*`).
3. **Classes** — минимальное количество классов; предпочтительно использовать имя тега как CSS-селектор.

### Таблица: семантические элементы (структура)

| Контекст | Элемент |
|---|---|
| Оверлей модального окна | `<section>` |
| Диалоговое окно | `<dialog open>` |
| Тело модального окна | `<section>` |
| Группа полей формы (label + input) | `<p>` |
| Строка смежных полей формы | `<fieldset>` |
| Кнопки действий в форме / модале | `<footer>` |
| Заголовок карточки / строки | `<header>` |
| Тело карточки / секции | `<section>` |
| Группа заголовка + подзаголовка | `<hgroup>` |
| Прогресс-бар (контейнер + подпись) | `<figure>` + `<figcaption>` |
| Строка значений | `<p>` |
| Форма редактирования (inline) | `<fieldset>` |
| Панель инструментов | `<nav>` |
| Фильтры (группа элементов управления) | `<fieldset>` |
| Сетка карточек | `<ul>` (карточки — `<li>`) |
| Пустое состояние | `<section>` |
| Скелетон-карточка | `<li>` |

### Таблица: кастомные элементы (вместо `<div>`/`<span>`)

| Контекст | Кастомный элемент |
|---|---|
| Сводка прогресса | `<okr-summary>` |
| Текст сводки | `<okr-summary-text>` |
| Лейбл сводки | `<okr-summary-label>` |
| Значение сводки | `<okr-summary-value>` |
| Счётчик в сводке | `<okr-summary-count>` |
| Мета-блок карточки (заголовок + квартал) | `<okr-card-meta>` |
| Квартал / период | `<okr-quarter>` |
| Бейдж статуса | `<okr-status-badge>` |
| Счётчик ключевых результатов | `<okr-kr-count>` |
| Скелетон-строка | `<skeleton-line>` |
| Тип ключевого результата (бейдж) | `<kr-type-badge>` |
| Заголовок ключевого результата | `<kr-title>` |
| Дорожка прогресс-бара | `<kr-progress-bar>` |
| Заполнение прогресс-бара | `<kr-progress-fill>` |
| Текущее значение | `<kr-current>` |
| Разделитель значений | `<kr-sep>` |
| Целевое значение | `<kr-target>` |
| Подсказка (hint) | `<hint>` |
| Маркер обязательного поля | `<required-mark aria-hidden="true">` |

---

## 🔒 Типовая безопасность

### Запрещено

- **`any`** — никогда не использовать
- **`// eslint-disable`** — запрещено отключать правила линтера
- **`// ts-ignore`** — запрещено игнорировать ошибки типов

### `unknown`

- **Допускается ТОЛЬКО на boundary (SHELL)** как вход в декодирование
  - Пример: `@effect/schema` для парсинга внешних данных
- **После декодинга `unknown` не должен выходить наружу boundary-модуля**
  - Внутри приложения работают только с типизированными данными

### Касты типов (`as`)

- **Запрещён в обычном коде**
- **Допускается ТОЛЬКО в одном "аксиоматическом" модуле**:
  - Бренды (brands)
  - Конструкторы (constructors)
  - Константы
- После аксиоматического модуля — использование **без кастов**

### Union types

- **Всегда**: исчерпывающий анализ через `.exhaustive()` / `Match.exhaustive()`
- Запрещены неявные падения через union

### Внешние зависимости

- Только через **типизированные интерфейсы**
- Никаких прямых вызовов без обёртки в интерфейс

### Ошибки

- **Типизированы в сигнатурах функций** (например, `Either<E, A>`, `Effect<A, E>`)
- **Не runtime exceptions** — запрещены `throw`/`catch` для бизнес-логики

## 📐 Математические гарантии

### Инварианты:

- `∀ message ∈ Messages: sent(message) → eventually_delivered(message)`
- `∀ operation ∈ Operations: atomic(operation) ∨ fully_rolled_back(operation)`

### Предусловия:

- `user.authenticated = true`
- `message.content.length ∈ [1, 4096]`

### Постусловия:

- `∃ messageId: persisted(message, messageId)`
- `∀ recipient ∈ message.recipients: notified(recipient)`

### Вариантная функция (для рекурсии):

- `processQueue: |queue| → |queue| - 1` (убывает на каждой итерации)

### Сложность:

- Время: `O(n log n)` где `n = |participants|`
- Память: `O(n)` для буферизации сообщений

## 📝 Conventional Commits с областями

Формат: `<type>(<scope>): <description>`

### Типы коммитов:

- `feat` — новая функциональность
- `fix` — исправление ошибок
- `docs` — документация
- `style` — форматирование, отступы (без изменений логики)
- `refactor` — рефакторинг без новых фич
- `perf` — оптимизация производительности
- `test` — тесты
- `chore` — сборка, зависимости, рутина

### Области (scopes):

- `core` — ядро, бизнес-логика, доменные модели
- `shell` — внешний слой, БД, API, интеграции
- `ui` — компоненты интерфейса
- `store` — управление состоянием
- `utils` — утилиты, хелперы
- `config` — конфигурация
- `docs` — документация проекта

### Примеры:

```
feat(core): add message validation with mathematical constraints

- Implements pure validation functions for message content
- Adds invariant: ∀ msg: valid(msg) → sendable(msg)
- BREAKING CHANGE: Message.content now requires non-empty string

fix(shell): resolve database connection pooling issue

perf(core): optimize message sorting algorithm to O(n log n)

docs(architecture): add formal specification for FCIS pattern
```

### BREAKING CHANGE:

- Указывать в теле коммита, если есть несовместимые изменения
- Формат: `BREAKING CHANGE: <описание>`
