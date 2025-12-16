import { clamp } from "./util.js";

export default class UI {
  constructor(sel) {
    this.input = document.querySelector(sel.inputSelector);
    this.startBtn = document.querySelector(sel.startBtn);
    this.scoreEl = document.querySelector(sel.scoreEl);
    this.livesEl = document.querySelector(sel.livesEl);
    this.wpmEl = document.querySelector(sel.wpmEl);
    this.sky = document.querySelector(sel.sky);

    this.words = new Map(); // id -> dom
    this.containerRect = null;

    this.bindEvents();
  }

  bindGame(game) {
    this.game = game;
    // compute word fall limit when game area size known
    const ground = document.getElementById("ground");
    this.containerRect = this.sky.getBoundingClientRect();
    this.limitY = this.containerRect.height - 64 - 24; // ground height + padding

    // wire start button
    this.startBtn.addEventListener("click", () => {
      this.clearWords();
      this.input.value = "";
      this.input.focus();
      game.start();
    });

    // input handling
    this.input.addEventListener("input", (e) => {
      const v = e.target.value.trim();
      if (!v) return;
      // find any active word that matches
      for (const [id, dom] of this.words) {
        if (dom.dataset.word === v) {
          // success
          this.highlight(dom, true);
          this.game.scoreWord(id);
          this.removeWord({ id, word: v, miss: false });
          this.input.value = "";
          break;
        }
      }
    });

    // wire game end callback so UI can show results
    if (this.game) {
      this.game.onEnd = this.showEndModal.bind(this);
    }

    // restart button inside modal
    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.hideEndModal();
        this.clearWords();
        this.input.value = "";
        this.input.focus();
        if (this.game && typeof this.game.start === "function")
          this.game.start();
      });
    }
  }

  bindEvents() {
    // keyboard focus convenience
    document.addEventListener("keydown", (e) => {
      if (e.key.length === 1 || e.key === "Backspace") {
        this.input.focus();
      }
    });
    window.addEventListener("resize", () => {
      this.containerRect = this.sky.getBoundingClientRect();
      this.limitY = this.containerRect.height - 64 - 24;
    });
  }

  updateHUD(state) {
    this.scoreEl.textContent = state.score;
    this.livesEl.textContent = state.lives;
    this.wpmEl.textContent = state.wpm;
  }

  spawnWord({ id, word, x, speed }) {
    const el = document.createElement("div");
    el.className = "word";
    el.textContent = word;
    el.dataset.id = id;
    el.dataset.word = word;
    // compute position
    const container = this.sky;
    const rect = container.getBoundingClientRect();
    const padding = 12;
    // ensure word is fully inside container horizontally: account for element width after it's added
    el.style.left = String(padding) + "px";
    el.style.top = "0px";
    container.appendChild(el);

    // measure element now that it's in the DOM
    const elRect = el.getBoundingClientRect();
    // compute left position clamped so the word doesn't overflow the container
    const maxLeft = Math.max(0, rect.width - elRect.width - padding);
    const computedLeft = Math.floor(
      padding + x * (rect.width - padding * 2 - elRect.width)
    );
    el.style.left = Math.min(maxLeft, Math.max(0, computedLeft)) + "px";

    // store extra data
    const limit = rect.height - 64 - 24 - elRect.height; // ground / padding and account for element height
    this.words.set(id, el);

    // inform game about the visual limit so game logic can remove missed words too
    try {
      if (this.game && this.game.active && this.game.active.get(id)) {
        this.game.active.get(id).limitY = limit;
      }
    } catch (e) {
      // non-fatal if game not yet wired
    }

    // animate using CSS transform via RAF for smooth motion
    const created = performance.now();
    const speedPx = speed; // px per second

    const step = (now) => {
      const t = (now - created) / 1000; // seconds
      const y = t * speedPx;
      // set translateY relative to the top padding of the container so words move from visible top downwards
      el.style.transform = `translateY(${y}px)`;

      // only fade when the word is very close to the ground so it remains readable
      const fadeZone = 80; // px
      const fadeStart = Math.max(0, limit - fadeZone);
      let opacity = 1;
      
      el.style.opacity = String(opacity);

      if (y >= limit) {
        // reached bottom: delegate miss handling to the game so lives/score update centrally
        if (this.game && typeof this.game.removeWord === "function") {
          this.game.removeWord(id, true);
        } else {
          // fallback: remove the DOM node
          if (this.words.has(id)) this.removeWord({ id, word, miss: true });
        }
        return;
      }
      el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  removeWord({ id, word, miss }) {
    const el = this.words.get(id);
    if (!el) return;
    cancelAnimationFrame(el._raf);
    // visual feedback
    el.classList.add(miss ? "bad" : "good");
    el.style.transition = "transform 260ms ease, opacity 260ms ease";
    el.style.transform += " translateY(12px) scale(0.98)";
    el.style.opacity = "0";
    setTimeout(() => {
      el.remove();
    }, 300);
    this.words.delete(id);
  }

  highlight(dom, success) {
    dom.classList.add(success ? "good" : "bad");
    setTimeout(() => dom.classList.remove("good", "bad"), 400);
  }

  clearWords() {
    for (const [id, el] of this.words) {
      cancelAnimationFrame(el._raf);
      el.remove();
    }
    this.words.clear();
  }

  showEndModal(summary) {
    const modal = document.getElementById("endModal");
    if (!modal) return;
    document.getElementById("resultScore").textContent = summary.score ?? 0;
    document.getElementById("resultWpm").textContent = summary.wpm ?? 0;
    document.getElementById("resultWords").textContent = summary.spawned ?? 0;
    modal.classList.remove("hidden");
  }

  hideEndModal() {
    const modal = document.getElementById("endModal");
    if (!modal) return;
    modal.classList.add("hidden");
  }
}
