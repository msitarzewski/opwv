# Organic Particle WebGL Visualizer (OPWV)

A mesmerizing, browser-based generative art experience that renders full-screen organic particle animations using WebGL and Three.js. Every load produces a unique, beautiful visual that feels alive and intentional.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-v0.169.0-green.svg)
![Vite](https://img.shields.io/badge/Vite-v5.4.10-purple.svg)

## ✨ Features

- **Generative Beauty**: Every refresh creates a unique, procedurally-generated animation
- **Organic Motion**: Particles exhibit flocking behaviors with natural fluidity
- **Seeded Randomization**: Reproducible visuals via URL parameters (`?seed=12345`)
- **Subtle Interaction**: Mouse and touch create gentle influence without disrupting the experience
- **Adaptive Performance**: Automatically adjusts quality to maintain smooth 60fps
- **Zero Configuration**: Beautiful experience with no settings required

## 🚀 Demo

Open `index.html` in a modern browser or run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to experience the visualization.

### Try Different Seeds

- `?seed=12345` - Specific reproducible animation
- `?seed=67890` - Different color palette and motion
- No parameter - Random seed on each load

## 🎯 Status

**MVP Phase**: ✅ 100% Complete (10/10 tasks)

All core features implemented and production-ready:
- ✅ Three.js rendering pipeline with 60fps baseline
- ✅ Particle system with organic motion (flocking + simplex noise)
- ✅ Seeded randomization for reproducible visuals
- ✅ HSL-based harmonious color palettes
- ✅ Mouse and touch interaction
- ✅ Adaptive quality system
- ✅ Production build optimized (471.79 kB / 119.22 kB gzipped)

**Next**: XR Test milestone (WebXR 360° immersive mode) - 6 tasks planned

## 🛠️ Tech Stack

- **Three.js** v0.169.0 - WebGL rendering and scene management
- **Vite** v5.4.10 - Build tool for fast development and optimized production bundles
- **simplex-noise** v4.0.3 - Organic motion generation
- **JavaScript ES6+** - Modern module-based architecture

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
│   │   ├── ParticleSystem.js    # Main particle management
│   │   ├── Particle.js          # Individual particle class
│   │   └── behaviors.js         # Flocking, noise, attraction
│   ├── utils/
│   │   ├── random.js            # Seeded random utilities
│   │   ├── noise.js             # Simplex noise wrapper
│   │   ├── colors.js            # Palette generation
│   │   └── performance.js       # FPS monitoring
│   └── main.js                  # Entry point, init, animate loop
├── memory-bank/                 # Project documentation
│   ├── projectbrief.md          # Vision and goals
│   ├── systemPatterns.md        # Architecture patterns
│   ├── techContext.md           # Technical stack
│   └── tasks/                   # Task documentation
├── milestones/                  # Milestone task definitions
│   ├── mvp/                     # MVP tasks (completed)
│   └── xr-test/                 # XR Test tasks (planned)
├── index.html                   # Minimal HTML shell
├── package.json
├── vite.config.js
└── prd.md                       # Product Requirements Document
```

## 🎨 How It Works

The visualization combines several techniques to create organic, lifelike motion:

1. **Flocking Behaviors**: Particles follow Craig Reynolds' boids algorithm
   - Cohesion: Move toward nearby particles
   - Alignment: Match velocity with neighbors
   - Separation: Avoid crowding

2. **Simplex Noise**: 3D noise creates natural drift patterns over time

3. **User Interaction**: Mouse/touch creates attraction force with inverse square falloff

4. **Seeded Randomization**: Mulberry32 PRNG ensures reproducible visuals

5. **Adaptive Quality**: FPS monitoring automatically reduces particle count if performance drops

## 🎮 Controls

- **Mouse Movement**: Attracts particles gently
- **Touch**: Same as mouse on mobile devices
- **URL Parameter**: `?seed=12345` for specific animations

## 📊 Performance

- **Target**: 60fps on modern desktop browsers
- **Bundle Size**: 471.79 kB (119.22 kB gzipped)
- **Particle Count**: 500 (adaptive 100-500+ based on performance)
- **Build Time**: ~756ms

### Browser Support

- ✅ Chrome (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## 🧪 Testing

Comprehensive testing guide available in `TESTING.md`:
- Cross-browser testing procedures (88+ test points)
- Mobile device testing
- Performance profiling
- Memory leak detection
- Visual quality assessment

## 🗺️ Roadmap

### ✅ MVP (Complete)
- Single animation mode
- Mouse/touch interaction
- Adaptive performance
- Production-ready build

### ⏳ XR Test (Planned)
- WebXR 360° immersive viewing mode
- Camera at center of spherical particle space
- VR headset support (Meta Quest, Vive, Index)
- No interaction (observation only)

### 🔮 V1 (Future)
- Multiple animation modes
- UI controls and settings panel
- Advanced color/theme presets
- Save/share functionality
- Performance monitoring UI

### 🌟 V2 (Future)
- Audio-reactive mode
- Wallpaper/screensaver mode
- Social sharing integration
- VR controller interaction

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**msitarzewski**
- Email: msitarzewski@gmail.com
- GitHub: [@msitarzewski](https://github.com/msitarzewski)

## 🙏 Acknowledgments

- Three.js community for excellent WebGL abstractions
- Craig Reynolds for boids algorithm
- simplex-noise library maintainers

## 📚 Documentation

Comprehensive project documentation available in `memory-bank/`:
- `projectbrief.md` - Vision and goals
- `systemPatterns.md` - Architecture patterns
- `techContext.md` - Technical decisions
- `tasks/2025-10/README.md` - October 2025 development log

## 🐛 Issues

Found a bug or have a suggestion? Please open an issue on GitHub.

---

**Built with ❤️ using Three.js and modern web technologies**
