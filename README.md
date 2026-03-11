# ФЭМ БГЭУ — Сайт факультета

Сайт факультета экономики и менеджмента БГЭУ с интеграцией **Decap CMS** (бывший Netlify CMS).

## Структура проекта

```
fem-bseu/
├── index.html              ← Главная страница
├── netlify.toml            ← Конфигурация Netlify
├── admin/
│   ├── index.html          ← Панель управления CMS (/admin/)
│   └── config.yml          ← Схема коллекций CMS
├── css/
│   └── main.css            ← Все стили
├── js/
│   └── cms-loader.js       ← Загрузчик контента из файлов CMS
├── _data/
│   ├── settings.json       ← Настройки сайта (партнёры, статистика, ticker)
│   ├── dean.json           ← Данные декана
│   └── hero.json           ← Контент главного экрана
└── content/
    ├── news/               ← Markdown-файлы новостей
    ├── events/             ← Markdown-файлы событий
    └── programs/           ← Markdown-файлы программ обучения
```

## Деплой на Netlify (шаг за шагом)

### 1. Загрузите проект на GitHub

```bash
git init
git add .
git commit -m "Initial commit: ФЭМ БГЭУ site"
git remote add origin https://github.com/ВАШ_ЛОГИН/fem-bseu.git
git push -u origin main
```

### 2. Подключите к Netlify

1. Войдите на [netlify.com](https://netlify.com)
2. **Add new site → Import an existing project → GitHub**
3. Выберите репозиторий `fem-bseu`
4. Build settings:
   - **Build command:** *(оставьте пустым)*
   - **Publish directory:** `.`
5. Нажмите **Deploy site**

### 3. Включите Netlify Identity + Git Gateway

1. В панели Netlify → **Site settings → Identity → Enable Identity**
2. Прокрутите до **Git Gateway → Enable Git Gateway**
3. Пригласите себя как пользователя: **Identity → Invite users**
4. Проверьте почту и примите приглашение

### 4. Откройте CMS

Перейдите на `https://ВАШ_САЙТ.netlify.app/admin/`

Готово! Теперь вы можете редактировать весь контент прямо из браузера.

---

## Что редактируется через CMS

| Раздел | Что можно менять |
|--------|-----------------|
| **Настройки сайта** | Название, контакты, статистика, бегущая строка, партнёры |
| **Главный экран** | Заголовок, описание, кнопки |
| **Декан** | ФИО, должность, цитата, фото |
| **Новости** | Добавление/удаление/редактирование, категории, дата |
| **События** | Дата, тип, ссылка на регистрацию |
| **Программы** | Уровень, описание, формы обучения |

Все изменения через CMS автоматически сохраняются в Git-репозиторий и сайт пересобирается за ~10 секунд.

---

## Локальная разработка

```bash
# Установите serve
npm install -g serve

# Запустите локальный сервер
serve .

# Откройте http://localhost:3000
```

Для локального редактирования через CMS раскомментируйте в `admin/config.yml`:
```yaml
local_backend: true
```

Затем запустите прокси:
```bash
npx decap-server
```
