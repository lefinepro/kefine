# kf-combobox Examples

This directory contains comprehensive examples demonstrating all features of the enhanced kf-combobox component.

## Examples

### Basic Examples (`combobox-basic.html`)
Demonstrates fundamental features:
- Default combobox with includes filtering
- Starts-with filtering mode
- Pattern (regex) filtering mode
- Text highlighting for matched characters
- Disabled state

### Advanced Examples (`combobox-advanced.html`)
Demonstrates advanced features:
- Multiple selection with chips
- Async/custom filtering with beforefilter event
- Virtualization for large datasets (1000+ items)
- Datalist integration via slots

## Running Examples

To run these examples, you need to build the component first:

```bash
cd src/assets
bun install
bun run build
```

Then serve the examples with any HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node/npx
npx serve .

# Using PHP
php -S localhost:8000
```

Navigate to:
- http://localhost:8000/examples/combobox-basic.html
- http://localhost:8000/examples/combobox-advanced.html

## Features Demonstrated

### 1. Filtering Modes
- **includes** (default): Matches anywhere in the option text
- **startswith**: Matches only at the beginning
- **pattern**: Uses regex patterns for advanced matching

### 2. Text Highlighting
Enable `highlight-matches` to highlight matched characters in the search results.

### 3. Multiple Selection
Set `multiple` attribute to allow selecting multiple options. Selected items appear as chips above the input.

### 4. Async Loading
Use the `beforefilter` event to implement custom/async filtering:

```javascript
combobox.addEventListener('kf-combobox-beforefilter', async (e) => {
  e.detail.preventDefault();
  const results = await fetchFromAPI(e.detail.value);
  e.detail.setOptions(results);
});
```

### 5. Virtualization
For large datasets, enable virtualization:

```html
<kf-combobox virtualize virtualize-threshold="100"></kf-combobox>
```

This renders only visible items for optimal performance.

### 6. Keyboard Navigation
Full keyboard support:
- **Arrow Down/Up**: Navigate options
- **Home/End**: Jump to first/last option
- **Enter**: Select focused option
- **Escape**: Close listbox or clear input
- **Tab**: Close listbox and move to next element

### 7. Accessibility
Full ARIA compliance:
- `role="combobox"` on input
- `role="listbox"` on dropdown
- `aria-expanded`, `aria-activedescendant`
- `aria-label`, `aria-disabled`
- Screen reader friendly

### 8. CSS Custom Properties
Extensive theming support:

```css
kf-combobox {
  --kf-combobox-bg: #ffffff;
  --kf-combobox-border-color: #e5e7eb;
  --kf-combobox-focus-color: #3b82f6;
  --kf-combobox-option-hover-bg: rgba(59, 130, 246, 0.1);
  --kf-combobox-highlight-bg: #fef3c7;
  /* ... and many more */
}
```

## API Reference

### Properties
- `placeholder`: string - Placeholder text
- `value`: string - Current value
- `options`: ComboboxOption[] - Array of options
- `loading`: boolean - Show loading state
- `min-chars`: number - Minimum characters before showing options
- `search`: 'pattern' | 'startswith' | 'includes' - Filter mode
- `multiple`: boolean - Enable multiple selection
- `highlight-matches`: boolean - Highlight matched text
- `virtualize`: boolean - Enable virtualization
- `virtualize-threshold`: number - Items count to trigger virtualization
- `label`: string - Accessible label
- `disabled`: boolean - Disable the combobox

### Events
- `kf-combobox-input`: Input value changed
- `kf-combobox-beforefilter`: Before filtering (cancelable)
- `kf-combobox-filter`: After filtering
- `kf-combobox-select`: Option selected
- `kf-combobox-change`: Value changed
- `kf-combobox-clear`: Input cleared
- `kf-combobox-open`: Listbox opened
- `kf-combobox-close`: Listbox closed

### Methods
- `focus()`: Focus the input
- `blur()`: Blur the input
- `clear()`: Clear value and selection
- `open()`: Open the listbox
- `close()`: Close the listbox
- `setFilteredOptions(options)`: Set custom filtered options
- `getSelectedOptions()`: Get currently selected options
- `setSelectedOptions(options)`: Set selected options programmatically

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers with Web Components support

CSS Anchor Positioning is enhanced but has fallbacks for older browsers.
