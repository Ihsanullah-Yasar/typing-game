# Lets-Type

Lets-Type is a small, polished typing speed-racer game built with vanilla JavaScript and ES modules. Words fall from the top of the screen; type them before they hit the ground.

Features
- No build tools — static, ES module-based project.
- requestAnimationFrame-driven animations.
- Clean, modular code (Game, UI, Words, Utils).
- Accessibility and keyboard-friendly controls.

Run locally
1. Open `index.html` in a modern browser (Chrome, Edge, or Firefox) supporting ES modules.

Development notes
- The entry point is `src/main.js`.
- `src/game.js` contains the game loop and core logic.
- `src/ui.js` renders words and handles user input.

Suggested next steps
- Add unit tests (e.g., with Vitest).
- Add CI workflow, code style (ESLint, Prettier), and TypeScript conversion.
- Expand the word list and difficulty scaling.

License: MIT
