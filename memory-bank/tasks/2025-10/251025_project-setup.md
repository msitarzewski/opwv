# 251025_project-setup

**Task ID**: mvp-01
**Date**: 2025-10-25
**Phase**: MVP
**Duration**: 30min (estimated) / ~25min (actual)

## Objective
Initialize the OPWV project structure with Vite, install Three.js and dependencies, and configure the development environment.

## Outcome
- ✅ Vite project initialized with ES6+ configuration
- ✅ Three.js v0.169.0 installed
- ✅ simplex-noise v4.0.3 installed
- ✅ Development server running successfully
- ✅ HMR verified working
- ✅ Production build successful

## Files Created
- `package.json` - Dependencies and scripts (three, simplex-noise, vite)
- `vite.config.js` - Dev server (port 3000) and build config (esbuild minifier)
- `index.html` - Minimal HTML shell with module script tag
- `src/main.js` - Entry point with placeholder content
- `src/particles/` - Directory for particle system code
- `src/utils/` - Directory for utilities (random, noise, colors)

## Technical Details

### Dependencies
```json
{
  "dependencies": {
    "three": "^0.169.0",
    "simplex-noise": "^4.0.3"
  },
  "devDependencies": {
    "vite": "^5.4.10"
  }
}
```

### Vite Configuration
- Dev server: Port 3000, auto-open browser
- Build: ES2015 target, esbuild minifier (faster than terser), sourcemaps enabled
- Output: `dist/` directory

### Directory Structure
```
/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js
    ├── particles/
    └── utils/
```

## Patterns Applied
- `memory-bank/systemPatterns.md#File Structure` - Created src/particles and src/utils directories
- `memory-bank/projectRules.md#Module Organization` - ES6 modules with type: "module"
- `memory-bank/techContext.md#Tech Stack` - Vite + Three.js + ES6+

## Integration Points
- Provides foundation for task mvp-02 (HTML/CSS shell)
- Provides build system for task mvp-03 (Three.js initialization)
- Directory structure ready for particle system components

## Decisions Made
- Used esbuild minifier instead of terser (built-in with Vite, faster)
- Set dev server port to 3000 (standard for Vite projects)
- Enabled sourcemaps for debugging

## Verification
- Dev server starts in ~156ms
- HMR triggers on file changes
- Production build completes in ~46ms
- Bundle size: 0.91 kB (before Three.js integration)

## Next Steps
- Task mvp-02: HTML/CSS shell (full-screen canvas)
- Task mvp-03: Three.js initialization (renderer, scene, camera)
