# Retro Game Guides — JSON Schema Reference

> **Audience:** Contributors working directly with JSON files. If you prefer a visual interface, see `HOWTOCONTRIBUTE.md` for the Guide Builder workflow instead.

## Table of Contents

- [File Organization](#file-organization)
- [Game Index Entry](#game-index-entry-games_indexjson)
- [Game Config](#game-config-raidid_00json)
- [Tab Data](#tab-data-raidid_numjson)
- [Panel Types](#panel-types)
  - [text](#text-panel)
  - [keyvalue](#keyvalue-panel)
  - [checklist](#checklist-panel)
  - [table](#table-panel)
  - [cards](#cards-panel)
- [Themes](#theme-reference)
- [Palettes](#palette-reference)
- [Validation Checklist](#validation-checklist)

---

## File Organization

```
retro_game_guides/
├── games_index.json              # Root index of all games
├── themes.json                   # Theme definitions (shape, radius, fonts)
├── palettes.json                 # Color palette definitions
├── panel_types.json              # Panel type definitions (used by builder)
└── games/
    └── {topStart}-{topEnd}/      # RA ID bucket (e.g. 30001-35000)
        └── {subStart}-{subEnd}/  # Sub-bucket of 200 (e.g. 33001-33200)
            └── {raId}/
                ├── {raId}_00.json   # Config
                ├── {raId}_01.json   # Tab 1
                ├── {raId}_02.json   # Tab 2
                └── ...
```

**Path formula:**

```
topEnd   = ceil(raId / 5000) * 5000
topStart = topEnd - 4999
subEnd   = ceil(raId / 200) * 200
subStart = subEnd - 199
```

Example: raId `33047` → `games/30001-35000/33001-33200/33047/`

---

## Game Index Entry (`games_index.json`)

Append one object to the root array:

```json
{
  "raId": 33047,
  "slug": "spice_and_wolf",
  "primaryName": "Spice and Wolf: Merchant Meets the Wise Wolf",
  "altNames": ["スパイス＆ウルフ"],
  "primarySystem": "Switch",
  "altSystems": ["PC"],
  "series": "Spice and Wolf",
  "year": 2024,
  "icon": "🐺",
  "author": "BigDonRob",
  "tabs": [
    { "num": "01", "label": "📖 Walkthrough", "type": "panels" },
    { "num": "02", "label": "🏆 Achievements", "type": "panels" }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `raId` | ✅ | Integer. Must be unique across all entries. |
| `slug` | ✅ | Lowercase, underscores only. Used in URLs. |
| `primaryName` | ✅ | Full display title. |
| `altNames` | — | Array of strings. Can be empty `[]`. |
| `primarySystem` | ✅ | E.g. `"PSP"`, `"Switch"`, `"PC"`. |
| `altSystems` | — | Array of strings. Can be empty `[]`. |
| `series` | — | Omit if the game is standalone. |
| `year` | — | Release year as an integer. |
| `icon` | — | Single emoji. Displayed in the game list. |
| `author` | — | Guide author name. |
| `tabs` | ✅ | Array of tab descriptors (see below). |

**Tab descriptor:**

```json
{ "num": "01", "label": "📖 Walkthrough", "type": "panels" }
```

- `num`: Two-digit string, zero-padded (`"01"`, `"09"`, `"10"`).
- `label`: Emoji + text. Must match the `label` field in the tab file.
- `type`: Always `"panels"` for standard guides.

---

## Game Config (`{raId}_00.json`)

```json
{
  "storagePrefix": "33047_",
  "subtitle": "Completion tracker — progress saved in your browser",
  "theme": "clean",
  "palette": "midnight"
}
```

| Field | Required | Notes |
|---|---|---|
| `storagePrefix` | ✅ | `"{raId}_"`. Used to namespace localStorage keys. |
| `subtitle` | — | Shown under the game title. |
| `theme` | — | Key from `themes.json`. Controls shape, radius, and fonts. |
| `palette` | — | Key from `palettes.json`. Controls all colors. |

> **Note:** Font settings come exclusively from `themes.json` via the `theme` key. Do not add a `fonts` field directly to `_00.json` — the engine does not read it there and it will be silently ignored.

See [Theme Reference](#theme-reference) and [Palette Reference](#palette-reference) for valid keys.

---

## Tab Data (`{raId}_{num}.json`)

```json
{
  "label": "📖 Walkthrough",
  "panels": [
    { ... },
    { ... }
  ]
}
```

- `label`: Must match the corresponding entry in `games_index.json`.
- `panels`: Ordered array. Panels render top-to-bottom.

Every panel must have a unique `id` within the guide and a `panelType`. The `id` is also used as a localStorage key prefix for checklist state — **changing an existing item's `id` will lose user progress**.

---

## Panel Types

### Text Panel

Free-form content with minimal Markdown support (`**bold**`, `*italic*`, `` `code` ``, `### Heading`, `- list`).

```json
{
  "id": "panel_intro",
  "panelType": "text",
  "title": "Introduction",
  "infobox": "Optional highlighted callout shown above the content.",
  "content": "## Welcome\n\nThis is **Markdown** content.\n\n- Item one\n- Item two"
}
```

---

### KeyValue Panel

A two-column key/value reference table. Rows are added one at a time; no column definitions required.

```json
{
  "id": "panel_controls",
  "panelType": "keyvalue",
  "title": "Controls",
  "rows": [
    { "key": "Move",   "value": "**D-Pad** or Analog Stick" },
    { "key": "Action", "value": "*X Button*" }
  ]
}
```

`value` supports Markdown.

---

### Checklist Panel

An interactive list where users can check off items. Progress is saved to localStorage.

The items array key uses an `entry_` prefix followed by a PascalCase description of the contents. This makes the JSON self-documenting and lets the renderer locate the array without a fixed key name.

```json
{
  "id": "panel_crops",
  "panelType": "checklist",
  "title": "Crops",
  "infobox": "Optional tip shown above the list.",
  "columns": [
    { "key": "season", "label": "Season", "style": "plain" },
    { "key": "price",  "label": "Price",  "style": "accent" },
    { "key": "notes",  "label": "Notes",  "style": "dim" }
  ],
  "entry_Crop": [
    {
      "id": "item_potato",
      "name": "Potato",
      "note": "Sub-text shown under the item name.",
      "season": "Spring / Fall",
      "price": "60G"
    }
  ]
}
```

The key name after `entry_` is free-form but should be a short PascalCase noun describing the entries: `entry_Achievement`, `entry_FishSpecies`, `entry_Recipe`, etc. The renderer finds it by scanning for any key that starts with `entry_`.

**Column `style` values:**

| Value | Effect |
|---|---|
| `"plain"` | Standard text color. |
| `"accent"` | Gold/emphasis color. Use for prices, rewards, key data. |
| `"dim"` | Muted color. Use for secondary info, locations, categories. Hidden on narrow screens. |

**Item fields:**

| Field | Notes |
|---|---|
| `id` | **Required. Must be unique across the entire guide** (not just the tab). Changing this resets user progress for that item. |
| `name` | Required. The main label for the row. |
| `note` | Optional. Small secondary text displayed under the name. Use for warnings, tips, or clarifications. |
| *(column keys)* | Any keys matching a column's `key` value are rendered in that column. |

> **Old format warning:** An older `categories: [{ label, items }]` format and a `type: "checklist"` tab format both exist in legacy files but are **not supported** by the current engine or renderer. If you encounter files using either of these, they need to be converted to the `panelType: "checklist"` format described above.

---

### Table Panel

A non-interactive reference table. Rows support Markdown in all cells.

```json
{
  "id": "panel_weapons",
  "panelType": "table",
  "title": "Weapon Stats",
  "infobox": "Optional tip above the table.",
  "columns": ["Name", "Damage", "Speed", "Price"],
  "rows": [
    ["**Iron Sword**", "10", "Fast", "100G"],
    ["*Great Axe*",    "20", "Slow", "250G"]
  ]
}
```

Rows are arrays of strings (matched to columns by position). Column headers can also be objects `{ "key": "name", "label": "Name" }` if you want named-key rows, but positional arrays are simpler for static tables.

---

### Cards Panel

A grid of cards, each showing multiple labeled fields. The first `cardField` becomes the card's title.

```json
{
  "id": "panel_characters",
  "panelType": "cards",
  "title": "Villagers",
  "cardFields": [
    { "key": "name",     "label": "Name" },
    { "key": "birthday", "label": "Birthday" },
    { "key": "likes",    "label": "Likes" },
    { "key": "dislikes", "label": "Dislikes" }
  ],
  "cards": [
    {
      "name": "Alice",
      "birthday": "Spring 5",
      "likes": "Rare ore, jewelry",
      "dislikes": "Trash"
    }
  ]
}
```

Fields with no value are omitted from rendering.

---

## Theme Reference

Themes control shape (border radius) and typography. Set via `"theme"` in `_00.json`. Fonts are loaded automatically — do not set fonts manually in the config.

| Key | Label | Description |
|---|---|---|
| `"bubbles"` | Soft Bubbles | Rounded, warm. Uses Nunito. |
| `"clean"` | Clean Pro | Crisp, professional. Uses Lora + Playfair Display. |
| `"sharp"` | Sharp Modern | Angular, bold. Uses Barlow. |
| `"editorial"` | Editorial | Serif-first, magazine-quality. Uses Merriweather + Abril Fatface. |
| `"retro"` | Retro Terminal | Monospace-only, zero radius. Uses IBM Plex Mono. |

If `"theme"` is omitted, the guide uses system defaults.

---

## Palette Reference

Palettes define all colors. Set via `"palette"` in `_00.json`.

| Key | Label | Mode |
|---|---|---|
| `"parchment"` | Parchment | Light — warm cream/brown |
| `"midnight"` | Midnight | Dark — deep brown with gold accents |
| `"slate"` | Slate | Dark — blue-grey with teal accents |
| `"ash"` | Ash | Light — neutral grey |
| `"dusk"` | Dusk | Dark — deep purple |
| `"ember"` | Ember | Dark — dark brown with orange accents |
| `"ocean"` | Ocean | Light — blue/teal |
| `"contrast"` | High Contrast | Light — black-and-white, accessibility-focused |

If `"palette"` is omitted, the guide uses built-in defaults.

---

## Validation Checklist

Before submitting, verify:

- [ ] All JSON files parse without errors (use a linter or `JSON.parse` in the browser console).
- [ ] `raId` in `games_index.json` matches the directory name and `storagePrefix` in `_00.json`.
- [ ] `_00.json` has both `theme` **and** `palette` set. A missing `palette` means no colors are applied.
- [ ] `_00.json` does **not** have a `fonts` field — fonts come from `themes.json` only.
- [ ] Every tab's `label` in `games_index.json` matches the `label` in its tab file.
- [ ] Tab `num` values are two-digit, zero-padded strings (`"01"`, not `1`).
- [ ] All panel `id` values are unique within the guide (not just the tab).
- [ ] All checklist item `id` values are unique within the guide.
- [ ] No `id` values contain spaces or characters that break localStorage keys (use `|`, `_`, or `-` as separators).
- [ ] Checklist panels use an `entry_*` key for their items array, not `items`.
- [ ] Theme and palette keys exist in `themes.json` / `palettes.json`.
- [ ] The directory path matches the formula: `games/{topStart}-{topEnd}/{subStart}-{subEnd}/{raId}/`.
- [ ] No tab files use the old `type: "checklist"` or `categories: [...]` format.

---

## Quick Pattern Reference

```json
// Checklist item with note
{ "id": "item_abc", "name": "Rare Sword", "note": "⚠️ Missable — buy before Chapter 3", "location": "Castle Shop", "price": "5,000G" }

// Table row with Markdown
["**Boss Name**", "*Weak to fire*", "3,500 HP", "10,000G drop"]

// Card with optional fields (empty fields are hidden)
{ "name": "Bob", "birthday": "Fall 12", "likes": "Fish", "dislikes": "" }

// KeyValue row with Markdown value
{ "key": "Start of NG+", "value": "All **gold** and **tools** carry over. Seeds do not." }

// Checklist panel with entry_ key
{
  "id": "panel_fish",
  "panelType": "checklist",
  "title": "Fish",
  "columns": [{ "key": "location", "label": "Location", "style": "dim" }],
  "entry_FishSpecies": [
    { "id": "fish_001", "name": "Salmon", "location": "River" }
  ]
}
```
