# CarLedgr Website Translation System

## Overview
The CarLedgr marketing website supports multiple languages through a JSON-based translation system. This system separates translations from the main JavaScript code, making it easy to maintain and add new languages.

## File Structure
```
website/
├── translations.json     # All translations organized by key
├── script.js            # Main JavaScript with translation logic
└── index.html           # HTML with data-translate attributes
```

## How It Works

### 1. Translation Keys
Each translatable text element in the HTML has a `data-translate` attribute:
```html
<h1 data-translate="hero_title">Smart Dealership Management Platform</h1>
<p data-translate="hero_description">Built specifically for dealerships...</p>
```

### 2. Translation JSON Structure
The `translations.json` file organizes translations by key, with each key containing translations for all supported languages:
```json
{
  "hero_title": {
    "en": "Smart Dealership <span class=\"highlight\">Management Platform</span>",
    "es": "Plataforma Inteligente de <span class=\"highlight\">Gestión de Concesionarios</span>"
  },
  "hero_description": {
    "en": "Built specifically for dealerships specializing in vehicle repair...",
    "es": "Diseñado específicamente para concesionarios especializados..."
  }
}
```

### 3. JavaScript Loading
The system automatically:
- Loads translations from `translations.json` on page load
- Applies the user's saved language preference
- Updates all elements with `data-translate` attributes
- Saves language preferences in localStorage

## Adding New Translations

### To Update Existing Text:
1. Find the translation key in `translations.json`
2. Update the text for the desired language
3. Refresh the page to see changes

Example - updating the hero title in Spanish:
```json
{
  "hero_title": {
    "en": "Smart Dealership <span class=\"highlight\">Management Platform</span>",
    "es": "Nueva Plataforma de <span class=\"highlight\">Gestión de Concesionarios</span>"
  }
}
```

### To Add New Translatable Content:
1. Add `data-translate="your_key"` to the HTML element
2. Add the translation key to `translations.json` with text for all languages

Example - adding a new button:
```html
<!-- HTML -->
<button data-translate="new_button">Click Here</button>
```

```json
// translations.json
{
  "new_button": {
    "en": "Click Here",
    "es": "Haz Clic Aquí"
  }
}
```

### To Add a New Language:
1. Add the language code to each translation key in `translations.json`
2. Add the language option to the HTML select element

Example - adding French support:
```json
{
  "hero_title": {
    "en": "Smart Dealership Management Platform",
    "es": "Plataforma de Gestión de Concesionarios",
    "fr": "Plateforme de Gestion de Concessionnaire"
  }
}
```

```html
<select id="language-select">
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="fr">Français</option>
</select>
```

## Current Languages
- **English (en)**: Complete
- **Spanish (es)**: Complete

## Translation Key Categories
- `nav_*`: Navigation menu items
- `hero_*`: Hero section content
- `features_*`: Features section
- `feature1_*` to `feature6_*`: Individual feature descriptions
- `advantages_*`: Competitive advantages section
- `adv1_*` to `adv6_*`: Individual advantage descriptions
- `pricing_*`: Pricing section headers
- `plan_*`: Pricing plan details
- `feature_*`: Plan feature descriptions
- `addons_*`: Add-on products
- `addon1_*` to `addon3_*`: Individual add-on descriptions
- `cta_*`: Call-to-action section
- `footer_*`: Footer links and content

## Best Practices
1. **Keep keys descriptive**: Use clear, hierarchical naming like `section_subsection_element`
2. **Maintain consistency**: Always add translations for all supported languages
3. **Test thoroughly**: Check both languages after making changes
4. **Preserve HTML**: For content with HTML tags, ensure proper escaping in JSON
5. **Backup before changes**: The translation file contains all website copy

## Technical Notes
- Language preference is saved in localStorage as `carledgr-language`
- Default language is English (`en`)
- HTML elements with `<span class="highlight">` are handled specially to preserve formatting
- Translation loading is asynchronous and gracefully handles errors

## Troubleshooting
- If translations don't load, check browser console for fetch errors
- Ensure `translations.json` is valid JSON (use a JSON validator)
- Missing translations will keep the original HTML content
- Clear localStorage to reset language preference: `localStorage.removeItem('carledgr-language')` 