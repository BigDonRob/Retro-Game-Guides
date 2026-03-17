# Panel Templates

This directory contains panel templates that can be used as starting points for creating new panels in the guide builder.

## File Structure

- `panel_templates.json` - Contains all available panel templates
- `panel_types.json` - Contains panel type definitions and field schemas

## Template Format

Each template in `panel_templates.json` follows this structure:

```json
{
  "template_key": {
    "panelType": "checklist|table|keyvalue|cards|cardgrid|text",
    "title": "Default Panel Title",
    "_templateInfo": {
      "name": "Human Readable Name",
      "description": "Description of what this template is for",
      "category": "checklist|table|keyvalue|cards|text",
      "icon": "📝"
    },
    // Panel-specific fields based on panelType
    "columns": [...], // for checklist, table
    "rows": [...], // for table, keyvalue
    "items": [...], // for checklist
    "cards": [...], // for cards
    "cardFields": [...], // for cards
    "content": "...", // for text
    "grid": {...}, // for cardgrid
    "regions": [...] // for cardgrid
  }
}
```

## Adding New Templates

To add a new template:

1. Open `panel_templates.json`
2. Add a new entry with a unique key
3. Follow the format above
4. Include the `_templateInfo` section for UI display
5. Set appropriate panel type and default fields

## Template Categories

- **checklist** - Trackable item lists
- **table** - Reference tables with columns
- **keyvalue** - Simple key/value pairs
- **text** - Markdown content panels
- **cardgrid** - Customizable card layouts (NEW)

## Panel Types Note

⚠️ **Important**: There are two card panel types:

- **"cards"** - Legacy type (kept for backward compatibility only)
- **"cardgrid"** - New, fully customizable card layout system

Templates are only provided for the modern **cardgrid** type. The legacy "cards" type doesn't need templates since it's primarily for maintaining existing guides.

## Best Practices

- Use descriptive template keys (e.g., `checklist_basic`, `table_comparison`)
- Provide helpful descriptions in `_templateInfo`
- Include appropriate icons for visual identification
- Set sensible default column/field structures
- Keep arrays empty for initial state
