import Words from './words.js';

const DEFAULTS = {
  spawnInterval: 900,
  fallSpeed: 90, // px per second baseline
  lives: 3,
  totalWords: null, // null = infinite
};

export default class Game {
  constructor(opts = {}){
    this.opts = { ...DEFAULTS, ...opts };
    this.words = new Words();
    this.active = new Map(); // id -> {word, x, y, speed, created}
    this.lastSpawn = 0;
    this.score = 0;
    this.lives = this.opts.lives;
    this.typedChars = 0;
    this.startedAt = null;
    this.running = false;
  this.spawnedCount = 0;
  this.spawnFinished = false; // true when totalWords reached

    this.onState = opts.onState || function(){};
    this.onSpawn = opts.onSpawn || function(){};
    this.onRemove = opts.onRemove || function(){};

    this.raf = null;
  }

  start(){
    this.reset();
    this.running = true;
    this.startedAt = performance.now();
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame.bind(this));
    this.onState(this.state());
  }

  stop(){
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = null;
    this.onState(this.state());
  }

  reset(){
    this.active.clear();
    this.score = 0;
    this.lives = this.opts.lives;
    this.typedChars = 0;
    this.startedAt = null;
  this.spawnedCount = 0;
  this.spawnFinished = false;
  }

  state(){
    return { score: this.score, lives: this.lives, wpm: this.calculateWpm() };
  }

  calculateWpm(){
    if(!this.startedAt) return 0;
    const minutes = Math.max(0.01, (performance.now() - this.startedAt)/60000);
    // 5 chars per word standard
    return Math.round((this.typedChars/5) / minutes);
  }

  frame(now){
    const dt = Math.min(200, now - this.lastFrame) / 1000; // seconds
    this.lastFrame = now;

    // spawn logic
    this.lastSpawn += dt * 1000;
    if(!this.spawnFinished && this.lastSpawn > this.opts.spawnInterval){
      this.lastSpawn = 0;
      this.spawnWord();
    }

    // update positions
    const toRemove = [];
    for(const [id, item] of this.active){
      item.y += item.speed * dt;
      if(item.y > item.limitY){
        toRemove.push({ id, miss: true });
      }
    }

    // notify remove after loop to avoid iterator mutation
    for(const r of toRemove){
      this.removeWord(r.id, r.miss);
    }

    // if we've finished spawning and there are no active words, end the game
    if(this.spawnFinished && this.active.size === 0){
      this.end();
      return;
    }

    if(this.running) this.raf = requestAnimationFrame(this.frame.bind(this));
  }

  spawnWord(){
    const word = this.words.random();
    const id = crypto.randomUUID();
    // layout depends on container width; caller provides limitY later via onSpawn
    const speed = this.opts.fallSpeed + Math.random()*40; // px/s
    const item = { id, word, x: Math.random(), y: 0, speed, created: performance.now() };
    this.active.set(id, item);
    this.onSpawn({ id, word, x: item.x, speed });
    this.spawnedCount += 1;
    // if we have a totalWords limit, stop spawning after reaching it
    if(Number.isFinite(this.opts.totalWords) && this.spawnedCount >= this.opts.totalWords){
      this.spawnFinished = true;
    }
    this.onState(this.state());
  }

  removeWord(id, miss = false){
    const item = this.active.get(id);
    if(!item) return;
    this.active.delete(id);
    if(miss){
      this.lives -= 1;
      this.onState(this.state());
      if(this.lives <= 0){
        // game over by lives: end immediately
        this.end();
        return;
      }
    }
    this.onRemove({ id, word: item.word, miss });
    // if spawn finished and no active words left, end the game
    if(this.spawnFinished && this.active.size === 0){
      this.end();
    }
  }

  end(){
    // stop RAF and mark not running
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = null;
    // call onEnd with summary
    const summary = { score: this.score, lives: this.lives, wpm: this.calculateWpm(), spawned: this.spawnedCount };
    if(typeof this.onEnd === 'function') this.onEnd(summary);
    this.onState(this.state());
  }

  // Called when player types a word correctly
  scoreWord(id){
    const item = this.active.get(id);
    if(!item) return false;
    this.score += Math.max(1, item.word.length);
    this.typedChars += item.word.length;
    this.active.delete(id);
    this.onRemove({ id, word: item.word, miss: false });
    this.onState(this.state());
    return true;
  }
}
