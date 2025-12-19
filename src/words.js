const WORDS = [
  "apple",
  "banana",
  "orange",
  "grape",
  "melon",
  "keyboard",
  "javascript",
  "module",
  "request",
  "animation",
  "frame",
  "performance",
  "function",
  "variable",
  "constant",
  "array",
  "object",
  "style",
  "layout",
  "accessibility",
  "focus",
  "event",
  "listener",
  "promise",
  "async",
  "await",
  "thread",
  "render",
  "viewport",
  "design",
  "pattern",
  "component",
  "state",
  "score",
  "lives",
  "wpm",
  "typing",
  "speed",
  "race",
  "challenge",
  "practice",
  "effort",
  "skill",
];

export default class Words {
  constructor(list = WORDS) {
    this.list = list.slice();
  }

  random() {
    const i = Math.floor(Math.random() * this.list.length);
    return this.list[i];
  }
}
