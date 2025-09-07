import Game from './game.js';
import UI from './ui.js';

const ui = new UI({
  inputSelector: '#input',
  startBtn: '#startBtn',
  scoreEl: '#score',
  livesEl: '#lives',
  wpmEl: '#wpm',
  sky: '#sky',
});

const game = new Game({
  onState: ui.updateHUD.bind(ui),
  onSpawn: ui.spawnWord.bind(ui),
  onRemove: ui.removeWord.bind(ui),
});

ui.bindGame(game);

// Expose for debugging in dev console
window.LetsType = { game, ui };
