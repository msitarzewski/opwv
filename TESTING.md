# MVP Testing Guide - Organic Particle WebGL Visualizer

**Last Updated**: 2025-10-26
**Version**: MVP-10 (Final Testing & Optimization)
**Status**: Ready for Manual Testing

---

## Overview

This document provides comprehensive testing instructions for verifying all MVP acceptance criteria before production deployment. Since automated browser/device testing is not possible in this environment, manual verification is required.

---

## Quick Reference Checklist

**Production Build Status**:
- ✅ Build successful (822ms)
- ✅ Zero errors
- ✅ Zero warnings
- ✅ Bundle size: 471.79 kB (119.22 kB gzipped)
- ✅ Console cleanup complete (seed logging only)

**Manual Testing Required**:
- [ ] Desktop browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance profiling (memory leaks, CPU usage)
- [ ] Load time verification (< 1 second)
- [ ] Visual quality across different seeds
- [ ] Long-running stability (5+ minutes)

---

## Section 1: Desktop Browser Testing

### 1.1 Chrome Testing

**Setup**:
1. Open Chrome (latest version)
2. Navigate to `http://localhost:3001/` or production URL
3. Open DevTools (F12)
4. Open Console tab

**Tests**:

#### Test 1.1.1: Page Load & Animation Start
- [ ] **Expected**: Page loads in < 1 second (check Network tab)
- [ ] **Expected**: Animation starts immediately (no delay)
- [ ] **Expected**: Console shows seed message: `Seed: [number] (use ?seed=[number] to reproduce this visual)`
- [ ] **Expected**: No console errors or warnings
- [ ] **Actual**: _[Record your findings]_

#### Test 1.1.2: Frame Rate Performance
- [ ] Enable Chrome FPS meter: DevTools → Performance monitor → FPS
- [ ] **Expected**: 60fps sustained for first 30 seconds
- [ ] **Expected**: FPS stays above 50fps consistently
- [ ] **Actual FPS**: _[Record average FPS]_

#### Test 1.1.3: Mouse Interaction
- [ ] Move mouse cursor slowly across canvas
- [ ] **Expected**: Particles gently attracted to cursor position
- [ ] **Expected**: Interaction is subtle (not disruptive)
- [ ] **Expected**: Particles return to normal motion when cursor stops
- [ ] **Actual**: _[Record behavior]_

#### Test 1.1.4: Visual Randomization
- [ ] Refresh page 5 times (Ctrl+R or Cmd+R)
- [ ] **Expected**: Each refresh shows different particle configuration
- [ ] **Expected**: Each refresh shows different color palette
- [ ] **Expected**: All configurations are visually pleasing (no "ugly" frames)
- [ ] **Actual**: _[Record findings]_

#### Test 1.1.5: Seed Reproducibility
- [ ] Note seed from console (e.g., `Seed: 1234567890`)
- [ ] Refresh page
- [ ] Navigate to `http://localhost:3001/?seed=1234567890` (use noted seed)
- [ ] **Expected**: Exact same particle configuration and colors
- [ ] **Actual**: _[Match: Yes/No]_

#### Test 1.1.6: Window Resize
- [ ] Resize browser window to various sizes (small, medium, large)
- [ ] Maximize and restore window
- [ ] **Expected**: Canvas fills viewport at all sizes
- [ ] **Expected**: Animation continues smoothly during resize
- [ ] **Expected**: Particles remain within bounds
- [ ] **Actual**: _[Record behavior]_

---

### 1.2 Safari Testing

**Setup**:
1. Open Safari (latest version)
2. Navigate to test URL
3. Enable Develop menu: Safari → Preferences → Advanced → Show Develop menu
4. Open Web Inspector: Develop → Show Web Inspector

**Tests**:
- [ ] Repeat all Chrome tests (1.1.1 through 1.1.6)
- [ ] Note any Safari-specific issues
- [ ] **Safari FPS**: _[Record average FPS]_
- [ ] **Safari Issues**: _[List any differences from Chrome]_

---

### 1.3 Firefox Testing

**Setup**:
1. Open Firefox (latest version)
2. Navigate to test URL
3. Open Developer Tools (F12)

**Tests**:
- [ ] Repeat all Chrome tests (1.1.1 through 1.1.6)
- [ ] Note any Firefox-specific issues
- [ ] **Firefox FPS**: _[Record average FPS]_
- [ ] **Firefox Issues**: _[List any differences from Chrome]_

---

### 1.4 Edge Testing

**Setup**:
1. Open Edge (latest version)
2. Navigate to test URL
3. Open Developer Tools (F12)

**Tests**:
- [ ] Repeat all Chrome tests (1.1.1 through 1.1.6)
- [ ] Note any Edge-specific issues
- [ ] **Edge FPS**: _[Record average FPS]_
- [ ] **Edge Issues**: _[List any differences from Chrome]_

---

## Section 2: Mobile Device Testing

### 2.1 iOS Safari Testing

**Setup**:
1. Open Safari on iPhone or iPad
2. Navigate to test URL (use local network IP or deployed URL)
3. For debugging: Settings → Safari → Advanced → Web Inspector (connect to Mac)

**Tests**:

#### Test 2.1.1: Touch Interaction
- [ ] Tap and hold on canvas, then drag finger
- [ ] **Expected**: Particles attracted to touch position
- [ ] **Expected**: Interaction is smooth (no lag)
- [ ] **Expected**: No scrolling or zooming occurs
- [ ] **Actual**: _[Record behavior]_

#### Test 2.1.2: Mobile Performance
- [ ] Let animation run for 60 seconds
- [ ] **Expected**: Smooth animation (30-60fps)
- [ ] **Expected**: Adaptive quality may reduce particle count (if FPS < 50)
- [ ] **Expected**: Animation remains visible and pleasant
- [ ] **Expected**: No crashes or freezes
- [ ] **Actual**: _[Record performance]_

#### Test 2.1.3: Screen Rotation
- [ ] Rotate device from portrait to landscape
- [ ] Rotate back to portrait
- [ ] **Expected**: Canvas adjusts to new orientation
- [ ] **Expected**: Animation continues smoothly
- [ ] **Expected**: Particles remain within bounds
- [ ] **Actual**: _[Record behavior]_

#### Test 2.1.4: Mobile Load Time
- [ ] Clear Safari cache: Settings → Safari → Clear History and Website Data
- [ ] Navigate to test URL
- [ ] **Expected**: Page loads and animation starts in < 2 seconds (mobile)
- [ ] **Actual Load Time**: _[Record time]_

---

### 2.2 Android Chrome Testing

**Setup**:
1. Open Chrome on Android device
2. Navigate to test URL
3. For debugging: chrome://inspect on desktop Chrome (USB debugging)

**Tests**:
- [ ] Repeat all iOS tests (2.1.1 through 2.1.4)
- [ ] Note any Android-specific issues
- [ ] **Android Performance**: _[Record findings]_
- [ ] **Android Issues**: _[List any differences from iOS]_

---

## Section 3: Performance Profiling (Chrome DevTools)

### 3.1 Memory Leak Detection

**Setup**:
1. Open Chrome DevTools
2. Navigate to Memory tab
3. Ensure garbage collection icon is visible

**Test Procedure**:

#### Step 1: Baseline Heap Snapshot
- [ ] Click "Take heap snapshot"
- [ ] Note snapshot size: _[Record MB]_

#### Step 2: Run Animation for 5 Minutes
- [ ] Let animation run for 5 minutes
- [ ] Interact with mouse occasionally
- [ ] Refresh page a few times during this period

#### Step 3: Second Heap Snapshot
- [ ] Click garbage collection icon (force GC)
- [ ] Click "Take heap snapshot"
- [ ] Note snapshot size: _[Record MB]_

#### Step 4: Compare Snapshots
- [ ] Select second snapshot
- [ ] Change view to "Comparison"
- [ ] Select first snapshot as baseline
- [ ] **Expected**: Minimal growth in heap size (< 5 MB increase)
- [ ] **Expected**: No continuous growth pattern
- [ ] **Expected**: Three.js objects properly disposed
- [ ] **Actual Heap Growth**: _[Record MB increase]_
- [ ] **Memory Leak Detected**: _[Yes/No]_

---

### 3.2 CPU Profiling

**Setup**:
1. Open Chrome DevTools
2. Navigate to Performance tab

**Test Procedure**:

#### Step 1: Record Performance
- [ ] Click "Record" button
- [ ] Let animation run for 10 seconds
- [ ] Stop recording

#### Step 2: Analyze Flame Chart
- [ ] Examine Main thread activity
- [ ] Identify longest frame times
- [ ] Check for excessive scripting time
- [ ] **Expected**: Frame times consistently < 16.67ms (60fps)
- [ ] **Expected**: No frames > 50ms (major jank)
- [ ] **Actual Average Frame Time**: _[Record ms]_
- [ ] **Actual Longest Frame**: _[Record ms]_

#### Step 3: Identify Bottlenecks
- [ ] Expand "Bottom-Up" tab
- [ ] Sort by "Self Time"
- [ ] Note top 3 functions consuming CPU
- [ ] **Top CPU Consumers**:
  1. _[Function name and time]_
  2. _[Function name and time]_
  3. _[Function name and time]_

---

### 3.3 Frame Timing Analysis

**Setup**:
1. Open Chrome DevTools
2. Enable FPS meter: Performance monitor → FPS

**Test Procedure**:

#### Test 3.3.1: Baseline Performance (500 particles)
- [ ] Record FPS for 30 seconds
- [ ] **Expected FPS**: 60fps ±2fps
- [ ] **Actual FPS**: _[Record]_

#### Test 3.3.2: Stress Test (if possible - modify particle count)
Note: This test requires code modification, skip if not desired.
- [ ] Edit `src/main.js:69` - change `500` to `1000`
- [ ] Rebuild and test
- [ ] Record FPS for 30 seconds
- [ ] **Expected**: FPS drops, adaptive quality kicks in
- [ ] **Expected**: Particle count reduces automatically when FPS < 50
- [ ] **Actual FPS**: _[Record]_
- [ ] **Adaptive Quality Triggered**: _[Yes/No]_

---

## Section 4: PRD Acceptance Criteria Verification

### 4.1 PRD Criteria Checklist

Reference: `prd.md` Section 7 - Acceptance Criteria

| Criterion | Test | Expected | Actual | Pass |
|-----------|------|----------|--------|------|
| **Page loads < 1 second** | Desktop load time (broadband) | < 1 second | _[Record]_ | [ ] |
| **Different animation each refresh** | 5 refreshes, visual comparison | All different, all pleasing | _[Record]_ | [ ] |
| **Mouse & touch interaction** | Desktop mouse + mobile touch | Smooth, subtle attraction | _[Record]_ | [ ] |
| **Sustainable FPS** | 5+ minute run, FPS monitoring | No collapse, stays > 50fps | _[Record]_ | [ ] |
| **No UI elements** | Visual inspection | Clean fullscreen canvas | _[Record]_ | [ ] |

---

### 4.2 Task YAML Acceptance Criteria

Reference: `milestones/mvp/10-testing-optimization.yaml`

| Criterion | Test Method | Status | Notes |
|-----------|-------------|--------|-------|
| Page loads < 1 second | Network tab timing | [ ] | _[Record]_ |
| 60fps on modern desktop | FPS meter, 4 browsers | [ ] | _[Record]_ |
| Graceful mobile performance | iOS + Android testing | [ ] | _[Record]_ |
| Every refresh different & pleasing | Visual verification | [ ] | _[Record]_ |
| Mouse and touch working | Interaction testing | [ ] | _[Record]_ |
| No console errors/warnings | Console inspection | [ ] | _[Record]_ |
| No memory leaks | Heap snapshot comparison | [ ] | _[Record]_ |
| All PRD criteria met | Section 4.1 checklist | [ ] | _[Record]_ |

---

## Section 5: Long-Running Stability Test

### 5.1 Extended Runtime Test

**Test Procedure**:

#### Step 1: Setup Monitoring
- [ ] Open Chrome DevTools
- [ ] Enable Performance monitor: FPS + CPU + Memory
- [ ] Take initial heap snapshot

#### Step 2: Run for 10 Minutes
- [ ] Let animation run for 10 minutes
- [ ] Interact with mouse every 1-2 minutes
- [ ] Monitor FPS, CPU, Memory graphs

#### Step 3: Observations
- [ ] **FPS Stability**: Consistent 60fps? Any degradation? _[Record]_
- [ ] **Memory Stability**: Heap size stable? Continuous growth? _[Record]_
- [ ] **CPU Usage**: Consistent CPU usage? Any spikes? _[Record]_
- [ ] **Visual Quality**: Animation remains smooth? Any artifacts? _[Record]_
- [ ] **Browser Responsiveness**: Browser remains responsive? _[Yes/No]_

#### Step 4: Final Heap Snapshot
- [ ] Force garbage collection
- [ ] Take final heap snapshot
- [ ] Compare with initial snapshot
- [ ] **Expected**: Heap growth < 10 MB over 10 minutes
- [ ] **Actual Heap Growth**: _[Record MB]_

---

## Section 6: Visual Quality Assessment

### 6.1 Seed Testing

Test multiple seeds to ensure visual quality is consistent.

**Test Seeds**: 12345, 67890, 11111, 99999, 55555, 77777, 33333, 44444, 88888, 22222

**For each seed**:
- [ ] Navigate to `?seed=[seed]`
- [ ] Rate visual quality: Beautiful / Good / Acceptable / Ugly
- [ ] Note color palette: Harmonious? Harsh? Muddy?
- [ ] Note particle motion: Calm & dreamy? Chaotic? Stagnant?

**Results**:

| Seed | Visual Quality | Color Palette | Motion Quality | Notes |
|------|----------------|---------------|----------------|-------|
| 12345 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 67890 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 11111 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 99999 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 55555 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 77777 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 33333 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 44444 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 88888 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |
| 22222 | _[Rate]_ | _[Rate]_ | _[Rate]_ | _[Notes]_ |

**Overall Assessment**:
- [ ] **All seeds produce pleasing visuals**: _[Yes/No]_
- [ ] **Any ugly seeds found**: _[List seeds]_
- [ ] **Recommended action**: _[None / Investigate seed X / Adjust palette generation]_

---

## Section 7: Bug Reporting Template

If any bugs are discovered during testing, use this template:

### Bug Report: [Brief Description]

**Severity**: Critical / High / Medium / Low
**Browser/Device**: _[e.g., Chrome 120.0 on macOS]_
**Reproducible**: Always / Sometimes / Rarely

**Steps to Reproduce**:
1. _[Step 1]_
2. _[Step 2]_
3. _[Step 3]_

**Expected Behavior**:
_[What should happen]_

**Actual Behavior**:
_[What actually happens]_

**Screenshots/Videos**:
_[Attach if applicable]_

**Console Errors**:
```
[Paste any console errors here]
```

**Additional Notes**:
_[Any other relevant information]_

---

## Section 8: Production Readiness Sign-Off

### 8.1 Final Checklist

All items must be checked before production deployment:

**Code Quality**:
- [ ] Production build successful (zero errors/warnings)
- [ ] Console cleaned (seed logging only)
- [ ] Bundle size acceptable (< 500 kB total, < 150 kB gzipped)
- [ ] No memory leaks detected

**Cross-Browser Compatibility**:
- [ ] Chrome: Tested, working
- [ ] Safari: Tested, working
- [ ] Firefox: Tested, working
- [ ] Edge: Tested, working

**Mobile Compatibility**:
- [ ] iOS Safari: Tested, working
- [ ] Android Chrome: Tested, working

**Performance**:
- [ ] 60fps sustained on desktop
- [ ] Graceful mobile performance
- [ ] Adaptive quality working
- [ ] No long-term memory growth

**PRD Acceptance Criteria**:
- [ ] All 5 PRD criteria verified (Section 4.1)
- [ ] All 8 task YAML criteria verified (Section 4.2)

**Visual Quality**:
- [ ] Random seeds produce pleasing visuals
- [ ] Color palettes harmonious
- [ ] Motion feels calm and dreamy
- [ ] No "ugly" frames found

**Deployment Readiness**:
- [ ] dist/ folder contains production build
- [ ] index.html, CSS, JS files present
- [ ] Files can be deployed to static hosting
- [ ] Verified on production-like environment (if available)

---

### 8.2 Sign-Off

**Tester Name**: _[Your name]_
**Test Date**: _[YYYY-MM-DD]_
**Test Duration**: _[Hours spent testing]_
**Overall Result**: PASS / CONDITIONAL PASS / FAIL

**Blocker Issues Found**: _[List any critical issues preventing deployment]_

**Non-Blocker Issues Found**: _[List minor issues that can be addressed post-MVP]_

**Recommendation**:
- [ ] **DEPLOY TO PRODUCTION** - All criteria met, no blockers
- [ ] **CONDITIONAL DEPLOY** - Minor issues present, acceptable for MVP
- [ ] **DO NOT DEPLOY** - Critical issues found, requires fixes

**Signature**: _[Sign-off]_
**Date**: _[YYYY-MM-DD]_

---

## Appendix A: Chrome DevTools Reference

### Useful Chrome DevTools Commands

**Performance Monitor** (live metrics):
```
1. Cmd+Shift+P (or Ctrl+Shift+P)
2. Type "Show Performance Monitor"
3. Select metrics: FPS, CPU usage, JS heap size
```

**FPS Meter**:
```
1. DevTools → Settings (gear icon)
2. More tools → Rendering
3. Check "FPS meter"
```

**Heap Snapshot**:
```
1. DevTools → Memory tab
2. Select "Heap snapshot"
3. Click "Take snapshot"
```

**Performance Recording**:
```
1. DevTools → Performance tab
2. Click record button (or Cmd+E)
3. Perform actions
4. Stop recording
```

**Network Timing**:
```
1. DevTools → Network tab
2. Reload page
3. Check "Load" time in bottom status bar
```

---

## Appendix B: Known Limitations

**Expected Behaviors** (not bugs):

1. **Particle count reduction on low-end hardware**: Adaptive quality system automatically reduces particles when FPS < 50. This is expected behavior.

2. **Mobile FPS lower than desktop**: Mobile devices have less GPU power. Target is 30-60fps on mobile, 60fps on desktop.

3. **First frame may be < 60fps**: Initial render may take slightly longer. This is normal for WebGL initialization.

4. **Seed parameter case-sensitive**: URL parameter `?seed=` is lowercase. `?Seed=` will not work.

5. **Touch interaction single-touch only**: Multi-touch is not implemented in MVP. Only first touch point is tracked.

---

## Appendix C: Quick Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Blank screen | Canvas not found | Check console for error, verify index.html |
| FPS < 60 constantly | Weak GPU or many particles | Let adaptive quality reduce count, or reduce initial count |
| No mouse interaction | Event listeners not attached | Check console for errors, verify main.js loaded |
| Same visual every refresh | Seed not randomizing | Check console seed, verify random.js loaded |
| Console errors | Missing dependencies | Run `npm install`, check network tab for 404s |
| Build fails | Syntax error or import issue | Check build output, verify all imports |

---

**End of Testing Guide**

This document should be used as a comprehensive checklist for MVP-10 verification. Complete all sections before production deployment.
