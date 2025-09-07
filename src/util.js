export function clamp(v, a, b){
  return Math.max(a, Math.min(b, v));
}

export function debounce(fn, wait=100){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), wait);
  }
}
