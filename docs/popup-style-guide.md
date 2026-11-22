# Popup style guide

Use warm paper surfaces, dark ink, serif screen titles and restrained garnet accents in the Schedule Exporter popup.

## Color and surfaces

Use these CSS custom properties from the [base popup stylesheet](../src/styles/popup-base.css). Choose tokens by role so a future palette adjustment carries through to every screen.

| Token | Value | Use |
| --- | --- | --- |
| `--popup-paper` | `#fbf8ef` | Popup background and calendar time gutter |
| `--popup-card` | `#fffdf8` | Course cards, editable fields, selected tab, event details |
| `--popup-wash` | `#f1ece3` | Secondary buttons, status panels, tab track, calendar headers |
| `--popup-ink` | `#332b2b` | Titles, course codes, entered values and button labels |
| `--popup-muted` | `#756962` | Supporting copy, times, room names and optional account status |
| `--popup-line` | `#e2d9ce` | Thin dividers, field outlines and calendar grid lines |
| `--popup-garnet` | `#751e2a` | Logo red for primary button fill, selected tab text, focus outlines and text controls |
| `--popup-garnet-hover` | `#5e1822` | Hovered primary button fill |
| `--popup-soft` | `#f3e2e3` | Tinted background for issue labels and hovered text buttons |

Use small changes in surface color and a 1px border to show nesting. Course cards use an 8px radius and a faint shadow. Event panels use a 5px radius and a warmer fill (`#f8f5ee`). Expanded course cards have a 3px inset garnet line at the left. Use distinct, consistent pastel fills for course blocks in the calendar.

## Type, logo and layout

| Element | Treatment |
| --- | --- |
| Screen titles | Georgia, Times New Roman, serif. Regular weight, −0.5px tracking. Use 28px on the main menu, 24px for review and 23px for export confirmation. |
| Logo | Place the [existing calendar logo](../extension/icons/icon128.png) beside the title with a 12px gap. Use 40 × 40px with an 8px radius on the menu and 32 × 32px with a 6px radius in review. |
| Working text | Use the system sans-serif stack from the [base popup stylesheet](../src/styles/popup-base.css). Course codes are 15px and semibold. Inputs are 13px. Schedule summaries and help text are 12px with about 1.5 line height. Reserve 11px for compact labels, metadata and calendar text. |
| Spacing | Use 4–6px between a label and its control, 8–12px between related controls, and 16–20px between sections. Course cards have 14px vertical and 16px horizontal padding, with 12px between cards. |

The menu has a **380px content width** plus 15px padding on each side (410px overall). The review popup measures **780 × 600px**, with a 760px content width, 10px side padding and 8px vertical padding around the 584px review form. The header, tabs and footer frame the scrollable editor list. Allow course and room names to wrap within their cards.

## Component styling

| Element | Treatment |
| --- | --- |
| Buttons | Use solid garnet with warm white text (`#fffaf5`) for the primary variant. Use wash fill, dark ink and a neutral outline for secondary buttons. Use a 6px radius for both. Text buttons use garnet or muted ink with a soft tinted hover surface. |
| Account section | Use the paper background, a single top divider, 20px top margin and 16px top padding. Use a 13px medium-weight heading, 11px muted status text and a secondary button with a 40px minimum height. |
| Review tabs | Use one wash-colored track with 4px padding and a 4px gap. Style the selected tab with the card surface, garnet text and a subtle shadow. |
| Course and event summaries | Use semibold ink for course codes and muted 12px text for supporting details. Separate adjacent metadata with a middle dot and allow it to wrap. |
| Editable fields | Place a sentence-case label above each field. Use the card surface, a 1px border, a 5px radius and a 38px minimum height. |
| Weekly calendar | Use a 62px time gutter and a 40px day header. Set time and event labels at 11px or larger. Use thin grid lines and a wash fill for day headers. |

## Visual states

- Use wash fill and a neutral border for informational notices. Use pale rose for error summaries, garnet for invalid field borders, and amber for calendar warnings. Calendar conflicts use a dashed event border. Keep the Weekly preview notice compact with short underlined event labels.
- Muted fills and text distinguish disabled buttons. Use a 2px garnet focus outline with a 2px offset on controls. Use an inset focus outline on clipped calendar blocks.
- On coarse pointers, use 44px minimum targets for summary, disclosure, text and remove buttons, and 16px field text. Disable button transitions when reduced motion is requested.

## Stylesheet organization

[popup.css](../src/styles/popup.css) imports the base styles and the files for the menu, schedule review, event editor and weekly calendar. Keep shared palette tokens, typography and controls in `popup-base.css`. Put styles specific to a component in its corresponding file.
