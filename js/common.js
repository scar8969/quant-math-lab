'use strict';
/* Quant Math Lab — shared math + canvas helpers (vanilla JS, zero deps) */
window.Q = (function(){
  const Q = {};

  /* ---------- RNG ---------- */
  Q.rng = function(seed){ let s = (seed >>> 0) || 12345;
    return function(){ s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  Q.gauss = function(rnd){
    let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ---------- stats ---------- */
  Q.erf = function(x){
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y; };
  Q.normCdf = function(x, mu, sigma){ mu = mu || 0; sigma = sigma || 1; return 0.5 * (1 + Q.erf((x - mu) / (sigma * Math.SQRT2))); };
  Q.normPdf = function(x, mu, sigma){ mu = mu || 0; sigma = sigma || 1; return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)); };
  Q.mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  Q.var = function(a){ const m = Q.mean(a); return Q.mean(a.map(x => (x - m) ** 2)); };
  Q.std = a => Math.sqrt(Q.var(a));
  Q.corr = function(xs, ys){ const mx = Q.mean(xs), my = Q.mean(ys);
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++){ num += (xs[i]-mx)*(ys[i]-my); dx += (xs[i]-mx)**2; dy += (ys[i]-my)**2; }
    return num / Math.sqrt(dx * dy); };

  /* ---------- linear algebra ---------- */
  Q.matVec = function(A, v){ const n = A.length, out = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < A[i].length; j++) out[i] += A[i][j] * v[j];
    return out; };
  Q.matMul = function(A, B){ const n = A.length, m = B[0].length, p = B.length;
    const C = Array.from({length:n}, () => new Array(m).fill(0));
    for (let i = 0; i < n; i++) for (let k = 0; k < p; k++) for (let j = 0; j < m; j++) C[i][j] += A[i][k]*B[k][j];
    return C; };
  Q.eig2 = function(a, b, c, d){ // [[a,b],[c,d]] -> [{val, vec}...] sorted desc by |val|
    const tr = a + d, det = a*d - b*c;
    const disc = Math.max(0, tr*tr - 4*det), sq = Math.sqrt(disc);
    const l1 = (tr + sq)/2, l2 = (tr - sq)/2;
    const vec = l => {
      if (Math.abs(b) > 1e-9) return [b, l - a];
      if (Math.abs(c) > 1e-9) return [l - d, c];
      return [1, 0]; };
    const norm = v => { const n = Math.hypot(v[0], v[1]); return n > 1e-12 ? [v[0]/n, v[1]/n] : [1, 0]; };
    let e = [{val:l1, vec:norm(vec(l1))}, {val:l2, vec:norm(vec(l2))}];
    e.sort((x, y) => Math.abs(y.val) - Math.abs(x.val));
    return e; };
  Q.powerIter = function(P, maxIter, tol){ // row-stochastic P, row-vector: pi = pi * P
    const n = P.length; let pi = new Array(n).fill(1/n);
    maxIter = maxIter || 5000; tol = tol || 1e-14;
    for (let it = 0; it < maxIter; it++){
      const next = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) next[j] += pi[i] * P[i][j];
      let diff = 0; for (let j = 0; j < n; j++) diff = Math.max(diff, Math.abs(next[j] - pi[j]));
      pi = next; if (diff < tol) break; }
    return pi; };
  Q.cholesky = function(A){ // A symmetric PD -> L with A = L L^T
    const n = A.length, L = Array.from({length:n}, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++){
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = (i === j) ? Math.sqrt(Math.max(1e-12, s)) : s / L[j][j]; }
    return L; };
  Q.solveChol = function(L, b){ // solve L L^T x = b
    const n = b.length, y = new Array(n);
    for (let i = 0; i < n; i++){ let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k]*y[k]; y[i] = s / L[i][i]; }
    const x = new Array(n);
    for (let i = n-1; i >= 0; i--){ let s = y[i]; for (let k = i+1; k < n; k++) s -= L[k][i]*x[k]; x[i] = s / L[i][i]; }
    return x; };
  Q.solveForward = function(L, b){ // solve L z = b (forward substitution, L lower-triangular)
    const n = b.length, z = new Array(n);
    for (let i = 0; i < n; i++){ let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k]*z[k]; z[i] = s / L[i][i]; }
    return z; };

  /* ---------- canvas helpers ---------- */
  Q.canvas = function(id, w, h){
    const cv = document.getElementById(id);
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx; };
  Q.clear = (ctx, w, h, color) => { ctx.fillStyle = color || '#FFFFFF'; ctx.fillRect(0, 0, w, h); };
  Q.line = function(ctx, x1, y1, x2, y2, color, width, dash){
    ctx.strokeStyle = color; ctx.lineWidth = width || 1.5; ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); };
  Q.circle = function(ctx, x, y, r, fill, stroke, lw){
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill){ ctx.fillStyle = fill; ctx.fill(); }
    if (stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); } };
  Q.text = function(ctx, str, x, y, color, size, align, weight){
    ctx.fillStyle = color || '#1F2023';
    ctx.font = (weight || 'normal') + ' ' + (size || 12) + "px 'JetBrains Mono', monospace";
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y); };
  Q.fmt = function(x, d){
    d = (d === undefined) ? 3 : d;
    if (!isFinite(x)) return '∞';
    if (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-4 && x !== 0)) return x.toExponential(2);
    return Number(x.toFixed(d)).toString(); };
  Q.hex = (r, g, b, a) => 'rgba(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ',' + (a === undefined ? 1 : a) + ')';

  /* ---------- module registry ---------- */
  Q.modules = {};
  Q.reg = function(id, m){ Q.modules[id] = m; };
  Q.$ = function(id){ return document.getElementById(id); };
  Q.bind = function(id, ev, fn){ const el = Q.$(id); if (el) el.addEventListener(ev, fn); return el; };

  return Q;
})();
