# Product Requirements Document (PRD)
## Project: Organic Particle WebGL Visualizer (Three.js)

### 1. Overview
This project is a browser-based generative art experience that renders a **full-screen, organic particle animation** using WebGL and **Three.js**. On every load, the visual is **new, random, and beautiful**, while still feeling intentional and guided. Minimal user interaction (cursor/touch attraction) adds a sense of presence without cluttering the experience. The system should run smoothly on modern desktop and mobile browsers.

---

### 2. Goals
- Create **a single, mesmerizing WebGL animation** that feels alive and organic.
- Ensure the animation is **different every time** (seeded randomness).
- Make it **effortlessly beautiful** — no settings required.
- Make it **interactive in a subtle way** (cursor/touch influences particle behavior).
- Deliver a **smooth 60fps experience** on modern hardware.

---

### 3. Non-Goals (MVP)
- No UI controls, menus, or settings panels.
- No multiple animation “modes.”
- No audio-reactive support (could be future).
- No need for server components or backend.

---

### 4. User Stories (MVP)
- **As a viewer**, I want the animation to **start instantly**, so I’m immersed right away.
- **As a viewer**, I want the animation to feel **natural and evolving**, not repetitive or chaotic.
- **As a viewer**, I want to **move my mouse or touch the screen** and see a gentle response.
- **As a viewer**, I never want to feel overwhelmed or distracted by UI.

---

### 5. Core Features & Requirements

#### 5.1 Animation Behavior
- Render a **full-screen particle system** (hundreds–thousands of particles).
- Motion should feel **organic**: flocking, drifting, swirling, or fluid-like.
- Particles follow rules to prevent chaos (e.g., max speed, attraction limits).
- Use **HSL or gradient-based color logic** for pleasant palettes.
- Random seed influences:
  - Color ranges
  - Particle count
  - Movement constants (speed, cohesion, noise strength)

#### 5.2 Interaction
- Mouse/touch creates a **localized attractive or repulsive force**.
- Interaction should be **subtle, not disruptive**.
- No visible pointer or UI element overlays.

#### 5.3 Visual Style
- Clean fullscreen canvas (no borders or controls)
- Motion should feel **calm, dreamy, and organic**, not chaotic
- Avoid harsh flashes or aggressive strobing

---

### 6. Technical Requirements

#### 6.1 Tech Stack
- **Three.js** (WebGL renderer)
- **JavaScript (ES6+)**
- **Vite** for bundling and fast local dev
- Optional noise sources: **Simplex or Perlin noise**

#### 6.2 Performance Targets
- 60fps on modern desktop browsers
- Graceful degradation on mobile (reduce particle count if needed)
- Memory-safe render loop (no leaks)

#### 6.3 Browser Support
- Desktop: Chrome, Safari, Firefox, Edge (latest)
- Mobile Safari + Chrome (fallback = lower density)

---

### 7. Acceptance Criteria
- Page loads and animation begins **within 1 second** on broadband
- Every refresh produces a **visually pleasing but different** animation
- Interaction works on **mouse and touch**
- Animation runs **sustainably (no FPS collapse)**
- No UI elements or visible controls show in MVP

---

### 8. Future Enhancements (Phase 2+)
- Multiple modes (keyboard or button to switch)
- Color/theme presets
- Audio-reactive mode
- Save/share seeded visuals
- Wallpaper / screensaver mode

---

### 9. Risks & Mitigations
| Risk | Mitigation |
|--------|------------|
| Mobile performance dips | Auto-scale particle count |
| Randomness generates “ugly” frames | Set safe min/max constants |
| High-DPI screens stress GPU | Adaptive resolution scaling |

---

### 10. Roadmap
| Phase | Scope | Output |
|---------|--------|---------|
| **MVP (2–4 days)** | Single animation + interaction | Public demo |
| **V1** | Polish visuals, adaptive perf, seed logging | Shareable link |
| **V2** | UI, modes, presets | “Productized” version |

---

### 11. Repo Structure (recommended)
```
/src
  /shaders
  /particles
  main.js
index.html
vite.config.js
README.md
```

---

### 12. Example Pseudocode (Appendix)
```js
// Inside render loop:
for each particle:
  applyNoise()
  applyFlocking()
  applyUserAttraction(mousePosition)
  updatePosition()
renderer.render(scene, camera)
```

---

### 13. Success Metric
The animation should be something a user **wants to leave running** — like art on a wall.

---

### License
**MIT**