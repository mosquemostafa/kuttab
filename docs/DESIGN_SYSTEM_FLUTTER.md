# Modawim Design System Specification for Flutter Mobile Application

> **Target Audience:** Flutter Mobile Engineering Team  
> **Source Platform:** Modawim Web (Tailwind CSS v4 + Radix UI + shadcn/ui "radix-vega" Zinc)  
> **Version:** 1.0.0  
> **Primary Locale:** Arabic (`ar`, RTL)  
> **Secondary Locale:** English (`en`, LTR)

---

## 1. Executive Summary & Design Principles

Modawim (مُداوِم) is a mindful habit tracker, task management, and productivity app. The user interface embodies a **calm, clean, distraction-free aesthetic** with high information density, smooth micro-interactions, and first-class Arabic RTL typography.

### Core Principles

1. **RTL-First & Culturally Native**: Arabic is the primary interface language. The layout, icons, progress flows, and typography must naturally flow right-to-left without looking like an afterthought translation.
2. **Neutral Base, Dynamic Accents**: The core interface uses an ultra-refined neutral palette (Zinc / Slate) for cards, surfaces, and typography, while user-selected accents (Neutral, Blue, Green, Red, Purple, Gold) bring purposeful personality.
3. **Pastel & Ink Harmonization**: Notes, project folders, and tags use soft, desaturated pastel surfaces paired with deep, high-contrast "ink" tones for effortless readability without visual fatigue.
4. **Subtle Elevation Over Heavy Shadows**: Depth is communicated primarily through crisp 1px borders (`ring-1 ring-foreground/10` or `border-border`) and soft ambient blurs rather than heavy drop shadows.

---

## 2. Color System & Palettes

All colors from the web application's OKLCH space have been mathematically converted to standard sRGB Hex and Flutter `Color(0xAARRGGBB)` format.

### 2.1 Core Semantic Tokens (Light vs Dark)

| Semantic Token              | Light Hex | Light Flutter `Color` | Dark Hex          | Dark Flutter `Color` | Usage                                     |
| :-------------------------- | :-------- | :-------------------- | :---------------- | :------------------- | :---------------------------------------- |
| **`background`**            | `#FFFFFF` | `Color(0xFFFFFFFF)`   | `#09090B`         | `Color(0xFF09090B)`  | Screen scaffold background                |
| **`foreground`**            | `#09090B` | `Color(0xFF09090B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Primary text, titles, major headers       |
| **`card`**                  | `#FFFFFF` | `Color(0xFFFFFFFF)`   | `#18181B`         | `Color(0xFF18181B)`  | Surface of cards, lists, tiles            |
| **`cardForeground`**        | `#09090B` | `Color(0xFF09090B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Text inside cards                         |
| **`popover`**               | `#FFFFFF` | `Color(0xFFFFFFFF)`   | `#18181B`         | `Color(0xFF18181B)`  | Menus, tooltips, dialogs, sheets          |
| **`popoverForeground`**     | `#09090B` | `Color(0xFF09090B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Text inside popovers & sheets             |
| **`primary`**               | `#18181B` | `Color(0xFF18181B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Default primary CTA, active toggles       |
| **`primaryForeground`**     | `#FAFAFA` | `Color(0xFFFAFAFA)`   | `#18181B`         | `Color(0xFF18181B)`  | Text on top of primary button             |
| **`secondary`**             | `#F4F4F5` | `Color(0xFFF4F4F5)`   | `#27272A`         | `Color(0xFF27272A)`  | Secondary action buttons, tag chips       |
| **`secondaryForeground`**   | `#18181B` | `Color(0xFF18181B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Text on secondary buttons                 |
| **`muted`**                 | `#F4F4F5` | `Color(0xFFF4F4F5)`   | `#27272A`         | `Color(0xFF27272A)`  | Disabled buttons, empty state backgrounds |
| **`mutedForeground`**       | `#71717B` | `Color(0xFF71717B)`   | `#9F9FA9`         | `Color(0xFF9F9FA9)`  | Subtitles, timestamps, placeholders       |
| **`accent`**                | `#F4F4F5` | `Color(0xFFF4F4F5)`   | `#27272A`         | `Color(0xFF27272A)`  | Hover/tap surface highlight               |
| **`accentForeground`**      | `#18181B` | `Color(0xFF18181B)`   | `#FAFAFA`         | `Color(0xFFFAFAFA)`  | Text on tapped surface                    |
| **`destructive`**           | `#E7000B` | `Color(0xFFE7000B)`   | `#FF6467`         | `Color(0xFFFF6467)`  | Errors, delete actions, missed habits     |
| **`destructiveForeground`** | `#FFFFFF` | `Color(0xFFFFFFFF)`   | `#09090B`         | `Color(0xFF09090B)`  | Text on destructive buttons               |
| **`border`**                | `#E4E4E7` | `Color(0xFFE4E4E7)`   | `#27272A` (10% W) | `Color(0x1AFFFFFF)`  | Card borders, dividers, outlines          |
| **`input`**                 | `#E4E4E7` | `Color(0xFFE4E4E7)`   | `#3F3F46` (15% W) | `Color(0x26FFFFFF)`  | Text field unselected border / bg         |
| **`ring`**                  | `#9F9FA9` | `Color(0xFF9F9FA9)`   | `#71717B`         | `Color(0xFF71717B)`  | Focus ring outline for inputs             |

---

### 2.2 Dynamic User Accent Themes

Users can personalize the application theme accent in Settings. When a theme accent is selected, the primary brand color, focus rings, and active tab indicators switch to the values below:

| Accent Name           | Light Primary/Accent | Light Flutter `Color` | Dark Primary/Accent | Dark Flutter `Color` | Foreground On Accent              |
| :-------------------- | :------------------- | :-------------------- | :------------------ | :------------------- | :-------------------------------- |
| **Neutral** (Default) | `#18181B`            | `Color(0xFF18181B)`   | `#FAFAFA`           | `Color(0xFFFAFAFA)`  | Light: `#FFFFFF`, Dark: `#09090B` |
| **Blue**              | `#2F5B8B`            | `Color(0xFF2F5B8B)`   | `#4C8FD8`           | `Color(0xFF4C8FD8)`  | `#FFFFFF` (Both)                  |
| **Green**             | `#09895C`            | `Color(0xFF09895C)`   | `#00B176`           | `Color(0xFF00B176)`  | `#FFFFFF` (Both)                  |
| **Red**               | `#E4361C`            | `Color(0xFFE4361C)`   | `#FC4734`           | `Color(0xFFFC4734)`  | `#FFFFFF` (Both)                  |
| **Purple**            | `#280078`            | `Color(0xFF280078)`   | `#7A72ED`           | `Color(0xFF7A72ED)`  | `#FFFFFF` (Both)                  |
| **Gold**              | `#D89700`            | `Color(0xFFD89700)`   | `#D6A20A`           | `Color(0xFFD6A20A)`  | Light: `#FFFFFF`, Dark: `#18181B` |

---

### 2.3 Pastel Tint & Ink Palette (Sticky Notes, Tags & Projects)

Sticky notes, project cards, and tag swatches use a paired pastel surface and deep ink color:

| Color Key                | Surface (Background) | Flutter `Color`     | Ink (Text & Icons) | Flutter `Color`     | Visual Description               |
| :----------------------- | :------------------- | :------------------ | :----------------- | :------------------ | :------------------------------- |
| **`red`**                | `#FAAFA8`            | `Color(0xFFFAAFA8)` | `#77172E`          | `Color(0xFF77172E)` | Soft coral / Crimson ink         |
| **`orange`**             | `#F39F76`            | `Color(0xFFF39F76)` | `#692B18`          | `Color(0xFF692B18)` | Warm peach / Rust ink            |
| **`yellow`**             | `#FFF8B8`            | `Color(0xFFFFF8B8)` | `#7C4B03`          | `Color(0xFF7C4B03)` | Pale buttercup / Amber ink       |
| **`green`**              | `#E2F6D3`            | `Color(0xFFE2F6D3)` | `#264D3B`          | `Color(0xFF264D3B)` | Soft mint / Forest ink           |
| **`teal`**               | `#B4DDD2`            | `Color(0xFFB4DDD2)` | `#0D625D`          | `Color(0xFF0D625D)` | Pale sage-teal / Deep spruce ink |
| **`blue`**               | `#D4E4ED`            | `Color(0xFFD4E4ED)` | `#266377`          | `Color(0xFF266377)` | Sky pastel / Navy slate ink      |
| **`darkBlue`**           | `#AECCDC`            | `Color(0xFFAECCDC)` | `#284254`          | `Color(0xFF284254)` | Soft denim / Midnight slate ink  |
| **`purple`**             | `#D3BFDB`            | `Color(0xFFD3BFDB)` | `#482E5B`          | `Color(0xFF482E5B)` | Lavender mist / Deep plum ink    |
| **`pink`**               | `#F6E2DD`            | `Color(0xFFF6E2DD)` | `#6B394F`          | `Color(0xFF6B394F)` | Dusty blush / Burgundy ink       |
| **`brown`**              | `#E9E3D4`            | `Color(0xFFE9E3D4)` | `#4B443A`          | `Color(0xFF4B443A)` | Oat beige / Warm espresso ink    |
| **`gray`**               | `#EFEFF1`            | `Color(0xFFEFEFF1)` | `#232427`          | `Color(0xFF232427)` | Soft mist / Charcoal ink         |
| **`neutral`** (Untinted) | Uses `card`          | `Color(0xFFFFFFFF)` | Uses `foreground`  | `Color(0xFF09090B)` | Standard theme surface           |

> **Note on Dark Mode Pastel Surfaces:** On dark themes, sticky notes can either retain their pastel backgrounds with ink text (to preserve color coding) or render as dark cards (`#18181B`) with a 2px colored border and colored tag badge.

---

### 2.4 Chart & Analytics Palette

Used for habit completion heatmaps, weekly consistency graphs, and analytics charts:

| Token        | Light Hex | Light Flutter `Color` | Dark Hex  | Dark Flutter `Color` | Meaning                            |
| :----------- | :-------- | :-------------------- | :-------- | :------------------- | :--------------------------------- |
| **`chart1`** | `#0066D6` | `Color(0xFF0066D6)`   | `#5EA8F9` | `Color(0xFF5EA8F9)`  | Primary metric / Habit completions |
| **`chart2`** | `#00828F` | `Color(0xFF00828F)`   | `#24C1C9` | `Color(0xFF24C1C9)`  | Secondary metric / Focus hours     |
| **`chart3`** | `#00791B` | `Color(0xFF00791B)`   | `#6DBA70` | `Color(0xFF6DBA70)`  | Success rate / Streaks             |
| **`chart4`** | `#7733B1` | `Color(0xFF7733B1)`   | `#AE7EE2` | `Color(0xFFAE7EE2)`  | Milestone progress                 |
| **`chart5`** | `#CC2D00` | `Color(0xFFCC2D00)`   | `#F98B6F` | `Color(0xFFF98B6F)`  | Target shortfall / Pending         |

---

### 2.5 Pomodoro & Status Colors

| State / Phase             | Hex       | Flutter `Color`     | Usage                                       |
| :------------------------ | :-------- | :------------------ | :------------------------------------------ |
| **Pomodoro Work**         | `#EF4444` | `Color(0xFFEF4444)` | Active focus work countdown, FAB background |
| **Pomodoro Short Break**  | `#3B82F6` | `Color(0xFF3B82F6)` | 5-minute break timer                        |
| **Pomodoro Long Break**   | `#10B981` | `Color(0xFF10B981)` | 15/30-minute restorative break              |
| **Habit Progress 100%**   | `#10B981` | `Color(0xFF10B981)` | All habits done (Emerald 500)               |
| **Habit Progress 75-99%** | `#0EA5E9` | `Color(0xFF0EA5E9)` | High progress (Sky 500)                     |
| **Habit Progress 35-74%** | `#FACC15` | `Color(0xFFFACC15)` | Moderate progress (Yellow 400)              |
| **Habit Progress 0-34%**  | `#EF4444` | `Color(0xFFEF4444)` | Needs attention (Red 500)                   |

---

## 3. Typography System

Modawim enforces a strictly bifurcated typographic hierarchy depending on the active locale.

### 3.1 Font Families

| Locale             | Font Family   | Google Fonts Package    | Fallback Stack                    | Description                                                                       |
| :----------------- | :------------ | :---------------------- | :-------------------------------- | :-------------------------------------------------------------------------------- |
| **Arabic (`ar`)**  | **`Tajawal`** | `GoogleFonts.tajawal()` | Cairo, Geeza Pro, sans-serif      | Modern geometric Arabic font with exceptional legibility across all screen sizes  |
| **English (`en`)** | **`Inter`**   | `GoogleFonts.inter()`   | -apple-system, Roboto, sans-serif | Clean, versatile neutral sans-serif designed for high-density computer interfaces |

### 3.2 Type Hierarchy Scale

| Token Name           | Font Size | Line Height     | Weight                       | Letter Spacing | Flutter `TextStyle` Spec                |
| :------------------- | :-------- | :-------------- | :--------------------------- | :------------- | :-------------------------------------- |
| **`displayLarge`**   | `30.0`    | `1.2` (`36.0`)  | `FontWeight.w700` (Bold)     | `-0.5`         | Top greetings, big timer clock digits   |
| **`headlineLarge`**  | `24.0`    | `1.25` (`30.0`) | `FontWeight.w600` (SemiBold) | `-0.25`        | Page titles (e.g. "العادات اليومية")    |
| **`headlineMedium`** | `20.0`    | `1.3` (`26.0`)  | `FontWeight.w600` (SemiBold) | `0.0`          | Section titles, dashboard cards         |
| **`titleMedium`**    | `16.0`    | `1.4` (`22.4`)  | `FontWeight.w500` (Medium)   | `0.0`          | Card titles, modal headers, list titles |
| **`titleSmall`**     | `14.0`    | `1.4` (`19.6`)  | `FontWeight.w500` (Medium)   | `0.0`          | Subsection titles, table headers        |
| **`bodyLarge`**      | `16.0`    | `1.5` (`24.0`)  | `FontWeight.w400` (Regular)  | `0.0`          | Rich text articles, note body content   |
| **`bodyMedium`**     | `14.0`    | `1.5` (`21.0`)  | `FontWeight.w400` (Regular)  | `0.0`          | Standard body text, form field inputs   |
| **`bodySmall`**      | `12.0`    | `1.4` (`16.8`)  | `FontWeight.w400` (Regular)  | `0.0`          | Subtitles, helper text, timestamps      |
| **`labelLarge`**     | `14.0`    | `1.0` (`14.0`)  | `FontWeight.w500` (Medium)   | `0.0`          | Primary & secondary button text         |
| **`labelMedium`**    | `12.0`    | `1.0` (`12.0`)  | `FontWeight.w500` (Medium)   | `0.0`          | Small button labels, input addons       |
| **`labelSmall`**     | `10.0`    | `1.2` (`12.0`)  | `FontWeight.w600` (SemiBold) | `0.3`          | Badges, pills, status flags             |

> **Arabic Kerning Rule**: Arabic typography should never have positive letter spacing (`letter-spacing > 0`) as it breaks Arabic cursive letter connections. Keep `letterSpacing: 0.0` for Arabic text.

---

## 4. Spacing, Shapes & Elevation

### 4.1 Spacing Scale (4pt Grid)

| Token          | Size (Logical Pixels) | Common Mobile Use Case                                       |
| :------------- | :-------------------- | :----------------------------------------------------------- |
| **`space1`**   | `4.0`                 | Gap between icon and text in badges                          |
| **`space1_5`** | `6.0`                 | Input addon padding, tag dot gap                             |
| **`space2`**   | `8.0`                 | Standard item inner padding, chip spacing                    |
| **`space2_5`** | `10.0`                | Form field internal horizontal padding                       |
| **`space3`**   | `12.0`                | Gap between list items, modal button gaps                    |
| **`space4`**   | `16.0`                | Screen outer horizontal margin, card inner padding (compact) |
| **`space5`**   | `20.0`                | FAB distance from screen edges, section separation           |
| **`space6`**   | `24.0`                | Standard card internal padding, bottom sheet padding         |
| **`space8`**   | `32.0`                | Vertical spacing between major dashboard blocks              |
| **`space10`**  | `40.0`                | Empty state vertical spacing                                 |

---

### 4.2 Border Radius Scale

Modawim features friendly, modern rounded curves. The web base radius (`var(--radius)`) is `10px`.

| Token            | Radius Value | Flutter `BorderRadius`          | Applied Components                       |
| :--------------- | :----------- | :------------------------------ | :--------------------------------------- |
| **`radiusSm`**   | `6.0`        | `BorderRadius.circular(6.0)`    | Keyboard badges, small tags, sub-actions |
| **`radiusMd`**   | `8.0`        | `BorderRadius.circular(8.0)`    | Inputs, default buttons, dropdown items  |
| **`radiusLg`**   | `10.0`       | `BorderRadius.circular(10.0)`   | Large buttons, select boxes              |
| **`radiusXl`**   | `14.0`       | `BorderRadius.circular(14.0)`   | Standard content cards, dialog content   |
| **`radius2Xl`**  | `18.0`       | `BorderRadius.circular(18.0)`   | Large tiles, bottom sheets top corners   |
| **`radius3Xl`**  | `22.0`       | `BorderRadius.circular(22.0)`   | Habit daily view banner, date picker     |
| **`radiusFull`** | `9999.0`     | `BorderRadius.circular(9999.0)` | Circular check buttons, badges, FAB      |

---

### 4.3 Elevation & Shadows

In Flutter, shadows should be kept light and diffused to preserve the clean, modern look:

```dart
class ModawimShadows {
  /// Subtle card elevation (Tailwind shadow-xs)
  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x0A000000), // 4% black
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  /// Modal dialogs & bottom sheets (Tailwind shadow-lg)
  static const List<BoxShadow> modal = [
    BoxShadow(
      color: Color(0x1F000000), // 12% black
      blurRadius: 20,
      offset: Offset(0, 10),
    ),
  ];

  /// Floating Action Button (Pomodoro timer)
  static const List<BoxShadow> fab = [
    BoxShadow(
      color: Color(0x2E000000), // 18% black
      blurRadius: 16,
      offset: Offset(0, 6),
    ),
  ];
}
```

---

## 5. Iconography & Assets

### 5.1 Icon System

- **Library**: Modawim uses **Lucide Icons** exclusively.
- **Flutter Package**: [`lucide_icons`](https://pub.dev/packages/lucide_icons) (`lucide_icons: ^0.257.0`) or [`flutter_lucide`](https://pub.dev/packages/flutter_lucide).
- **Stroke Width**: `1.75` to `2.0` (thin-to-medium clean stroke).

### 5.2 Icon Sizing Standards

- **Micro (Inline Badge / Status)**: `12.0 x 12.0` (`size-3`)
- **Button Suffix / Prefix**: `16.0 x 16.0` (`size-4`)
- **List Tile / Menu Item**: `18.0 - 20.0` (`size-5`)
- **App Bar Action / FAB**: `22.0 - 24.0` (`size-6`)
- **Hero / Empty State**: `36.0 - 48.0`

### 5.3 RTL Icon Mirroring Rules

In Arabic RTL mode, certain icons **must be horizontally flipped** using `Transform.flip(flipX: true, child: ...)` or directional variants:

- **Flip**: `ChevronLeft` / `ChevronRight`, `ArrowLeft` / `ArrowRight`, back buttons, step forward/backward icons, undo/redo.
- **Do NOT Flip**: Clocks (`Timer`, `Clock`), checkmarks (`Check`), search (`Search`), settings cogs, flame streaks (`Flame`), camera, share.

### 5.4 App Assets

- **Logo**: `/public/logo.png`
- **Pomodoro Timer Mascot**: `/public/assets/pomodoro.png`
- **Sound Effects**:
  - Button click: `/public/button.wav`
  - Habit completion chime: `/public/check.mp3`

---

## 6. Core Component Specifications

### 6.1 Buttons (`ModawimButton`)

| Variant                 | Background Color                        | Text / Icon Color            | Border              | Tap State                           |
| :---------------------- | :-------------------------------------- | :--------------------------- | :------------------ | :---------------------------------- |
| **`default` (Primary)** | `colors.primary`                        | `colors.primaryForeground`   | None                | Slight scale `0.98` + opacity `0.9` |
| **`secondary`**         | `colors.secondary`                      | `colors.secondaryForeground` | None                | Background opacity `0.85`           |
| **`outline`**           | Transparent / Card                      | `colors.foreground`          | `1px colors.border` | `colors.muted` background           |
| **`ghost`**             | Transparent                             | `colors.foreground`          | None                | `colors.muted` background           |
| **`destructive`**       | `colors.destructive` with `0.1` opacity | `colors.destructive`         | None                | Opacity `0.2` on tap                |
| **`link`**              | Transparent                             | `colors.primary`             | None                | Underline text decoration           |

#### Button Sizes

- **Default (`h-9`)**: Height `36.0`, padding horizontal `12.0`, text `14.0`, radius `8.0`
- **Small (`h-8`)**: Height `32.0`, padding horizontal `10.0`, text `12.0`, radius `8.0`
- **Extra Small (`h-6`)**: Height `24.0`, padding horizontal `8.0`, text `11.0`, radius `6.0`
- **Large (`h-10`)**: Height `40.0`, padding horizontal `16.0`, text `15.0`, radius `10.0`
- **Icon Buttons**: Square aspect ratio (`36x36`, `32x32`, `24x24`)

---

### 6.2 Text Input & Input Groups (`ModawimInput`)

- **Height**: `36.0` (standard) or `44.0` (touch-comfortable for mobile).
- **Background**: Transparent in Light mode; `Color(0x26FFFFFF)` (15% white) in Dark mode.
- **Border**: `1px` solid `colors.input` (`#E4E4E7`).
- **Corner Radius**: `8.0` (`radiusMd`).
- **Focus State**: Border becomes `colors.primary` or active theme accent with a 2px outer glow (`colors.ring`).
- **Error State**: Border becomes `colors.destructive` with red error text below (`12.0` size).
- **Addons**: Prefix icon (e.g. search icon on start), suffix clear button (`X` icon on end).

---

### 6.3 Cards & Content Containers (`ModawimCard`)

- **Standard Card**:
  - Background: `colors.card`
  - Border: `1px` solid `colors.border`
  - Radius: `14.0` (`radiusXl`)
  - Padding: `16.0` (mobile standard) or `24.0` (tablets / spacious sections)
- **Tinted Sticky Note / Folder Card**:
  - Background: Pastel color from Section 2.3 (e.g. `#E2F6D3` for green)
  - Text & Icon: Matching ink color (e.g. `#264D3B`)
  - Border: `1px` solid `Color(0x14000000)` (8% black)
  - Radius: `14.0`

---

### 6.4 Habit Item Tile & Completion Toggle

The habit item is the most frequently interacted element in Modawim:

- **Card Layout**:
  - Container: Height `~64.0`, padding `12.0`, border radius `18.0` (`radius2Xl`)
  - Start element: Habit Icon / Color Dot (`32.0 x 32.0` circle with pastel fill)
  - Center: Habit Name (`14.0`, font weight 500) + Subtitle/Tag
  - End element: **Completion Circle Button**
- **Completion Circle Button**:
  - Size: `36.0 x 36.0`
  - **Uncompleted State**: Transparent background, `1.5px` border `colors.mutedForeground`, empty circle.
  - **Completed State**: Smooth green fill (`#10B981` / Emerald 500 or `#D1FAE5` with `#059669` check), animated checkmark icon (`Check`), accompanied by a light haptic feedback (`HapticFeedback.lightImpact()`).

---

### 6.5 Pomodoro Floating Action Button (FAB)

- **Position**: Floating at bottom-end corner (`bottom: 20.0`, `inset-end: 20.0`).
- **Size**: `56.0 x 56.0` circular button with `ModawimShadows.fab`.
- **States**:
  - **Idle / Off**: Shows the Pomodoro tomato asset or subtle timer icon.
  - **Running Work Phase**: Solid Red (`#EF4444`), white timer digits (e.g. `24:18`), pulsing subtly.
  - **Short Break**: Solid Blue (`#3B82F6`), white timer digits.
  - **Long Break**: Solid Emerald (`#10B981`), white timer digits.
  - **Selection Mode**: Red outline with `X` icon to cancel.

---

### 6.6 Switches & Toggles (`ModawimSwitch`)

- **Track Dimensions**: Width `32.0`, Height `18.4`, rounded full (`BorderRadius.circular(10.0)`).
- **Thumb Dimensions**: Diameter `14.0`, circular (`BorderRadius.circular(7.0)`).
- **Unchecked**: Track is `colors.input` (`#E4E4E7`), thumb is `#FFFFFF`.
- **Checked**: Track is `colors.primary` (or active accent), thumb is `colors.primaryForeground`.
- **Directional Animation**: In RTL mode, the thumb slides to the **left** on check (`-12.0px`); in LTR, it slides to the **right** (`+12.0px`).

---

### 6.7 Bottom Sheets & Modal Dialogs

- **Bottom Sheet (`ModawimBottomSheet`)**:
  - Backdrop: `Color(0x33000000)` (20% black blur)
  - Surface: `colors.popover` (`#FFFFFF` in Light, `#18181B` in Dark)
  - Top Corners: Rounded `20.0`
  - Top Drag Handle: Width `36.0`, Height `4.0`, Color `colors.mutedForeground` with `0.4` opacity, centered.
  - Padding: `20.0` all around.
- **Center Dialog**:
  - Max Width: `340.0`
  - Radius: `16.0`
  - Close button: Top-end corner ghost icon.

---

## 7. RTL & Internationalization Guidelines for Flutter

Since Arabic is the default locale in Modawim, developers must strictly adhere to directional layout rules:

### 7.1 Never Hardcode `left` or `right`

Always use directional alternatives in Flutter widgets:

```dart
// ❌ INCORRECT (Breaks in Arabic RTL):
Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0))
Container(alignment: Alignment.centerLeft)
Positioned(left: 12.0)

// ✅ CORRECT (Adapts automatically):
Padding(padding: EdgeInsetsDirectional.only(start: 16.0, end: 8.0))
Container(alignment: AlignmentDirectional.centerStart)
Positioned.directional(textDirection: Directionality.of(context), start: 12.0)
```

### 7.2 Text Directionality Configuration

Ensure your `MaterialApp` is configured with Arabic as the primary supported locale:

```dart
MaterialApp(
  title: 'Modawim',
  locale: const Locale('ar'), // Default to Arabic
  supportedLocales: const [
    Locale('ar', ''), // Arabic (RTL)
    Locale('en', ''), // English (LTR)
  ],
  localizationsDelegates: const [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  // ...
);
```

### 7.3 Number Representation

Modawim web uses standard Arabic numbers (`0, 1, 2, 3...`) for dates, times, and statistics across both Arabic and English interfaces for consistent digital readability.

---

## 8. Ready-to-Use Flutter Theme Implementation

Below is a production-ready template that the Flutter developer can drop directly into the project:

### 8.1 Color Extension (`modawim_colors.dart`)

```dart
import 'package:flutter/material.dart';

@immutable
class ModawimColors extends ThemeExtension<ModawimColors> {
  // Core Semantics
  final Color background;
  final Color foreground;
  final Color card;
  final Color cardForeground;
  final Color primary;
  final Color primaryForeground;
  final Color secondary;
  final Color secondaryForeground;
  final Color muted;
  final Color mutedForeground;
  final Color destructive;
  final Color border;
  final Color input;
  final Color ring;

  // Pastels & Inks for Sticky Notes / Tags
  final Color pastelRed;
  final Color inkRed;
  final Color pastelGreen;
  final Color inkGreen;
  final Color pastelBlue;
  final Color inkBlue;
  final Color pastelYellow;
  final Color inkYellow;
  final Color pastelPurple;
  final Color inkPurple;
  final Color pastelOrange;
  final Color inkOrange;

  const ModawimColors({
    required this.background,
    required this.foreground,
    required this.card,
    required this.cardForeground,
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.destructive,
    required this.border,
    required this.input,
    required this.ring,
    required this.pastelRed,
    required this.inkRed,
    required this.pastelGreen,
    required this.inkGreen,
    required this.pastelBlue,
    required this.inkBlue,
    required this.pastelYellow,
    required this.inkYellow,
    required this.pastelPurple,
    required this.inkPurple,
    required this.pastelOrange,
    required this.inkOrange,
  });

  static const light = ModawimColors(
    background: Color(0xFFFFFFFF),
    foreground: Color(0xFF09090B),
    card: Color(0xFFFFFFFF),
    cardForeground: Color(0xFF09090B),
    primary: Color(0xFF18181B),
    primaryForeground: Color(0xFFFAFAFA),
    secondary: Color(0xFFF4F4F5),
    secondaryForeground: Color(0xFF18181B),
    muted: Color(0xFFF4F4F5),
    mutedForeground: Color(0xFF71717B),
    destructive: Color(0xFFE7000B),
    border: Color(0xFFE4E4E7),
    input: Color(0xFFE4E4E7),
    ring: Color(0xFF9F9FA9),
    pastelRed: Color(0xFFFAAFA8),
    inkRed: Color(0xFF77172E),
    pastelGreen: Color(0xFFE2F6D3),
    inkGreen: Color(0xFF264D3B),
    pastelBlue: Color(0xFFD4E4ED),
    inkBlue: Color(0xFF266377),
    pastelYellow: Color(0xFFFFF8B8),
    inkYellow: Color(0xFF7C4B03),
    pastelPurple: Color(0xFFD3BFDB),
    inkPurple: Color(0xFF482E5B),
    pastelOrange: Color(0xFFF39F76),
    inkOrange: Color(0xFF692B18),
  );

  static const dark = ModawimColors(
    background: Color(0xFF09090B),
    foreground: Color(0xFFFAFAFA),
    card: Color(0xFF18181B),
    cardForeground: Color(0xFFFAFAFA),
    primary: Color(0xFFFAFAFA),
    primaryForeground: Color(0xFF18181B),
    secondary: Color(0xFF27272A),
    secondaryForeground: Color(0xFFFAFAFA),
    muted: Color(0xFF27272A),
    mutedForeground: Color(0xFF9F9FA9),
    destructive: Color(0xFFFF6467),
    border: Color(0x1AFFFFFF), // 10% white
    input: Color(0x26FFFFFF),  // 15% white
    ring: Color(0xFF71717B),
    pastelRed: Color(0xFFFAAFA8),
    inkRed: Color(0xFF77172E),
    pastelGreen: Color(0xFFE2F6D3),
    inkGreen: Color(0xFF264D3B),
    pastelBlue: Color(0xFFD4E4ED),
    inkBlue: Color(0xFF266377),
    pastelYellow: Color(0xFFFFF8B8),
    inkYellow: Color(0xFF7C4B03),
    pastelPurple: Color(0xFFD3BFDB),
    inkPurple: Color(0xFF482E5B),
    pastelOrange: Color(0xFFF39F76),
    inkOrange: Color(0xFF692B18),
  );

  @override
  ModawimColors copyWith({
    Color? background,
    Color? foreground,
    Color? card,
    Color? cardForeground,
    Color? primary,
    Color? primaryForeground,
    Color? secondary,
    Color? secondaryForeground,
    Color? muted,
    Color? mutedForeground,
    Color? destructive,
    Color? border,
    Color? input,
    Color? ring,
  }) {
    return ModawimColors(
      background: background ?? this.background,
      foreground: foreground ?? this.foreground,
      card: card ?? this.card,
      cardForeground: cardForeground ?? this.cardForeground,
      primary: primary ?? this.primary,
      primaryForeground: primaryForeground ?? this.primaryForeground,
      secondary: secondary ?? this.secondary,
      secondaryForeground: secondaryForeground ?? this.secondaryForeground,
      muted: muted ?? this.muted,
      mutedForeground: mutedForeground ?? this.mutedForeground,
      destructive: destructive ?? this.destructive,
      border: border ?? this.border,
      input: input ?? this.input,
      ring: ring ?? this.ring,
      pastelRed: pastelRed,
      inkRed: inkRed,
      pastelGreen: pastelGreen,
      inkGreen: inkGreen,
      pastelBlue: pastelBlue,
      inkBlue: inkBlue,
      pastelYellow: pastelYellow,
      inkYellow: inkYellow,
      pastelPurple: pastelPurple,
      inkPurple: inkPurple,
      pastelOrange: pastelOrange,
      inkOrange: inkOrange,
    );
  }

  @override
  ModawimColors lerp(ThemeExtension<ModawimColors>? other, double t) {
    if (other is! ModawimColors) return this;
    return ModawimColors(
      background: Color.lerp(background, other.background, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      card: Color.lerp(card, other.card, t)!,
      cardForeground: Color.lerp(cardForeground, other.cardForeground, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      primaryForeground: Color.lerp(primaryForeground, other.primaryForeground, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      secondaryForeground: Color.lerp(secondaryForeground, other.secondaryForeground, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      destructive: Color.lerp(destructive, other.destructive, t)!,
      border: Color.lerp(border, other.border, t)!,
      input: Color.lerp(input, other.input, t)!,
      ring: Color.lerp(ring, other.ring, t)!,
      pastelRed: Color.lerp(pastelRed, other.pastelRed, t)!,
      inkRed: Color.lerp(inkRed, other.inkRed, t)!,
      pastelGreen: Color.lerp(pastelGreen, other.pastelGreen, t)!,
      inkGreen: Color.lerp(inkGreen, other.inkGreen, t)!,
      pastelBlue: Color.lerp(pastelBlue, other.pastelBlue, t)!,
      inkBlue: Color.lerp(inkBlue, other.inkBlue, t)!,
      pastelYellow: Color.lerp(pastelYellow, other.pastelYellow, t)!,
      inkYellow: Color.lerp(inkYellow, other.inkYellow, t)!,
      pastelPurple: Color.lerp(pastelPurple, other.pastelPurple, t)!,
      inkPurple: Color.lerp(inkPurple, other.inkPurple, t)!,
      pastelOrange: Color.lerp(pastelOrange, other.pastelOrange, t)!,
      inkOrange: Color.lerp(inkOrange, other.inkOrange, t)!,
    );
  }
}
```

---

### 8.2 Typography Helper (`modawim_typography.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ModawimTypography {
  static TextTheme buildTextTheme(String localeLanguageCode) {
    final bool isArabic = localeLanguageCode == 'ar';

    TextStyle baseStyle(double size, FontWeight weight, double height, [double spacing = 0.0]) {
      if (isArabic) {
        return GoogleFonts.tajawal(
          fontSize: size,
          fontWeight: weight,
          height: height,
          letterSpacing: 0.0, // Never kern Arabic cursive
        );
      } else {
        return GoogleFonts.inter(
          fontSize: size,
          fontWeight: weight,
          height: height,
          letterSpacing: spacing,
        );
      }
    }

    return TextTheme(
      displayLarge: baseStyle(30.0, FontWeight.w700, 1.2, -0.5),
      headlineLarge: baseStyle(24.0, FontWeight.w600, 1.25, -0.25),
      headlineMedium: baseStyle(20.0, FontWeight.w600, 1.3),
      titleMedium: baseStyle(16.0, FontWeight.w500, 1.4),
      titleSmall: baseStyle(14.0, FontWeight.w500, 1.4),
      bodyLarge: baseStyle(16.0, FontWeight.w400, 1.5),
      bodyMedium: baseStyle(14.0, FontWeight.w400, 1.5),
      bodySmall: baseStyle(12.0, FontWeight.w400, 1.4),
      labelLarge: baseStyle(14.0, FontWeight.w500, 1.0),
      labelMedium: baseStyle(12.0, FontWeight.w500, 1.0),
      labelSmall: baseStyle(10.0, FontWeight.w600, 1.2, 0.3),
    );
  }
}
```

---

### 8.3 Theme Data Assembly (`app_theme.dart`)

```dart
import 'package:flutter/material.dart';
import 'modawim_colors.dart';
import 'modawim_typography.dart';

class AppTheme {
  static ThemeData build({
    required bool isDark,
    required String languageCode,
    ModawimColors? customColors,
  }) {
    final colors = customColors ?? (isDark ? ModawimColors.dark : ModawimColors.light);
    final textTheme = ModawimTypography.buildTextTheme(languageCode);

    return ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      scaffoldBackgroundColor: colors.background,
      colorScheme: ColorScheme(
        brightness: isDark ? Brightness.dark : Brightness.light,
        primary: colors.primary,
        onPrimary: colors.primaryForeground,
        secondary: colors.secondary,
        onSecondary: colors.secondaryForeground,
        error: colors.destructive,
        onError: Colors.white,
        surface: colors.card,
        onSurface: colors.cardForeground,
      ),
      textTheme: textTheme,
      cardTheme: CardTheme(
        color: colors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14.0),
          side: BorderSide(color: colors.border, width: 1.0),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: colors.border,
        thickness: 1.0,
        space: 1.0,
      ),
      extensions: [colors],
    );
  }
}
```

---

## 9. Summary Checklist for Flutter Developers

When constructing new screens in the mobile app, verify the following:

- [ ] **RTL Tested**: Tested with Arabic language active; all back buttons and chevrons point in the correct direction.
- [ ] **Directional Insets**: Only `EdgeInsetsDirectional` and `AlignmentDirectional` used; no hardcoded left/right values.
- [ ] **Color Tokens**: Colors referenced via `Theme.of(context).extension<ModawimColors>()` rather than hardcoded hex codes.
- [ ] **Typography**: Correct font family (`Tajawal` for Arabic, `Inter` for English) rendered without clipped descenders.
- [ ] **Corner Radii**: Cards use `14px`, buttons use `8px`, badges and switches use full pills.
- [ ] **Haptics**: Subtle haptic feedback (`HapticFeedback.lightImpact()`) triggered on habit completions and Pomodoro toggles.
