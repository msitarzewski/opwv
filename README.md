# Organic Particle WebGL Visualizer (OPWV)

An immersive WebXR experience featuring 360° organic particle animations in virtual reality. Explore seven unique environments with distinct physics systems, from flocking behaviors to orbital mechanics, using Vision Pro spatial UI and hand tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-v0.169.0-green.svg)
![Vite](https://img.shields.io/badge/Vite-v5.4.10-purple.svg)
![WebXR](https://img.shields.io/badge/WebXR-Immersive-orange.svg)

## ✨ Features

### VR Experience
- **WebXR Immersive Mode**: Full 360° VR experience with hand tracking support
- **Vision Pro Spatial UI**: Floating glassmorphic cards with gaze-based selection and hand gestures
- **Seven Unique Environments**: Each with distinct physics and visual styles
  - **Sphere**: Classic flocking behaviors with organic motion
  - **Nebula**: Brownian motion with large, glowing particles
  - **Galaxy**: Orbital mechanics with Newtonian gravity
  - **Lattice**: Spring physics with breathing grid structure
  - **Vortex**: Flow field creating centripetal tornado motion
  - **Ocean**: Wave equation with sine wave propagation
  - **Hypercube**: 4D rotation with tesseract projection
- **Speed Control**: Adjust animation speed (0.25x-2.0x) for productivity or meditation
- **Persistent Settings**: Speed preferences saved across sessions

### Visual Quality
- **Generative Beauty**: Unique, procedurally-generated animations
- **Seeded Randomization**: Reproducible visuals via URL parameters (`?seed=12345`)
- **Harmonious Color Palettes**: HSL-based analogous color schemes
- **Adaptive Performance**: Maintains smooth 72fps in VR (60fps fallback)
- **1000 Particles**: Distributed in spherical space for immersive viewing

## 🚀 Demo

**Requirements**: WebXR-compatible VR headset (Meta Quest, Vision Pro, Vive, Index, etc.)

```bash
npm install
npm run dev
```

Visit the local server URL in your VR browser or use a tunneling service (ngrok, cloudflared) for device testing.

### Try Different Seeds

- `?seed=12345` - Specific reproducible environment colors
- `?seed=67890` - Different color palette
- No parameter - Random seed on each load

### VR Controls

- **Gaze Selection**: Look at environment cards and dwell for 0.8s to select
- **Hand Gestures** (Vision Pro): Pinch-and-drag on speed slider
- **Controller Input**: Point and trigger on UI elements
- **UI Toggle**: Look down to see floating orb, select to show/hide environment menu

## 🎯 Status

**VR Environments Milestone**: ⏳ 62.5% Complete (5/8 tasks)

Completed:
- ✅ MVP Phase (10/10 tasks) - Core particle system and rendering
- ✅ XR Test Milestone (6/6 tasks) - WebXR 360° immersive mode
- ✅ VR-01: Environment System Architecture
- ✅ VR-02: VR-Only Migration (removed 2D mode)
- ✅ VR-03: Spatial UI Framework (Vision Pro hand tracking)
- ✅ VR-04: Speed Control System (0.25x-2.0x range)
- ✅ VR-05: Environment Presets (7 unique physics systems)

In Progress:
- ⏳ VR-06: Landing Page (1.25hr remaining)
- ⏳ VR-07: Environment Transitions (2.25hr remaining)
- ⏳ VR-08: Testing and Optimization (2.75hr remaining)

**Bundle Size**: 617.72 kB (158.13 kB gzipped)

## 🛠️ Tech Stack

- **Three.js** v0.169.0 - WebGL rendering, scene management, WebXR integration
- **WebXR API** - Immersive VR sessions with hand tracking
- **XRHandModelFactory** - Vision Pro hand mesh rendering
- **Vite** v5.4.10 - Build tool for fast development and optimized production bundles
- **simplex-noise** v4.0.3 - Organic motion and noise field generation
- **JavaScript ES6+** - Modern module-based architecture with async imports

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/msitarzewski/opwv.git
cd opwv

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
opwv/
├── src/
│   ├── particles/
│   │   ├── ParticleSystem.js    # Multi-mode particle management
│   │   ├── Particle.js          # Individual particle class
│   │   └── behaviors/           # Physics behavior modules
│   │       ├── flocking.js      # Cohesion, alignment, separation
│   │       ├── brownian.js      # Random walk motion
│   │       ├── orbital.js       # Newtonian gravity simulation
│   │       ├── spring.js        # Hooke's law spring physics
│   │       ├── flow.js          # Flow field dynamics
│   │       ├── wave.js          # Sine wave propagation
│   │       └── rotation.js      # 4D tesseract rotation
│   ├── environments/
│   │   ├── Environment.js       # Environment configuration schema
│   │   ├── EnvironmentManager.js # Multi-environment orchestration
│   │   └── presets/             # Environment preset definitions
│   │       ├── sphere.js        # Classic flocking
│   │       ├── nebula.js        # Brownian motion
│   │       ├── galaxy.js        # Orbital mechanics
│   │       ├── lattice.js       # Spring physics grid
│   │       ├── vortex.js        # Flow field tornado
│   │       ├── ocean.js         # Wave equation
│   │       └── hypercube.js     # 4D rotation
│   ├── ui/
│   │   ├── SpatialUI.js         # Main UI manager
│   │   ├── EnvironmentCard.js   # Environment selection cards
│   │   ├── SpeedControlPanel.js # Speed adjustment interface
│   │   ├── UIToggleOrb.js       # Floating UI toggle button
│   │   ├── GazeController.js    # Gaze-based interaction
│   │   ├── GazeCursor.js        # Visual reticle feedback
│   │   └── ControllerInput.js   # Hand/controller input handler
│   ├── utils/
│   │   ├── random.js            # Seeded random utilities
│   │   ├── noise.js             # 3D simplex noise wrapper
│   │   ├── colors.js            # HSL palette generation
│   │   ├── performance.js       # VR FPS monitoring
│   │   ├── webxr.js             # WebXR detection utilities
│   │   └── SpeedControl.js      # Speed state management
│   └── main.js                  # Entry point, VR session, render loop
├── memory-bank/                 # Project documentation
│   ├── projectbrief.md          # Vision and goals
│   ├── systemPatterns.md        # Architecture patterns
│   ├── techContext.md           # Technical stack
│   └── tasks/                   # Task documentation
├── milestones/                  # Milestone task definitions
│   ├── mvp/                     # MVP tasks (completed)
│   ├── xr-test/                 # XR Test tasks (completed)
│   └── vr-environments/         # VR Environments tasks (in progress)
├── index.html                   # Minimal HTML shell with WebXR
├── package.json
├── vite.config.js
└── prd.md                       # Product Requirements Document
```

## 🎨 How It Works

The VR experience combines multiple systems to create an immersive particle environment:

### Environment System
Each of the seven environments uses a unique physics simulation:

1. **Sphere (Flocking)**: Craig Reynolds' boids algorithm
   - Cohesion: Move toward nearby particles
   - Alignment: Match velocity with neighbors
   - Separation: Avoid crowding
   - Simplex noise for organic drift

2. **Nebula (Brownian)**: Random walk motion with momentum damping

3. **Galaxy (Orbital)**: Newtonian gravity (F = GMm/r²) around central mass

4. **Lattice (Spring)**: Hooke's law spring physics on 9×9×9 grid

5. **Vortex (Flow)**: Centripetal force field with upward spiral

6. **Ocean (Wave)**: Sine wave equation with phase propagation

7. **Hypercube (4D Rotation)**: Tesseract projection with rainbow spectrum

### Spatial UI Framework
- **Vision Pro Hand Tracking**: XRHandModelFactory renders hand meshes
- **Gaze Controller**: Camera raycasting with 0.8s dwell timer
- **Controller Input**: WebXR hand/controller support with haptic feedback
- **Canvas-Based Cards**: 512×683px glassmorphic UI elements
- **Arc Layout**: UI arranged in 120° arc at 3.5 units distance

### Technical Features
- **Speed Control**: Smooth lerping (0.3s) between speed multipliers
- **localStorage Persistence**: Settings saved across sessions
- **Adaptive Performance**: Particle count reduces if FPS drops below target
- **Seeded Randomization**: Mulberry32 PRNG for reproducible palettes
- **Code Splitting**: Dynamic imports for environment presets

## 🎮 Controls

### VR Interaction
- **Gaze Selection**: Look at UI elements and dwell for 0.8s (progress ring shows timing)
- **Hand Pinch** (Vision Pro): Pinch-and-drag on speed slider for continuous adjustment
- **Controller Trigger**: Point and trigger on environment cards or speed controls
- **UI Toggle Orb**: Look down to see floating orb, select to show/hide environment menu

### URL Parameters
- `?seed=12345` - Specific reproducible color palette

## 📊 Performance

- **VR Target**: 72fps (Meta Quest, Vision Pro native framerate)
- **Fallback Target**: 60fps for other VR headsets
- **Bundle Size**: 617.72 kB (158.13 kB gzipped)
- **Particle Count**: 1000 in spherical space (adaptive 100-1000+ based on performance)
- **Build Time**: ~800ms
- **Code Splitting**: Environment presets loaded dynamically (0.58-2.5 kB per preset)

### WebXR Browser Support

**Desktop VR** (via VR headset browser or link):
- ✅ Chrome (latest) - Meta Quest, SteamVR
- ✅ Edge (latest) - Windows Mixed Reality, SteamVR
- ✅ Firefox Reality - Limited support

**Standalone VR**:
- ✅ Meta Quest Browser (Quest 2, Quest 3, Quest Pro)
- ✅ Vision Pro Safari (visionOS)
- ✅ Pico Browser (Pico 4, Pico Neo)

**Requirements**:
- WebXR Device API support
- `immersive-vr` session mode
- Optional: `hand-tracking` feature for Vision Pro gestures

## 🧪 Testing

Comprehensive testing guides available:
- `TESTING.md` - Original 2D mode testing (88+ test points)
- `TESTING-XR.md` - VR-specific testing procedures (849 lines)
  - WebXR session lifecycle testing
  - Vision Pro hand tracking verification
  - Environment switching validation
  - Speed control interaction testing
  - Performance profiling in VR
  - Cross-headset compatibility

## 🗺️ Roadmap

### ✅ MVP Phase (Complete)
- Three.js particle system with organic motion
- Seeded randomization and color palettes
- Adaptive performance system
- Production-ready build

### ✅ XR Test Milestone (Complete)
- WebXR 360° immersive viewing mode
- Spherical particle space (1000 particles)
- VR headset support (Meta Quest, Vision Pro, SteamVR)
- VR rendering loop with timestamp-based delta

### ⏳ VR Environments (In Progress - 62.5% Complete)
- ✅ Environment system architecture
- ✅ VR-only migration (removed 2D mode)
- ✅ Vision Pro spatial UI with hand tracking
- ✅ Speed control system (0.25x-2.0x)
- ✅ Seven environment presets with unique physics
- ⏳ Landing page for non-VR browsers
- ⏳ Smooth environment transitions
- ⏳ Final testing and optimization

### 🔮 V1.1 (Future)
- Custom environment editor
- Particle parameter tuning UI
- Audio-reactive mode
- Export/share environment configurations
- Social features (leaderboards, challenges)

### 🌟 V2.0 (Future)
- Multiplayer shared VR spaces
- Hand gesture particle manipulation
- Procedural environment generation
- VR meditation/productivity modes
- Integration with productivity tools

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**msitarzewski**
- Email: msitarzewski@gmail.com
- GitHub: [@msitarzewski](https://github.com/msitarzewski)

## 🙏 Acknowledgments

- **Three.js community** for excellent WebGL and WebXR abstractions
- **Craig Reynolds** for boids flocking algorithm
- **simplex-noise** library maintainers for organic motion
- **WebXR Device API** specification authors
- **Vision Pro** team for spatial computing innovations
- **Mind's Eye (1990)** for aesthetic inspiration

## 📚 Documentation

Comprehensive project documentation available in `memory-bank/`:
- `projectbrief.md` - Vision and goals
- `systemPatterns.md` - Architecture patterns
- `techContext.md` - Technical decisions and trade-offs
- `progress.md` - Current status and completed milestones
- `activeContext.md` - Current sprint focus
- `tasks/2025-10/README.md` - October 2025 development log (31 tasks documented)

## 🐛 Issues

Found a bug or have a suggestion? Please open an issue on GitHub.

## 🌐 Links

- **Repository**: https://github.com/msitarzewski/opwv
- **Issues**: https://github.com/msitarzewski/opwv/issues
- **WebXR Spec**: https://www.w3.org/TR/webxr/

---

**Built with ❤️ using Three.js, WebXR, and Vision Pro spatial computing**
