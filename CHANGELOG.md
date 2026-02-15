# Changelog

## [1.4] - 2026-02-15

### Added
- Google Gemini AI face analysis via "AI Summary" button in the result dialog
- API key configuration in extension popup under collapsible Settings section
- Physiognomy-based personality assessment with disclaimer

### Changed
- Redesigned UI with dark theme across controls panel, result dialog, and popup
- Controls panel now uses frosted glass effect with backdrop blur
- Selection box changed from green dashed to subtle blue solid border
- Centerline ticks widened to 5px with rounded ends for easier grabbing
- Buttons updated with consistent styling, hover transitions, and modern colors
- Popup widened to 250px with dark background and improved typography

### Fixed
- Face mirroring no longer warps/stretches when the centerline is off-center. Previously, the mirrored half was stretched or compressed to fill the original canvas width, causing one side to appear larger than the other. The output canvas now resizes to exactly twice the source side width, producing a pixel-perfect symmetric mirror.

## [1.3] and earlier

- Initial implementation with selection box, adjustable centerline, left/right mirroring, YouTube tab capture support, and download functionality.
