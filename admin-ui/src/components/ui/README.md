# UI Component Kit

Canonical shared primitives for the Unchained Admin UI.

## Importing

```tsx
import Button from '@/components/ui/Button';
import { Badge, Loading, NoData } from '@/components/ui';
import { TextField, SelectField } from '@/components/ui/form';
```

## What's in the kit

### Core primitives
Button, Badge, Toggle, Tab, Loading, NoData, BlockingContent

### Navigation & layout
BreadCrumbs, PageHeader, ListHeader, DetailHeader, Pagination

### Data display
JSONView, ToolTip, CopyableText, AnimatedCounter, ActiveInActive

### Feedback
ErrorBoundary, ErrorFallback, InfoTextBanner, HelpText

### Form fields (`@/components/ui/form`)
TextField, TextAreaField, SelectField, CheckboxField, ChoicesField,
DatePickerField, EmailField, PasswordField, JSONAreaField,
MarkdownTextAreaField, TagInputField, FieldWrapper, FormErrors,
SubmitButton, FieldWithHelp

### Tags
TagInput, TagList, TagListForm (in `@/components/ui/Tag/`)

### Dates
DateInput, DateRangeFilterInput

### Images
ImageWithFallback, NoImage, NoImageSvg

### Misc
Portal, DraggableIcon, SearchField, SaveAndCancelButtons

### Icons
Central re-export in `@/components/ui/icons.ts`.

### Shadcn-style
card.tsx, chart.tsx (pre-existing)

## Live reference

Visit `/styleguide` in the running admin UI to see every primitive rendered in light and dark mode.

## When to extend vs. add new

- If a variant of an existing component covers your use case, use the variant.
- If you need a genuinely new primitive, add it here with a `/styleguide` entry.
- Domain-specific components stay in `src/modules/<domain>/components/`.
