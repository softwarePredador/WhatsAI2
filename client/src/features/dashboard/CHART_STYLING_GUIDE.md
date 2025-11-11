# Dashboard Chart Styling Guide

## Overview
This guide documents the standardized styling approach for all dashboard charts to ensure visual consistency, readability, and proper theme support.

## Design Principles

### 1. Theme-Based Colors
All charts use DaisyUI CSS variables to support both light and dark themes:
- `hsl(var(--bc))` - Base content color (text)
- `hsl(var(--b1))` - Base 100 (backgrounds)
- `hsl(var(--p))` - Primary color (accents)

### 2. Opacity for Visual Hierarchy
- Grid lines: 10% opacity (`hsl(var(--bc) / 0.1)`)
- Axis labels/ticks: 70% opacity (`hsl(var(--bc) / 0.7)`)
- Body text: 100% opacity (`hsl(var(--bc))`)
- Secondary text: 50-60% opacity (`hsl(var(--bc) / 0.5)`)

### 3. Consistent Chart Colors
```typescript
colors: {
  primary: '#3b82f6',   // Blue - Main data, total messages
  success: '#10b981',   // Green - Positive metrics, delivered, totals
  error: '#ef4444',     // Red - Errors, failures
  warning: '#f59e0b',   // Orange - Warnings
  secondary: '#8b5cf6', // Purple - Secondary data (Evolution API costs)
  info: '#06b6d4',      // Cyan - Informational data (Storage costs)
}
```

## Color Usage by Chart

### PeakHoursChart (Bar Chart)
- **Bar color**: Primary blue (`#3b82f6`)
- **Grid**: 10% opacity base-content
- **Axes**: 70% opacity base-content
- **Tooltip**: Base-100 background with primary label

### MessagesChart (Line Chart)
- **Total messages**: Primary blue (`#3b82f6`)
- **Delivered**: Success green (`#10b981`)
- **Failed**: Error red (`#ef4444`)
- **Grid/Axes**: Same as PeakHoursChart
- **Legend**: Auto-generated from line names

### CostsChart (Line Chart)
- **Evolution API**: Secondary purple (`#8b5cf6`)
- **Storage**: Info cyan (`#06b6d4`)
- **Total**: Success green (`#10b981`) with thicker line (3px)
- **Grid/Axes**: Same as other charts
- **Currency formatting**: BRL (R$)

### InstancesStatusChart (Donut Chart)
- **Online**: Success color (via DaisyUI class)
- **Offline**: Error color (via DaisyUI class)
- **Connecting**: Warning color (via DaisyUI class)

## Readability Guidelines

### Text Contrast
All text must meet WCAG AA contrast requirements:
- Axis labels: 70% opacity ensures readability on both light/dark backgrounds
- Chart values: Use full opacity colors for maximum contrast
- Tooltips: High contrast background with colored labels

### Grid Lines
- Subtle grid lines (10% opacity) provide guidance without distraction
- Dashed pattern (3-3) improves visual clarity
- Grid color adapts to theme automatically

### Data Point Visibility
- Line charts: 4px radius dots with 2px stroke
- Active dots: 6px radius for better hover feedback
- Bar charts: 8px top radius for modern look

## Accessibility Features

1. **Color Independence**: Charts work without color (patterns, labels, legends)
2. **High Contrast**: 70% opacity minimum for all text
3. **Theme Support**: Automatic adaptation to light/dark themes
4. **Clear Labels**: All axes and data points properly labeled
5. **Tooltips**: Contextual information on hover with high contrast

## Implementation

### Using the Chart Theme
```typescript
import { chartTheme } from '../utils/chartTheme';

// Grid styling
<CartesianGrid 
  strokeDasharray={chartTheme.grid.strokeDasharray} 
  stroke={chartTheme.grid.stroke}
/>

// Axis styling
<XAxis tick={chartTheme.axis.tick} />
<YAxis tick={chartTheme.axis.tick} />

// Tooltip styling
<Tooltip
  contentStyle={chartTheme.tooltip.contentStyle}
  labelStyle={chartTheme.tooltip.labelStyle}
/>

// Colors
<Bar fill={chartTheme.colors.primary} />
<Line stroke={chartTheme.colors.success} />
```

### Utility Functions
```typescript
import { formatHour, formatDateShort, formatMonth, formatCurrency } from '../utils/chartTheme';

// Format hour (24h format)
formatHour(14) // "14:00"

// Format date (DD/MM)
formatDateShort("2024-01-15") // "15/01"

// Format month (mmm yyyy)
formatMonth("2024-01") // "jan 2024"

// Format currency (BRL)
formatCurrency(1234.56) // "R$ 1.234,56"
```

## Testing Checklist

When modifying charts, verify:
- [ ] Colors adapt correctly in dark mode
- [ ] Text is readable in both themes
- [ ] Grid lines are visible but subtle
- [ ] Tooltips have proper contrast
- [ ] Data points are easily identifiable
- [ ] Chart maintains consistent spacing
- [ ] Legend (if present) is clear
- [ ] Axis labels don't overlap
- [ ] Loading states work properly
- [ ] Empty states are handled gracefully

## Future Improvements

1. Consider adding color-blind friendly palette option
2. Add animation preferences support
3. Implement chart export functionality
4. Add keyboard navigation support
5. Consider adding data table alternative views

## References

- DaisyUI Documentation: https://daisyui.com/
- Recharts Documentation: https://recharts.org/
- WCAG Contrast Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
