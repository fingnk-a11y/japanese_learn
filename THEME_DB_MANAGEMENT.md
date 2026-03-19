# Theme Database Management

This project now supports DB-first theme management for easy premium theme expansion.

## 1) Header Image Convention

Use this field in each theme document:

- `assets.hero_header`: image path for top hero/header artwork

Example:

```json
"assets": {
  "hero_header": "assets/infotheme/informaticsbackground.jpg"
}
```

When this key exists, the UI automatically uses it for the hero header background.

## 2) API Endpoints

- `GET /api/styles` - list all themes
- `GET /api/styles/:styleId` - get one theme
- `POST /api/styles` - create theme
- `PUT /api/styles/:styleId` - create/update theme

## 3) CLI Upsert (Recommended)

Use a JSON file and upsert into MongoDB:

```bash
npm run theme:upsert -- ./themes/premium-theme.template.json
```

Or run the template directly:

```bash
npm run theme:upsert:template
```

## 4) New Theme Workflow

1. Copy `themes/premium-theme.template.json`.
2. Change `id`, `name`, colors, and assets.
3. Set `assets.hero_header` to your header image.
4. Run `npm run theme:upsert -- <your-file.json>`.
5. Refresh the app and select the new style.
