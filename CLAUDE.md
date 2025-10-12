# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**orbi-battle** is a 2D circular arena auto-battle simulator built with TypeScript, Phaser, and Vitest. The project implements a **pre-simulation architecture** where battles are fully computed upfront and then replayed for visualization, enabling deterministic gameplay, easy debugging, and potential server-side verification.

## Development Commands

### Setup
```bash
npm install
npm run dev  # Start dev server at http://localhost:5173
```

### Testing
```bash
npm test                  # Run all tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report (output: coverage/index.html)
npx vitest <test-file>   # Run specific test file
npx vitest --watch       # Run tests in watch mode
```

### Build
```bash
npm run build    # Build for production (output: dist/)
npm run preview  # Preview production build
```

## Architecture

### Layer Separation (Critical Design Principle)

The codebase is strictly divided into three independent layers:

```
┌─────────────────────────────────────┐
│    UI Layer (src/ui/)               │  ← Debug panel, HTML/CSS
├─────────────────────────────────────┤
│    Rendering Layer (src/render/)    │  ← Phaser visualization
├─────────────────────────────────────┤
│    Simulation Layer (src/sim/)      │  ← Pure logic, no dependencies
├─────────────────────────────────────┤
│    Config & Types (src/config/)     │  ← Shared types and defaults
└─────────────────────────────────────┘
```

**Key Constraint**: The simulation layer ([src/sim/](src/sim/)) must remain completely independent of rendering and UI. It can run on Node.js, in tests, or on a server without any browser dependencies.

### Pre-Simulation Architecture

Battles follow this execution flow:

1. **Simulation Phase** ([src/sim/battle.ts](src/sim/battle.ts)):
   - `simulateBattle(config)` computes the entire battle upfront
   - [src/sim/engine.ts](src/sim/engine.ts) runs frame-by-frame updates (default 60Hz)
   - Returns a `BattleLog` containing all frames

2. **Replay Phase** ([src/sim/battle.ts](src/sim/battle.ts)):
   - `BattleSim` class handles fixed-timestep playback
   - Independent of rendering frame rate
   - Enables pause, fast-forward, rewind (future)

3. **Rendering** ([src/render/phaserScene.ts](src/render/phaserScene.ts)):
   - `BattleScene.update()` fetches current frame from `BattleSim`
   - Draws fighters and arena based on `BattleState`
   - No game logic—pure visualization

### Core Data Flow

**Initialization**:
```
main.ts → Phaser.Game → BattleScene.create()
                      → createDebugPanel()
                      → window.$orbi API
```

**Reset/Restart**:
```
DebugPanel [Restart] → window.$orbi.reset(config)
                     → BattleScene.reset()
                     → BattleSim.reset()
                     → simulateBattle() [recompute all frames]
```

**Per-Frame Rendering**:
```
requestAnimationFrame → BattleScene.update(delta)
                      → BattleSim.fixedUpdate(dt)
                      → BattleLog.frames[index]
                      → renderState()
```

## Key Files and Their Roles

### Simulation Layer ([src/sim/](src/sim/))
- **[types.ts](src/sim/types.ts)**: Core type definitions (`BattleConfig`, `BattleState`, `FighterState`, `Vec2`)
- **[engine.ts](src/sim/engine.ts)**: Game logic (movement, combat, collision, win conditions)
- **[battle.ts](src/sim/battle.ts)**: `simulateBattle()` function and `BattleSim` replay class
- **[rng.ts](src/sim/rng.ts)**: Seedable random number generator for determinism
- **[log.ts](src/sim/log.ts)**: `BattleLog` type and deep clone utilities
- **[fighter.ts](src/sim/fighter.ts)**: Reserved for future AI extension

### Rendering Layer ([src/render/](src/render/))
- **[phaserScene.ts](src/render/phaserScene.ts)**: Phaser scene that visualizes `BattleState`

### UI Layer ([src/ui/](src/ui/))
- **[debugPanel.ts](src/ui/debugPanel.ts)**: HTML panel for adjusting battle parameters; exposes `window.$orbi.reset()`

### Entry Point
- **[main.ts](src/main.ts)**: Initializes Phaser game and debug panel

### Configuration
- **[defaults.ts](src/config/defaults.ts)**: Default battle parameters (`defaults`, `defaults3v3`)

## Testing Philosophy

- **79 tests** with **96% coverage** on core simulation logic
- Simulation layer is fully unit tested (no mocks needed)
- Rendering layer tested via type checks and manual verification (Canvas API not testable in happy-dom)
- All tests use Vitest with happy-dom environment

**Coverage highlights**:
- [src/sim/log.ts](src/sim/log.ts), [src/sim/rng.ts](src/sim/rng.ts), [src/ui/debugPanel.ts](src/ui/debugPanel.ts): 100%
- [src/sim/engine.ts](src/sim/engine.ts): 96.15%
- [src/sim/battle.ts](src/sim/battle.ts): 95.52%

## Development Patterns

### Deterministic Behavior
All simulations are deterministic based on `seed` in `BattleConfig`. Same seed + same config = same outcome. This is critical for:
- Replay consistency
- Server-side verification
- Debugging

### Immutability Assumptions
- `BattleConfig` and `BattleLog` are treated as immutable once created
- Use `cloneConfig()` and `cloneState()` from [src/sim/log.ts](src/sim/log.ts) when deep copies are needed
- Engine updates state in-place during simulation, but frames are cloned before being stored in logs

### Fixed Timestep
- Game logic runs at `tickRate` (default 60Hz)
- Rendering can run at different FPS without affecting simulation
- `BattleSim.fixedUpdate(dt)` accumulates time and advances frames when threshold is reached

### Type Safety
- All APIs have explicit TypeScript types
- No `any` types in simulation logic
- `window.$orbi` currently uses `@ts-expect-error` but could be typed via global declaration in future

## Extension Points

### Adding New Fighter AI
Modify [src/sim/engine.ts](src/sim/engine.ts) `stepFighter()` method or create AI strategy pattern in [src/sim/fighter.ts](src/sim/fighter.ts).

### Adding Visual Effects
Extend [src/render/phaserScene.ts](src/render/phaserScene.ts) without touching simulation layer. Effects should be purely cosmetic.

### Server-Side Integration
Export `simulateBattle()` to Node.js environment. Send `BattleLog` to client for replay. Server can validate client-submitted logs by re-running simulation with same config/seed.

### Team/Fighter Configuration
Currently supports multiple teams with multiple fighters each. Teams are defined in `BattleConfig.teams[]`. Each team has an `id` and array of `FighterParams`. Initial placement is automatically calculated in circular sectors.

## Important Constraints

- **Never add rendering/DOM dependencies to [src/sim/](src/sim/)** - it must remain Node.js compatible
- **Maintain determinism** - avoid `Math.random()`, `Date.now()`, or any non-deterministic APIs in simulation
- **Maximum battle duration**: 60 seconds (configurable in `simulateBattle` options)
- **Fixed update rate**: `tickRate` defines simulation granularity (default 60Hz)
- **Japanese comments**: This project uses Japanese for comments and documentation

## Documentation

Comprehensive design docs are in [docs/design/](docs/design/):
- [architecture.md](docs/design/architecture.md): Layer structure, data flow, extension points
- [system.md](docs/design/system.md): System-wide component interactions
- [simulation.md](docs/design/simulation.md): AI logic and determinism details

Development guides in [docs/dev/](docs/dev/):
- [tests.md](docs/dev/tests.md): Testing guide with coverage details
- [roadmap.md](docs/dev/roadmap.md): Future development phases
- [next-steps.md](docs/dev/next-steps.md): Immediate actionable tasks

## GitHub Actions

- Deploys to GitHub Pages on push to `main` branch
- Runs `npm ci`, `npm run build`, uploads `dist/` folder
- Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
