# XR Test Milestones

**Phase**: XR-Test (WebXR 360° Proof of Concept)
**Target Duration**: 1-2 days
**Status**: Pending

## Overview
This milestone implements a WebXR-enabled 360° version of the particle visualization. The camera is positioned at the center of a spherical particle space, allowing immersive viewing in VR headsets. This is a test/prototype phase with no interaction - just immersive observation.

## Goals
- Implement WebXR support using Three.js WebXRManager
- Convert 2D particle space to 3D spherical volume
- Enable VR mode with camera at center (0, 0, 0)
- Maintain backward compatibility with existing 2D mode
- Achieve VR-appropriate performance (72fps+ target)

## Milestone Structure
Each YAML file contains:
- **id**: Unique task identifier (xr-##)
- **title**: Clear, descriptive task name
- **phase**: Project phase (XR-Test)
- **priority**: Task priority (critical, high, medium, low)
- **estimated_duration**: Time estimate for completion
- **status**: Current status (pending, in_progress, completed, blocked)
- **description**: Detailed task description
- **acceptance_criteria**: Specific, testable success conditions
- **tasks**: Breakdown of subtasks
- **dependencies**: Task IDs that must be completed first
- **technical_notes**: Implementation details and considerations
- **references**: Links to relevant documentation
- **deliverables**: Expected outputs

## Task Dependency Graph

```
01-webxr-setup
    ↓
02-camera-conversion ← (depends on 01)
    ↓
03-webxr-session ← (depends on 01, 02)
    ↓
04-spherical-particle-space ← (depends on 02, mvp-04, mvp-05)
    ↓
05-vr-render-loop ← (depends on 03, 04, mvp-03)
    ↓
06-testing-optimization (depends on all above)
```

## Task List

### Critical Path
1. **01-webxr-setup.yaml** - WebXR dependencies, device detection, VR entry
2. **02-camera-conversion.yaml** - OrthographicCamera → PerspectiveCamera
3. **03-webxr-session.yaml** - VR session management, enter/exit VR
4. **04-spherical-particle-space.yaml** - 2D plane → 3D spherical particle distribution
5. **05-vr-render-loop.yaml** - Adapt animation loop for WebXR stereo rendering
6. **06-testing-optimization.yaml** - VR device testing, performance optimization

### Parallel Opportunities
- Task 01 can be researched/started independently
- Tasks 02 and 04 can be partially developed in parallel (camera vs space)
- Task 06 testing can begin once 05 is functional

## Estimated Timeline
| Task | Estimated Duration | Cumulative |
|------|-------------------|------------|
| 01 - WebXR Setup | 45min | 0.75hr |
| 02 - Camera Conversion | 1hr | 1.75hr |
| 03 - WebXR Session | 1.5hr | 3.25hr |
| 04 - Spherical Space | 2hr | 5.25hr |
| 05 - VR Render Loop | 1hr | 6.25hr |
| 06 - Testing/Optimization | 2hr | 8.25hr |
| **Total** | **~8.25 hours** | **~1-1.5 days** |

Note: Estimates assume focused development time and VR hardware availability. Actual duration may vary with device testing logistics.

## Progress Tracking
- **Pending**: 6 tasks
- **In Progress**: 0 tasks
- **Completed**: 0 tasks
- **Blocked**: 0 tasks
- **Status**: ⏳ **Not Started**

### Pending Tasks
- ⏳ **xr-01**: WebXR Setup and Dependencies
- ⏳ **xr-02**: Camera System Conversion
- ⏳ **xr-03**: WebXR Session Management
- ⏳ **xr-04**: 360° Spherical Particle Space
- ⏳ **xr-05**: VR Rendering Loop
- ⏳ **xr-06**: XR Testing and Optimization

## Technical Approach

### WebXR Integration Strategy
- Use Three.js built-in WebXRManager (no external libraries needed)
- VR mode triggered via URL parameter (?mode=vr) or VR button
- Graceful degradation: WebXR not available → show message/hide VR button
- Maintain separate code paths for 2D and VR modes

### Camera Strategy
- **2D Mode**: OrthographicCamera (existing, unchanged)
- **VR Mode**: PerspectiveCamera at origin with 90-100° FOV
- Camera switching based on active mode
- VR camera handles stereo rendering automatically via WebXRManager

### Particle Space Adaptation
- **2D Mode**: Particles in rectangular bounds (existing)
- **VR Mode**: Particles in spherical volume (radius 5-20 units from origin)
- Spherical boundary wrapping (distance > maxRadius → wrap to opposite side)
- Increased particle count for 360° coverage (500 → 1000+)

### Performance Considerations
- VR target: 72fps minimum (Quest), 90fps ideal (desktop VR)
- Adaptive quality: reduce particles if FPS < 75 in VR mode
- Particle count may need aggressive reduction for mobile VR
- O(n²) flocking performance may require optimization (spatial partitioning)

## Getting Started
1. Ensure MVP phase complete (all 10 MVP tasks)
2. Begin with `01-webxr-setup.yaml` (research + dependencies)
3. Follow dependency chain in order
4. Mark tasks as `in_progress` when started
5. Update status to `completed` when all acceptance criteria met
6. Test on VR hardware at each major milestone

## Hardware Requirements

### Development
- Desktop browser with WebXR support (Chrome, Edge)
- VR headset (Meta Quest 2/3, HTC Vive, Valve Index, etc.)
- HTTPS server or localhost (WebXR requirement)

### Testing
- Meta Quest 2 or 3 (built-in browser supports WebXR)
- Desktop VR headset with SteamVR or Oculus runtime
- Mobile phone for magic window mode testing (optional)

## References
- [Three.js WebXR Documentation](https://threejs.org/docs/#api/en/renderers/webxr/WebXRManager)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Three.js WebXR Examples](https://threejs.org/examples/?q=webxr)
- [memory-bank/](../../memory-bank/) - Project architecture and patterns
- [milestones/mvp/](../mvp/) - Foundation implementation (completed)
- [CLAUDE.md](../../CLAUDE.md) - Development workflow

## Non-Goals (XR Test Phase)
- ❌ VR controller interaction (deferred)
- ❌ Hand tracking (deferred)
- ❌ Teleportation/movement (stationary viewer only)
- ❌ UI panels in VR space (no settings in XR Test)
- ❌ Multiplayer/shared VR sessions
- ❌ Audio-reactive VR mode
- ❌ Room-scale tracking (viewer reference space only)

## Success Criteria
- [ ] VR mode accessible via URL parameter or button
- [ ] Camera positioned at center of 360° particle space
- [ ] Particles visible in all directions
- [ ] Stereo rendering working (left/right eye views)
- [ ] Frame rate ≥ 72fps on target VR hardware
- [ ] Graceful fallback for non-VR browsers
- [ ] 2D mode unaffected (no regressions)
- [ ] Organic motion behaviors work in 3D space
- [ ] VR session enter/exit working smoothly

## Notes
- XR Test is a proof of concept - production polish deferred to later phases
- Focus on core immersive experience, not feature completeness
- Maintain backward compatibility with 2D mode at all times
- VR testing requires physical VR hardware access
- Performance optimization critical for VR comfort (avoid motion sickness)
