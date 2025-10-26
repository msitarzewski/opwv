# Project Rules

## Coding Standards

### JavaScript Style
- **ES6+**: Use modern JavaScript (modules, classes, arrow functions, async/await)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Const/Let**: Prefer `const`, use `let` only when reassignment needed
- **No var**: Never use `var`

### Module Organization
- One class or major function per file
- Clear imports at top
- Clear exports at bottom
- Group related utilities

### Comments
- Comment complex algorithms (flocking, noise application)
- Document function parameters and return values
- Avoid obvious comments ("increment i")
- Use JSDoc for public APIs

### Performance Rules
- **60fps Target**: All code must maintain 60fps on target hardware
- **Minimize allocations in render loop**: Reuse objects, avoid creating new instances per frame
- **Use Three.js best practices**: Dispose geometries/materials, use BufferGeometry
- **Monitor FPS**: Implement performance monitoring and adaptive quality

### Three.js Specific
- **Dispose properly**: Always dispose geometries, materials, textures on cleanup
- **Use BufferGeometry**: For custom geometry, always use BufferGeometry (not Geometry)
- **Avoid scene.add/remove in loop**: Add/remove objects outside render loop
- **Reuse materials**: Share materials across particles when possible

### Animation Rules
- **Smooth motion**: All movement should use delta time for frame-rate independence
- **Bounded behavior**: Particles must have max speed, attraction limits
- **Safe randomness**: All random parameters have min/max bounds to prevent ugly results

### Error Handling
- Graceful WebGL context loss handling
- Console warnings for performance degradation
- Fallback for unsupported features

## Visual Quality Standards

### Color Palettes
- Use HSL color space for harmony
- High saturation (60-90%)
- Medium lightness (40-70%)
- Consistent hue families per seed

### Motion Feel
- **Calm and dreamy**, not chaotic
- Smooth acceleration/deceleration
- Natural easing, no sudden jumps
- Organic curves, avoid straight lines

### Particle Aesthetics
- Slight size variation for depth
- Smooth alpha falloff at edges (if using point sprites)
- Consistent visual language (don't mix styles)

## File Naming
- **camelCase** for JS files (e.g., `particleSystem.js`, `flockingBehavior.js`)
- **Descriptive names**: File name should indicate purpose
- **Short but clear**: Avoid abbreviations unless obvious

## Git Commit Standards
- **Imperative mood**: "Add feature" not "Added feature"
- **Concise**: One-line summary, details in body if needed
- **Scope**: Prefix with area (e.g., "particles: add flocking behavior")

## Testing Standards (Future)
- Unit tests for utility functions (noise, random, math)
- Visual regression tests for consistency
- Performance benchmarks for particle count scaling

## Security Considerations
- No external API calls (client-only)
- No sensitive data (all code is public)
- No user data collection (privacy-first)

## Accessibility (Future Consideration)
- Consider motion reduction preferences (`prefers-reduced-motion`)
- Keyboard controls for interaction (Phase 2+)
- Screen reader announcements (Phase 2+)

## Documentation Standards
- **README.md**: Setup instructions, how to run, how to build
- **Code comments**: For complex algorithms only
- **Memory Bank**: Architectural decisions, patterns, progress
- **Inline JSDoc**: For public APIs and complex functions

## Dependencies Management
- Keep dependencies minimal
- Use specific versions (not `^` or `~` for production)
- Regular security audits
- Prefer well-maintained libraries

## Build & Deployment
- Development: `npm run dev` (Vite dev server)
- Production: `npm run build` (optimized bundle)
- Deploy: Static hosting (Netlify, Vercel, GitHub Pages)
- No server-side components
