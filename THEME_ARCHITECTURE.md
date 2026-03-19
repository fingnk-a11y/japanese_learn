# Theme Architecture - Modular Premium Theme System

## Overview

The Nihongo Master theme system is designed to be **fully modular and extensible**, with complete support for premium themes, character assets, and animations. All colors and styles are centralized in configuration files to ensure consistency and prevent hardcoding.

---

## Core Architecture

### 1. **CSS Variables (Foundation Layer)**
**File:** `style.css`

CSS variables define all theming capabilities at the `:root` level. This is the **single source of truth** for styling.

```css
:root {
    /* PRIMARY COLORS */
    --primary-red: #e63946;
    --dark-navy: #1a1a2e;
    --foundation-blue: #0984e3;
    --challenge-gold: #f1c40f;
    
    /* TEXT COLORS */
    --text-dark: #2d3436;
    --text-light: #ffffff;
    --text-muted: #8B949E;
    
    /* BACKGROUND COLORS */
    --bg-main: #fcfdfd;
    --bg-card: #ffffff;
    --bg-light: #f8f9fa;
    
    /* HERO EFFECTS */
    --hero-gradient: linear-gradient(135deg, #e63946 0%, #b91d2a 100%);
    --hero-shadow: 0 10px 30px rgba(230, 57, 70, 0.3);
    
    /* QUIZ STYLING */
    --quiz-answer-bg: #BB86FC;
    --quiz-answer-hover: #03DAC6;
    --quiz-answer-text: #0D1117;
}
```

**Key Principles:**
- ✅ All colors use CSS variables
- ✅ No hardcoded hex colors except in fallbacks
- ✅ Variables have semantic naming (e.g., `--text-light` not `--color-white`)
- ✅ CSS Preprocessor compatible (SCSS, Less)

---

### 2. **Theme Configuration (Behavior Layer)**
**File:** `styles.json`

Theme definitions are stored in JSON with a standardized structure for maximum flexibility.

```json
{
  "styles": [
    {
      "id": "default",
      "name": "Classic Red",
      "name_tm": "Hemişeli Gyzyl",
      "description": "The original Nihongo Master theme",
      "premium": false,
      
      "colors": {
        "bg_main": "#fcfdfd",
        "bg_card": "#ffffff",
        "accent_primary": "#e63946",
        "accent_secondary": "#0984e3",
        "text_main": "#2d3436",
        "text_muted": "#636e72",
        "border_glow": "rgba(0, 0, 0, 0.08)"
      },
      
      "css": {
        "--hero-gradient": "linear-gradient(135deg, #e63946 0%, #b91d2a 100%)",
        "--hero-shadow": "0 10px 30px rgba(230, 57, 70, 0.3)"
      }
    }
  ]
}
```

**Theme Structure:**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | ✅ | Unique identifier (slug format) |
| `name` | string | ✅ | Display name (English) |
| `name_tm` | string | ⚠️ | Display name (Turkmen) - optional |
| `description` | string | ✅ | Theme description |
| `premium` | boolean | ✅ | Free or premium theme |
| `colors` | object | ✅ | Color palette mapping |
| `css` | object | ⚠️ | Additional CSS variables |
| `assets` | object | ⚠️ | Premium assets (images, icons) |
| `animations` | object | ⚠️ | Animation configuration |

---

### 3. **Dynamic Theme Application (Application Layer)**
**File:** `app.js` → `applyStyle()` function

The `applyStyle()` function dynamically applies theme configurations to the page.

```javascript
function applyStyle(styleId = currentStyle) {
    const style = stylesData.styles.find(s => s.id === styleId);
    const root = document.documentElement;
    const body = document.body;
    
    // Apply color mappings
    if (style.colors) {
        root.style.setProperty('--bg-main', style.colors.bg_main);
        root.style.setProperty('--accent-primary', style.colors.accent_primary);
        // ... map all colors
    }
    
    // Apply custom CSS
    if (style.css) {
        Object.entries(style.css).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });
    }
    
    // Load premium assets
    if (style.premium && style.assets) {
        loadMascot(style.assets.mascot_main);
        loadSectionIcons(style.assets.section_icons);
    }
}
```

---

## Adding a New Premium Theme

### Step 1: Define in styles.json

```json
{
  "id": "neon_midnight",
  "name": "🌙 Neon Midnight (Premium)",
  "name_tm": "🌙 Neon Gece (Premimum)",
  "description": "Dark cyberpunk theme with electric neon accents",
  "premium": true,
  
  "colors": {
    "bg_main": "#0a0e27",
    "bg_card": "#16213e",
    "accent_primary": "#FF006E",
    "accent_secondary": "#00D9FF",
    "text_main": "#E0AAFF",
    "text_muted": "#9D84B7",
    "border_glow": "rgba(0, 217, 255, 0.2)"
  },
  
  "css": {
    "--hero-gradient": "linear-gradient(135deg, #FF006E 0%, #00D9FF 100%)",
    "--hero-shadow": "0 10px 30px rgba(255, 0, 110, 0.4)",
    "--quiz-answer-bg": "#FF006E",
    "--quiz-answer-hover": "#00D9FF",
    "--quiz-answer-text": "#0a0e27"
  },
  
  "assets": {
    "mascot_main": "assets/characters/cyber_mascot.png",
    "mascot_success": "assets/characters/happy_cyber.png",
    "mascot_error": "assets/characters/sad_cyber.png",
    "section_icons": [
      "assets/icons/neon_star.svg",
      "assets/icons/neon_lightning.svg",
      "assets/icons/neon_circuit.svg"
    ]
  },
  
  "animations": {
    "card_entry": "slideUpFade",
    "glow_speed": "3s",
    "pulse_intensity": 1.5
  }
}
```

### Step 2: Add Assets

Create feature-specific folders for premium assets:

```
assets/
├── characters/
│   ├── cyber_mascot.png
│   ├── happy_cyber.png
│   └── sad_cyber.png
├── icons/
│   ├── neon_star.svg
│   ├── neon_lightning.svg
│   └── neon_circuit.svg
└── animestyle/
    ├── cyberpunk_bg.jpg
    └── neon_effects.css
```

### Step 3: Test in Browser

1. Open the app
2. Click "Change Style"
3. Select the new theme
4. Verify all colors, assets, and animations load correctly

---

## Color Mapping Reference

All `colors` object entries are automatically mapped to CSS variables:

| colors.* | CSS Variable | Purpose |
|----------|--------------|---------|
| `bg_main` | `--bg-main` | Main background |
| `bg_card` | `--bg-card` | Card backgrounds |
| `accent_primary` | `--accent-primary` | Primary accent |
| `accent_secondary` | `--accent-secondary` | Secondary accent |
| `text_main` | `--text-dark` | Main text |
| `text_muted` | `--text-muted` | Muted/secondary text |
| `border_glow` | `--border-glow` | Glow effects |

---

## Premium Theme Checklist

- [ ] Define unique `id` (lowercase, no spaces)
- [ ] Set `premium: true`
- [ ] Define complete `colors` object (all 7 required fields)
- [ ] Define `css` with at least `--hero-gradient`
- [ ] Add mascot asset to `assets.mascot_main`
- [ ] Create section icons (3 recommended)
- [ ] Test theme loading and color application
- [ ] Test mascot display
- [ ] Test animations/transitions
- [ ] Verify on mobile/tablet
- [ ] Document special instructions if needed

---

## Best Practices

### ✅ DO:
- Use semantic color names in styles.json
- Keep color definitions in `colors` object
- Use CSS variables for all styling
- Test themes across all pages
- Document custom animations
- Create consistent icon styles

### ❌ DON'T:
- Hardcode colors in CSS files
- Mix `colors` and direct CSS values
- Use inline styles in HTML
- Create page-specific theme files
- Override CSS variables in feature CSS files
- Use deprecated color properties

---

## Extensibility Features

### Custom CSS Overrides
```json
"css": {
  "--hero-gradient": "custom-gradient",
  "--custom-property": "value"
}
```

### Animation Control
```json
"animations": {
  "card_entry": "slideUpFade",
  "glow_speed": "2s",
  "pulse_intensity": 1.2
}
```

### Internationalization
```json
"name": "English Name",
"name_tm": "Turkmen Name"
```

### Asset Loading
```json
"assets": {
  "mascot_main": "path/to/mascot.png",
  "section_icons": ["icon1.svg", "icon2.svg"]
}
```

---

## Debugging Themes

### Check Console for Errors
```javascript
// Verify theme loaded
console.log(stylesData.styles);

// Check current style
console.log(currentStyle);

// Verify CSS variable application
console.log(getComputedStyle(document.documentElement).getPropertyValue('--accent-primary'));
```

### Browser DevTools
1. Inspect `:root` element
2. Check "Styles" panel for all CSS variables
3. Verify all variables have values
4. Check for `data-theme="anime-premium"` attribute on body

---

## Performance Considerations

- 🚀 Themes load via JSON (small file size)
- 🚀 CSS variables are instant (no page re-render)
- ⚠️ Asset images should be optimized (<100KB each)
- ⚠️ Maximum 10-15 section icons recommended

---

## Future Plans

- [ ] Theme preview system
- [ ] CSS-in-JS theme builder UI
- [ ] User-created custom themes
- [ ] Theme versioning
- [ ] Dark mode automatic detection
- [ ] Accessibility contrast checker

---

**Last Updated:** March 10, 2026  
**Version:** 1.0 (Modular Architecture)
