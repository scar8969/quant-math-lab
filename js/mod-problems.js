'use strict';
/* Module: Problem Sets — auto-graded derivation problems (QuantFrames-style) */
(function(){

  /* ---------- safe expression parser: "1/3", "sqrt(2)", "2^3", "pi", "e" ---------- */
  function safeEval(str){
    if (typeof str !== 'string') return NaN;
    let s = str.toLowerCase().replace(/\s+/g, '');
    if (!s) return NaN;
    let i = 0;
    function peek(){ return s[i]; }
    function eat(ch){ if (s[i] === ch){ i++; return true; } return false; }
    function parseE(){
      let v = parseT();
      while (peek() === '+' || peek() === '-'){ const op = peek(); i++; const r = parseT(); v = op === '+' ? v + r : v - r; }
      return v;
    }
    function parseT(){
      let v = parseF();
      while (peek() === '*' || peek() === '/'){ const op = peek(); i++; const r = parseF(); v = op === '*' ? v * r : v / r; }
      return v;
    }
    function parseF(){
      let v = parseU();
      if (peek() === '^'){ i++; const r = parseU(); v = Math.pow(v, r); }
      return v;
    }
    function parseU(){
      if (eat('-')) return -parseU();
      if (eat('+')) return parseU();
      return parseP();
    }
    function parseP(){
      if (eat('(')){ const v = parseE(); eat(')'); return v; }
      if (s.startsWith('pi', i)){ i += 2; return Math.PI; }
      if (s.startsWith('sqrt', i)){ i += 4; eat('('); const v = parseE(); eat(')'); return Math.sqrt(Math.max(0, v)); }
      if (s.startsWith('abs', i)){ i += 3; eat('('); const v = parseE(); eat(')'); return Math.abs(v); }
      if (s.startsWith('ln', i)){ i += 2; eat('('); const v = parseE(); eat(')'); return Math.log(v); }
      if (s[i] === 'e'){ i++; return Math.E; }
      let num = '';
      while (/[0-9.]/.test(peek() || '')){ num += peek(); i++; }
      if (num) return parseFloat(num);
      throw new Error('parse');
    }
    try{
      const v = parseE();
      if (i < s.length) return NaN;
      return v;
    }catch(e){ return NaN; }
  }

  function grade(userStr, ans, tol){
    const u = safeEval(userStr);
    if (!isFinite(u)) return 'invalid';
    tol = tol || 1e-3;
    return Math.abs(u - ans) <= tol * Math.max(1, Math.abs(ans)) ? 'correct' : 'wrong';
  }

  /* ---------- problem banks: each entry = generator(rnd) -> {q, ans, tol, unit, sol} ---------- */
  const BANKS = {

probability: [
  function(rnd){ const s = rnd() < 0.5 ? 6 : 20; const ans = (1 + s) / 2;
    return { q: `A fair d${s} is rolled once. What is the expected value E[X]?`, ans, tol: 1e-4,
      sol: `E[X] = (1+${s})/2 = ${ans}. Every face has probability 1/${s}, so E[X] = (1/${s})·(1+2+…+${s}).` }; },
  function(rnd){ const s = rnd() < 0.5 ? 6 : 20; const ans = (s * s - 1) / 12;
    return { q: `A fair d${s} is rolled once. What is the variance Var[X]?`, ans, tol: 1e-4,
      sol: `Var[X] = (s²−1)/12 = (${s}²−1)/12 = ${ans.toFixed(3)}.` }; },
  function(rnd){ const n = 5 + Math.floor(rnd() * 11); const p = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8][Math.floor(rnd() * 7)]; const k = 1 + Math.floor(rnd() * (n - 1));
    let C = 1; for (let i = 1; i <= k; i++) C = C * (n - i + 1) / i;
    const ans = C * Math.pow(p, k) * Math.pow(1 - p, n - k) * 100;
    return { q: `A coin with P(heads)=${p} is flipped ${n} times. What is the probability of exactly ${k} heads? (answer in %)`, ans, unit: '%',
      sol: `P = C(${n},${k})·${p}^${k}·(1−${p})^(${n}−${k}) = ${C}·${Math.pow(p, k).toFixed(4)}·${Math.pow(1 - p, n - k).toFixed(4)} = ${ans.toFixed(2)}%` }; },
  function(rnd){ const k = 2 + Math.floor(rnd() * 11); const ans = Math.sqrt(k * 35 / 12);
    return { q: `You roll ${k} fair d6 dice and sum them. What is the standard deviation of the sum?`, ans, tol: 1e-3,
      sol: `Var(sum) = k·Var(d6) = ${k}·35/12 = ${(k * 35 / 12).toFixed(3)}, so σ = √${(k * 35 / 12).toFixed(3)} = ${ans.toFixed(3)}. (CLT: the sum is approximately normal.)` }; },
  function(rnd){ const mu = [-2, -1, 0, 1, 2][Math.floor(rnd() * 5)]; const sigma = [0.5, 1, 1.5, 2][Math.floor(rnd() * 4)]; const x = +(mu + (rnd() * 2 - 1) * sigma).toFixed(2);
    const z = (x - mu) / sigma; const ans = Q.normCdf(x, mu, sigma) * 100;
    return { q: `X ~ N(${mu}, ${sigma}²). What is P(X ≤ ${x})? (answer in %)`, ans, unit: '%',
      sol: `z = (x−μ)/σ = (${x}−${mu})/${sigma} = ${z.toFixed(3)}. Φ(${z.toFixed(3)}) = ${ans.toFixed(2)}%.` }; },
  function(rnd){ const n = 100 + Math.floor(rnd() * 19) * 100; const ans = n / 6;
    return { q: `A fair d6 is rolled ${n} times. What is the expected number of times face 3 appears?`, ans, tol: 1e-3,
      sol: `E = n·P(3) = ${n}·1/6 = ${ans}. Law of large numbers: empirical frequency → probability as n grows.` }; },
],

bayes: [
  function(rnd){ const a = +(0.3 + rnd() * 0.5).toFixed(2); const b = +(0.3 + rnd() * 0.5).toFixed(2); const c = +(Math.min(a, b) * (0.2 + rnd() * 0.6)).toFixed(3);
    const ans = c / a * 100;
    return { q: `P(A)=${a}, P(B)=${b}, P(A∩B)=${c}. What is P(B|A)? (answer in %)`, ans, unit: '%',
      sol: `P(B|A) = P(A∩B)/P(A) = ${c}/${a} = ${ans.toFixed(2)}%.` }; },
  function(rnd){ const pab = +(0.4 + rnd() * 0.5).toFixed(2); const pb = +(0.3 + rnd() * 0.4).toFixed(2); const pa = +(0.3 + rnd() * 0.5).toFixed(2);
    const ans = pab * pb / pa * 100;
    return { q: `P(A|B)=${pab}, P(B)=${pb}, P(A)=${pa}. What is P(B|A)? (answer in %)`, ans, unit: '%',
      sol: `Bayes: P(B|A) = P(A|B)·P(B)/P(A) = ${pab}·${pb}/${pa} = ${ans.toFixed(2)}%. Note P(B|A) ≠ P(A|B) — the prior ratio P(B)/P(A) flips the conditioning.` }; },
  function(rnd){ const prev = +(0.01 + rnd() * 0.09).toFixed(3); const sens = +(0.85 + rnd() * 0.14).toFixed(2); const spec = +(0.85 + rnd() * 0.14).toFixed(2);
    const pPos = prev * sens + (1 - prev) * (1 - spec); const ans = prev * sens / pPos * 100;
    return { q: `Prevalence ${(prev * 100).toFixed(1)}%, sensitivity ${(sens * 100).toFixed(0)}%, specificity ${(spec * 100).toFixed(0)}%. A patient tests POSITIVE. What is P(disease | positive)? (answer in %)`, ans, unit: '%',
      sol: `P(D|+) = sens·prev / (sens·prev + (1−spec)(1−prev)) = ${(prev * sens).toFixed(4)}/${pPos.toFixed(4)} = ${ans.toFixed(1)}%. The base-rate fallacy: even a good test gives a low PPV at low prevalence.` }; },
  function(rnd){ const prev = +(0.01 + rnd() * 0.09).toFixed(3); const sens = +(0.85 + rnd() * 0.14).toFixed(2); const spec = +(0.85 + rnd() * 0.14).toFixed(2);
    const pNeg = (1 - prev) * spec + prev * (1 - sens); const ans = (1 - prev) * spec / pNeg * 100;
    return { q: `Same test: prevalence ${(prev * 100).toFixed(1)}%, sensitivity ${(sens * 100).toFixed(0)}%, specificity ${(spec * 100).toFixed(0)}%. A patient tests NEGATIVE. What is P(healthy | negative)? (answer in %)`, ans, unit: '%',
      sol: `P(H|−) = spec·(1−prev) / (spec·(1−prev) + (1−sens)·prev) = ${((1 - prev) * spec).toFixed(4)}/${pNeg.toFixed(4)} = ${ans.toFixed(1)}%.` }; },
  function(rnd){ const b = +(0.3 + rnd() * 0.5).toFixed(2); const c = +(b * (0.2 + rnd() * 0.6)).toFixed(3);
    const ans = c / b * 100;
    return { q: `P(B)=${b}, P(A∩B)=${c}. What is P(A|B)? (answer in %)`, ans, unit: '%',
      sol: `P(A|B) = P(A∩B)/P(B) = ${c}/${b} = ${ans.toFixed(2)}%.` }; },
  function(rnd){ const pb = +(0.3 + rnd() * 0.4).toFixed(2); const agb = +(0.4 + rnd() * 0.5).toFixed(2); const agnb = +(0.1 + rnd() * 0.3).toFixed(2);
    const ans = (agb * pb + agnb * (1 - pb)) * 100;
    return { q: `P(B)=${pb}, P(A|B)=${agb}, P(A|B')=${agnb}. What is P(A)? (answer in %)`, ans, unit: '%',
      sol: `Law of total probability: P(A) = P(A|B)P(B) + P(A|B')P(B') = ${agb}·${pb} + ${agnb}·${(1 - pb).toFixed(2)} = ${ans.toFixed(2)}%.` }; },
],

markov: [
  function(rnd){ const a = +(0.1 + rnd() * 0.5).toFixed(2); const b = +(0.1 + rnd() * 0.5).toFixed(2); const ans = b / (a + b);
    return { q: `P = [[1−${a}, ${a}], [${b}, 1−${b}]] (rows sum to 1). What is the stationary probability of state A, π_A?`, ans, tol: 1e-4,
      sol: `π = πP ⇒ π_A = π_A(1−a) + π_B·b and π_A+π_B=1 ⇒ π_A = b/(a+b) = ${b}/${(a + b).toFixed(2)} = ${ans.toFixed(4)}.` }; },
  function(rnd){ const p = +(0.4 + rnd() * 0.5).toFixed(2); const q = +(0.3 + rnd() * 0.5).toFixed(2);
    const ans = p * (1 - p) + (1 - p) * (1 - q);
    return { q: `P = [[${p}, ${(1 - p).toFixed(2)}], [${q}, ${(1 - q).toFixed(2)}]]. The chain starts in state A. What is the probability of being in state B after 2 steps?`, ans, tol: 1e-4,
      sol: `After 1 step: P(A)=${p}, P(B)=${(1 - p).toFixed(2)}. P(B at step 2) = P(A→B)·P(A at 1) + P(B→B)·P(B at 1) = ${(1 - p).toFixed(2)}·${p} + ${(1 - q).toFixed(2)}·${(1 - p).toFixed(2)} = ${ans.toFixed(4)}.` }; },
  function(rnd){ const r = +(0.3 + rnd() * 0.5).toFixed(2); const ans = 1 / (1 - r);
    return { q: `A state has self-transition probability ${r} (stays put with prob ${r} each step). What is the expected number of steps until the chain leaves this state?`, ans, tol: 1e-3,
      sol: `Geometric with success prob 1−r: E = 1/(1−r) = 1/${(1 - r).toFixed(2)} = ${ans.toFixed(3)} steps.` }; },
  function(rnd){ const M = []; for (let i = 0; i < 3; i++){ let row = []; let s = 0; for (let j = 0; j < 3; j++){ const v = +(0.1 + rnd() * 0.7).toFixed(2); row.push(v); s += v; } M.push(row.map(x => +(x / s).toFixed(4))); }
    const pi = Q.powerIter(M, 5000, 1e-12); const ans = pi[0];
    return { q: `P = [[${M[0].join(', ')}], [${M[1].join(', ')}], [${M[2].join(', ')}]]. What is the stationary probability of state 1, π₁?`, ans, tol: 1e-3,
      sol: `Solve π = πP (power iteration or the linear system): π = [${pi.map(x => x.toFixed(3)).join(', ')}]. So π₁ = ${ans.toFixed(3)}.` }; },
  function(rnd){ const M = []; for (let i = 0; i < 3; i++){ let row = []; let s = 0; for (let j = 0; j < 3; j++){ const v = +(0.1 + rnd() * 0.7).toFixed(2); row.push(v); s += v; } M.push(row.map(x => +(x / s).toFixed(4))); }
    const ans = M[1][2];
    return { q: `P = [[${M[0].join(', ')}], [${M[1].join(', ')}], [${M[2].join(', ')}]]. What is P(2 → 3), the one-step transition probability from state 2 to state 3?`, ans, tol: 1e-4,
      sol: `Read row 2 (state 2), column 3: P[1][2] = ${ans.toFixed(4)}.` }; },
  function(rnd){ const a = +(0.1 + rnd() * 0.5).toFixed(2); const b = +(0.1 + rnd() * 0.5).toFixed(2); const ans = a / (a + b);
    return { q: `P = [[1−${a}, ${a}], [${b}, 1−${b}]]. What is the stationary probability of state B, π_B?`, ans, tol: 1e-4,
      sol: `π_B = a/(a+b) = ${a}/${(a + b).toFixed(2)} = ${ans.toFixed(4)}.` }; },
],

growth: [
  function(rnd){ const P = 1000 + Math.floor(rnd() * 9) * 1000; const r = +(0.02 + rnd() * 0.10).toFixed(2); const n = [1, 4, 12, 365][Math.floor(rnd() * 4)]; const t = 5 + Math.floor(rnd() * 26);
    const ans = P * Math.pow(1 + r / n, n * t);
    return { q: `You invest $${P} at ${(r * 100).toFixed(0)}% APR compounded ${n === 1 ? 'annually' : n === 4 ? 'quarterly' : n === 12 ? 'monthly' : 'daily'} for ${t} years. What is the final amount?`, ans, tol: 1e-4,
      sol: `A = P(1+r/n)^(nt) = ${P}·(1+${r}/${n})^(${n}·${t}) = ${ans.toFixed(2)}.` }; },
  function(rnd){ const P = 1000 + Math.floor(rnd() * 9) * 1000; const r = +(0.02 + rnd() * 0.10).toFixed(2); const t = 5 + Math.floor(rnd() * 26);
    const ans = P * Math.exp(r * t);
    return { q: `$${P} grows continuously at ${(r * 100).toFixed(0)}% for ${t} years. What is the final amount?`, ans, tol: 1e-4,
      sol: `A = Pe^(rt) = ${P}·e^(${r}·${t}) = ${ans.toFixed(2)}. Continuous compounding is the n→∞ limit of (1+r/n)^(nt).` }; },
  function(rnd){ const r = +(0.05 + rnd() * 0.15).toFixed(2); const n = [1, 4, 12, 365][Math.floor(rnd() * 4)];
    const ans = (Math.pow(1 + r / n, n) - 1) * 100;
    return { q: `Nominal APR ${(r * 100).toFixed(0)}% compounded ${n === 1 ? 'annually' : n === 4 ? 'quarterly' : n === 12 ? 'monthly' : 'daily'}. What is the effective annual rate? (answer in %)`, ans, unit: '%', tol: 1e-3,
      sol: `r_eff = (1+r/n)^n − 1 = (1+${r}/${n})^${n} − 1 = ${ans.toFixed(3)}%.` }; },
  function(rnd){ const r = +(0.02 + rnd() * 0.13).toFixed(2); const ans = Math.log(2) / Math.log(1 + r);
    return { q: `An investment grows at ${(r * 100).toFixed(0)}% per year. How many years until it doubles?`, ans, tol: 1e-3,
      sol: `(1+r)^t = 2 ⇒ t = ln2/ln(1+r) = ${Math.log(2).toFixed(3)}/${Math.log(1 + r).toFixed(3)} = ${ans.toFixed(2)} years.` }; },
  function(rnd){ const x0 = 1 + Math.floor(rnd() * 9); const r = +(0.05 + rnd() * 0.20).toFixed(2); const t = 5 + Math.floor(rnd() * 16);
    const ans = x0 * Math.pow(1 + r, t);
    return { q: `A quantity starts at ${x0} and grows ${(r * 100).toFixed(0)}% per step. What is its value after ${t} steps?`, ans, tol: 1e-4,
      sol: `x_t = x₀(1+r)^t = ${x0}·(1+${r})^${t} = ${ans.toFixed(2)}.` }; },
  function(rnd){ const R0 = +(1.5 + rnd() * 2.5).toFixed(1); const ans = (1 - 1 / R0) * 100;
    return { q: `An epidemic has R₀ = ${R0}. What is the herd-immunity threshold? (answer in %)`, ans, unit: '%', tol: 1e-3,
      sol: `Herd immunity = 1 − 1/R₀ = 1 − 1/${R0} = ${ans.toFixed(1)}%.` }; },
],

eigen: [
  function(rnd){ const a = 1 + Math.floor(rnd() * 5); const d = 1 + Math.floor(rnd() * 5); const ans = a;
    return { q: `A = [[${a}, 0], [0, ${d}]]. What is the eigenvalue λ₁ associated with eigenvector [1, 0]?`, ans, tol: 1e-6,
      sol: `For a diagonal matrix the eigenvalues are the diagonal entries: λ₁=${a}, λ₂=${d}. Check: A·[1,0] = [${a}, 0] = ${a}·[1,0].` }; },
  function(rnd){ const a = 1 + Math.floor(rnd() * 4); const b = Math.floor(rnd() * 5) - 2; const c = Math.floor(rnd() * 5) - 2; const d = 1 + Math.floor(rnd() * 4);
    const ans = a + d;
    return { q: `A = [[${a}, ${b}], [${c}, ${d}]]. What is the trace tr(A) = λ₁+λ₂?`, ans, tol: 1e-6,
      sol: `tr(A) = a+d = ${a}+${d} = ${ans}. The trace equals the sum of the eigenvalues.` }; },
  function(rnd){ const a = 1 + Math.floor(rnd() * 4); const b = Math.floor(rnd() * 5) - 2; const c = Math.floor(rnd() * 5) - 2; const d = 1 + Math.floor(rnd() * 4);
    const ans = a * d - b * c;
    return { q: `A = [[${a}, ${b}], [${c}, ${d}]]. What is det(A) = λ₁·λ₂?`, ans, tol: 1e-6,
      sol: `det(A) = ad−bc = ${a}·${d} − ${b}·${c} = ${ans}. The determinant equals the product of the eigenvalues.` }; },
  function(rnd){ const a = 1 + Math.floor(rnd() * 4); const d = 1 + Math.floor(rnd() * 4); const b = +(0.5 + rnd() * 2).toFixed(1);
    const disc = Math.sqrt((a - d) ** 2 + 4 * b * b); const ans = (a + d + disc) / 2;
    return { q: `A = [[${a}, ${b}], [${b}, ${d}]] (symmetric). What is the LARGER eigenvalue?`, ans, tol: 1e-4,
      sol: `λ = (a+d ± √((a−d)²+4b²))/2 = (${a + d} ± ${disc.toFixed(3)})/2. Larger: ${ans.toFixed(3)}.` }; },
  function(rnd){ const k = 8 + Math.floor(rnd() * 13);
    let f0 = 0, f1 = 1; for (let i = 2; i <= k; i++){ const f = f0 + f1; f0 = f1; f1 = f; }
    const ans = f1;
    return { q: `Fibonacci via the matrix F = [[1,1],[1,0]]: F^k·[1,0] = [F_{k+1}, F_k]. What is F_${k}?`, ans, tol: 1e-6,
      sol: `Iterating the recurrence: F_${k} = ${ans}. (Closed form: F_k = φ^k/√5 rounded to nearest integer, φ = ${((1 + Math.sqrt(5)) / 2).toFixed(3)}.)` }; },
  function(rnd){ const a = +(0.5 + rnd() * 2).toFixed(1); const b = +(0.2 + rnd() * 1).toFixed(1); const c = +(0.2 + rnd() * 1).toFixed(1); const d = +(0.5 + rnd() * 2).toFixed(1);
    const eigs = Q.eig2(a, b, c, d); const ans = Math.abs(eigs[0].val);
    return { q: `A = [[${a}, ${b}], [${c}, ${d}]]. What is the magnitude of the dominant eigenvalue (largest |λ|)?`, ans, tol: 1e-3,
      sol: `Eigenvalues: ${eigs.map(e => e.val.toFixed(3)).join(', ')}. Largest magnitude: ${ans.toFixed(3)}. Repeated multiplication Aᵏv aligns with this eigenvector — the engine of PageRank and Markov chains.` }; },
],

pca: [
  function(rnd){ const a = +(1 + rnd() * 4).toFixed(1); const b = +(0.2 + rnd() * 0.8).toFixed(1); const ans = a / (a + b) * 100;
    return { q: `Covariance matrix Σ = [[${a}, 0], [0, ${b}]]. What % of total variance does PC1 explain? (answer in %)`, ans, unit: '%', tol: 1e-3,
      sol: `Eigenvalues of a diagonal Σ are ${a} and ${b}. PC1 share = ${a}/(${a}+${b}) = ${ans.toFixed(1)}%.` }; },
  function(rnd){ const l1 = +(1 + rnd() * 4).toFixed(1); const l2 = +(0.2 + rnd() * 0.8).toFixed(1); const ans = l1 / (l1 + l2) * 100;
    return { q: `PCA gives eigenvalues λ₁=${l1}, λ₂=${l2}. What % of variance is explained by PC1? (answer in %)`, ans, unit: '%', tol: 1e-3,
      sol: `% = λ₁/(λ₁+λ₂) = ${l1}/${(l1 + l2).toFixed(1)} = ${ans.toFixed(1)}%.` }; },
  function(rnd){ const a = +(1 + rnd() * 3).toFixed(1); const b = +(1 + rnd() * 3).toFixed(1); const c = +(0.3 + rnd() * 1).toFixed(1);
    const disc = Math.sqrt((a - b) ** 2 + 4 * c * c); const ans = (a + b + disc) / 2;
    return { q: `Σ = [[${a}, ${c}], [${c}, ${b}]]. What is the largest eigenvalue (PC1 variance)?`, ans, tol: 1e-3,
      sol: `λ = (a+b ± √((a−b)²+4c²))/2 = (${(a + b).toFixed(1)} ± ${disc.toFixed(3)})/2. Largest: ${ans.toFixed(3)}.` }; },
  function(rnd){ const a = +(1 + rnd() * 3).toFixed(1); const b = +(1 + rnd() * 3).toFixed(1); const c = +(0.3 + rnd() * 1).toFixed(1);
    const ans = c / Math.sqrt(a * b);
    return { q: `Σ = [[${a}, ${c}], [${c}, ${b}]]. What is the correlation ρ(x,y)?`, ans, tol: 1e-3,
      sol: `ρ = cov/√(var_x·var_y) = ${c}/√(${a}·${b}) = ${ans.toFixed(3)}.` }; },
  function(rnd){ const l1 = +(1 + rnd() * 4).toFixed(1); const l2 = +(0.2 + rnd() * 0.8).toFixed(1); const ans = l2 / (l1 + l2) * 100;
    return { q: `λ₁=${l1}, λ₂=${l2}. You keep only PC1 (drop PC2). What % of variance is LOST? (answer in %)`, ans, unit: '%', tol: 1e-3,
      sol: `Lost = λ₂/(λ₁+λ₂) = ${l2}/${(l1 + l2).toFixed(1)} = ${ans.toFixed(1)}%.` }; },
  function(rnd){ const n = 4 + Math.floor(rnd() * 3); const pts = []; for (let i = 0; i < n; i++) pts.push(+(rnd() * 2 - 1).toFixed(2));
    const ans = Q.mean(pts.map(x => x * x));
    return { q: `Centered data along one axis (mean 0): x = [${pts.join(', ')}]. What is the variance of x?`, ans, tol: 1e-3,
      sol: `Var = (1/n)Σx² = (${pts.map(x => x.toFixed(2) + '²').join(' + ')})/${n} = ${ans.toFixed(3)}.` }; },
],

momentum: [
  function(rnd){ const lam = 2 + Math.floor(rnd() * 39); const ans = (Math.sqrt(lam) - 1) / (Math.sqrt(lam) + 1);
    return { q: `Loss f(x,y) = ${lam}x² + y². What is the optimal momentum β* for this curvature ratio?`, ans, tol: 1e-3,
      sol: `β* = (√λ−1)/(√λ+1) = (√${lam}−1)/(√${lam}+1) = ${ans.toFixed(3)} (Distill, "Why Momentum Really Works").` }; },
  function(rnd){ const lam = 2 + Math.floor(rnd() * 39); const ans = 1 / lam;
    return { q: `f(x) = ${lam}x². Gradient descent: x ← x − 2αλx. What is the largest step α that keeps GD stable (|1−2αλ| < 1)?`, ans, tol: 1e-4,
      sol: `|1−2αλ| < 1 ⇒ 0 < α < 1/λ = 1/${lam} = ${ans.toFixed(4)}.` }; },
  function(rnd){ const beta = +(0.8 + rnd() * 0.15).toFixed(2); const ans = 1 / (1 - beta);
    return { q: `Momentum β = ${beta}. The velocity update v ← βv − α∇f accumulates past gradients. By what factor does momentum amplify the effective step along a direction?`, ans, tol: 1e-3,
      sol: `Amplification = 1/(1−β) = 1/${(1 - beta).toFixed(2)} = ${ans.toFixed(2)}×.` }; },
  function(rnd){ const ans = 0;
    return { q: `f(x,y) = x² + y² (isotropic, λ=1). What is the optimal momentum β*?`, ans, tol: 1e-6,
      sol: `β* = (√1−1)/(√1+1) = 0. With equal curvature in every direction, momentum has nothing to damp — plain GD is already optimal.` }; },
  function(rnd){ const lam = 2 + Math.floor(rnd() * 39); const ans = 0;
    return { q: `f(x) = ${lam}x², start x₀=1, step α = 1/(2λ) (the "magic step"). What is x₁ after one GD step?`, ans, tol: 1e-6,
      sol: `x₁ = x₀ − 2αλx₀ = 1 − 2·(1/(2·${lam}))·${lam}·1 = 1 − 1 = 0. The magic step lands exactly on the minimum.` }; },
  function(rnd){ const lam = 2 + Math.floor(rnd() * 39); const beta = +(0.7 + rnd() * 0.25).toFixed(2); const alpha = +(0.02 + rnd() * 0.08).toFixed(3);
    const ans = 1 - 2 * alpha * lam;
    return { q: `f(x) = ${lam}x², x₀=1, v₀=0, β=${beta}, α=${alpha}. Momentum: v ← βv − α·2λx, then x ← x + v. What is x₁?`, ans, tol: 1e-4,
      sol: `v₁ = 0 − ${alpha}·2·${lam}·1 = ${(-2 * alpha * lam).toFixed(4)}. x₁ = 1 + v₁ = ${ans.toFixed(4)}.` }; },
],

mcmc: [
  function(rnd){ const a = +(0.2 + rnd() * 1.8).toFixed(2); const b = +(0.2 + rnd() * 1.8).toFixed(2); const ans = Math.min(1, a / b);
    return { q: `Metropolis-Hastings proposes x' with target density π(x')=${a} vs current π(x)=${b}. What is the acceptance probability?`, ans, tol: 1e-4,
      sol: `α = min(1, π(x')/π(x)) = min(1, ${a}/${b}) = ${ans.toFixed(3)}.` }; },
  function(rnd){ const L = +(Math.log(0.2 + rnd() * 1.8)).toFixed(2); const ans = Math.min(1, Math.exp(L));
    return { q: `MH with log-ratio log(π(x')/π(x)) = ${L}. What is the acceptance probability?`, ans, tol: 1e-4,
      sol: `α = min(1, e^L) = min(1, e^${L}) = ${ans.toFixed(3)}.` }; },
  function(rnd){ const x1 = +(rnd() * 1.5).toFixed(2); const x2 = +(rnd() * 1.5).toFixed(2); const ans = Math.exp(-0.5 * (x2 * x2 - x1 * x1));
    return { q: `Target π(x) ∝ e^(−x²/2) (standard normal, unnormalized). Proposal x'=${x2} from current x=${x1}. What is the MH acceptance probability?`, ans, tol: 1e-4,
      sol: `π(x')/π(x) = e^(−0.5(x'²−x²)) = e^(−0.5(${(x2 * x2).toFixed(3)}−${(x1 * x1).toFixed(3)})) = ${ans.toFixed(4)}.` }; },
  function(rnd){ const ans = 23.4;
    return { q: `Random-walk Metropolis in high dimensions: what acceptance rate is asymptotically optimal? (answer in %)`, ans, unit: '%', tol: 1e-2,
      sol: `≈ 23.4% (Roberts, Gelman & Gilks 1997). Tune the proposal scale to hit ~23% — too high means tiny steps, too low means rejection.` }; },
  function(rnd){ const H0 = +(0.5 + rnd() * 2).toFixed(2); const H1 = +(0.5 + rnd() * 2).toFixed(2); const ans = Math.min(1, Math.exp(H0 - H1));
    return { q: `Hamiltonian MC: initial Hamiltonian H=${H0}, proposed H'=${H1}. What is the acceptance probability?`, ans, tol: 1e-4,
      sol: `α = min(1, e^(H−H')) = min(1, e^(${H0}−${H1})) = ${ans.toFixed(3)}.` }; },
  function(rnd){ const x = +(rnd() * 1.5).toFixed(2); const sig = +(0.3 + rnd() * 0.7).toFixed(2); const g = +(rnd() * 2 - 1).toFixed(2);
    const ans = x + sig * sig / 2 * g;
    return { q: `MALA proposal: x' ~ N(x + σ²/2·g, σ²) with x=${x}, σ=${sig}, gradient of log-target g=${g}. What is the proposal mean?`, ans, tol: 1e-4,
      sol: `mean = x + σ²g/2 = ${x} + ${(sig * sig / 2).toFixed(3)}·${g} = ${ans.toFixed(4)}.` }; },
],

gp: [
  function(rnd){ const l = +(0.3 + rnd() * 1.2).toFixed(2); const sf = +(0.5 + rnd() * 1.5).toFixed(2); const d = +(0.2 + rnd() * 2.8).toFixed(2);
    const ans = sf * sf * Math.exp(-(d * d) / (2 * l * l));
    return { q: `RBF kernel k(x,x') = σ_f²·exp(−(x−x')²/(2ℓ²)) with ℓ=${l}, σ_f=${sf}, |x−x'|=${d}. What is k(x,x')?`, ans, tol: 1e-4,
      sol: `k = ${sf}²·e^(−${(d * d).toFixed(2)}/(2·${(l * l).toFixed(2)})) = ${ans.toFixed(4)}.` }; },
  function(rnd){ const sf = +(0.5 + rnd() * 1.5).toFixed(2); const ans = sf * sf;
    return { q: `RBF kernel with σ_f=${sf}. What is k(x,x) — the prior variance at any single point?`, ans, tol: 1e-4,
      sol: `k(x,x) = σ_f²·e⁰ = ${sf}² = ${ans.toFixed(3)}.` }; },
  function(rnd){ const sf = +(0.5 + rnd() * 1.5).toFixed(2); const ans = sf * sf * Math.exp(-0.5);
    return { q: `RBF kernel with σ_f=${sf}. Two points are exactly one lengthscale apart: |x−x'| = ℓ. What is k(x,x')?`, ans, tol: 1e-4,
      sol: `k = σ_f²·e^(−ℓ²/(2ℓ²)) = σ_f²·e^(−1/2) = ${sf}²·${Math.exp(-0.5).toFixed(4)} = ${ans.toFixed(4)}.` }; },
  function(rnd){ const sf = +(0.5 + rnd() * 1.5).toFixed(2); const ans = sf;
    return { q: `A GP prior has σ_f=${sf}. What is the prior STANDARD DEVIATION of f(x) at any point?`, ans, tol: 1e-4,
      sol: `Prior variance = σ_f², so prior std = σ_f = ${sf}.` }; },
  function(rnd){ const x0 = +(rnd() * 2 - 1).toFixed(2); const y0 = +(rnd() * 2 - 1).toFixed(2); const ans = y0;
    return { q: `GP regression with zero observation noise (σ_n=0). You observe (x,y) = (${x0}, ${y0}). What is the posterior mean at x=${x0}?`, ans, tol: 1e-4,
      sol: `With σ_n=0 the GP interpolates exactly: the posterior mean passes through every observation, so m(${x0}) = ${y0}.` }; },
  function(rnd){ const ans = Math.exp(-0.5);
    return { q: `RBF kernel: what is the ratio k(0, ℓ)/k(0, 0) — the correlation between points one lengthscale apart? (answer as a decimal)`, ans, tol: 1e-4,
      sol: `k(0,ℓ)/k(0,0) = e^(−1/2) = ${ans.toFixed(4)}. The lengthscale ℓ is where correlation drops to ~60%.` }; },
],
  };

  const NAMES = { probability: 'Probability', bayes: 'Bayes & Conditional', markov: 'Markov Chains', growth: 'Growth & Interest', eigen: 'Eigenvectors', pca: 'PCA', momentum: 'Momentum Opt', mcmc: 'MCMC', gp: 'Gaussian Processes' };
  const KEY = 'qml-progress-v1';

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }

  const mod = {
    id: 'problems',
    BANKS, safeEval, grade,
    init: function(){
      const el = Q.$('mod-problems');
      el.innerHTML = `
        <div class="mhead">
          <h2>Problem Sets <span class="src">AUTO-GRADED · QUANTFRAMES-STYLE</span></h2>
          <p>No sliders here. Each problem hands you numbers and asks you to derive the answer — type it in and get marked right or wrong, with the full derivation shown after. Answers are checked with 0.1% relative tolerance; you can type <span class="kbd">1/3</span>, <span class="kbd">sqrt(2)</span>, <span class="kbd">2^3</span>, <span class="kbd">pi</span>, <span class="kbd">e</span>. Progress is saved in your browser.</p>
        </div>
        <div class="tabs" id="ps-tabs"></div>
        <div class="grid g23">
          <div class="card">
            <h3 id="ps-topic-name"></h3>
            <div class="prob-q" id="ps-q"></div>
            <div class="prob-input-row">
              <input type="text" id="ps-ans" class="prob-ans" placeholder="your answer…" autocomplete="off" spellcheck="false">
              <span class="prob-unit" id="ps-unit"></span>
              <button class="btn primary" id="ps-check">check</button>
              <button class="btn" id="ps-new">new problem</button>
              <button class="btn" id="ps-sol">show solution</button>
              <button class="btn" id="ps-timed">⚡ timed round</button>
            </div>
            <div class="prob-feedback" id="ps-feedback"></div>
          </div>
          <div class="card">
            <h3>📊 Progress <span class="streak-pill" id="ps-streak"></span></h3>
            <div id="ps-score"></div>
            <div id="ps-timed-panel" style="display:none"></div>
            <button class="btn small" id="ps-reset" style="margin-top:10px">reset progress</button>
            <div class="hint">streak = consecutive correct answers in the current topic</div>
          </div>
        </div>`;
      this.progress = load();
      this.topic = 'probability';
      this.cur = null;
      this.timed = { active: false, score: 0, correct: 0, wrong: 0, time: 60, timer: null };
      const self = this;
      this.renderTabs();
      this.renderScore();
      this.newProb();
      Q.bind('ps-check', 'click', () => self.check());
      Q.bind('ps-new', 'click', () => self.newProb());
      Q.bind('ps-sol', 'click', () => self.reveal());
      Q.bind('ps-timed', 'click', () => self.toggleTimed());
      Q.bind('ps-reset', 'click', () => { self.progress = {}; self.save(); self.renderScore(); });
      Q.bind('ps-ans', 'keydown', e => { if (e.key === 'Enter') self.check(); });
    },
    save: function(){ try{ localStorage.setItem(KEY, JSON.stringify(this.progress)); }catch(e){} },
    renderTabs: function(){
      const self = this;
      Q.$('ps-tabs').innerHTML = Object.keys(BANKS).map(t =>
        `<button class="tab${t === this.topic ? ' active' : ''}" data-t="${t}">${NAMES[t]}</button>`).join('');
      Q.$('ps-tabs').querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
        self.topic = b.dataset.t;
        self.renderTabs(); self.renderScore(); self.newProb();
      }));
    },
    renderScore: function(){
      let totalC = 0, totalT = 0;
      const rows = Object.keys(BANKS).map(t => {
        const p = this.progress[t] || { c: 0, t: 0, s: 0, b: 0 };
        totalC += p.c; totalT += p.t;
        const pct = p.t ? Math.round(p.c / p.t * 100) : 0;
        return `<div class="mastery"><span class="nm">${NAMES[t]}</span><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span class="pct">${p.c}/${p.t}</span></div>`;
      }).join('');
      const cur = this.progress[this.topic] || { s: 0, b: 0 };
      Q.$('ps-streak').textContent = '🔥 ' + cur.s + ' streak · best ' + cur.b;
      Q.$('ps-score').innerHTML = rows +
        `<div class="mastery" style="margin-top:8px; border-top:1px solid var(--border); padding-top:8px"><span class="nm" style="color:var(--txt);font-weight:600">TOTAL</span><div class="bar"></div><span class="pct" style="color:var(--txt)">${totalC}/${totalT}</span></div>`;
    },
    toggleTimed: function(){
      if (this.timed.active) this.endTimed(); else this.startTimed();
    },
    startTimed: function(){
      if (this.timed.timer) clearInterval(this.timed.timer);
      this.timed = { active: true, score: 0, correct: 0, wrong: 0, time: 60, timer: null };
      const self = this;
      Q.$('ps-timed-panel').style.display = 'block';
      Q.$('ps-timed').textContent = '⏹ stop';
      this.timed.timer = setInterval(() => {
        self.timed.time--;
        self.renderTimed();
        if (self.timed.time <= 0) self.endTimed();
      }, 1000);
      this.renderTimed();
      this.newProb();
    },
    endTimed: function(){
      clearInterval(this.timed.timer);
      this.timed.active = false;
      Q.$('ps-timed').textContent = '⚡ timed round';
      const t = this.timed;
      Q.$('ps-timed-panel').innerHTML =
        `<div class="readout" style="margin-top:10px;border-color:#B07D00">⏱ round over — score <b>${t.score}</b> (${t.correct} correct, ${t.wrong} wrong, ${t.correct + t.wrong} answered)</div>`;
    },
    renderTimed: function(){
      const t = this.timed;
      if (!t.active) return;
      Q.$('ps-timed-panel').innerHTML =
        `<div class="readout" style="margin-top:10px;border-color:#B07D00"><b style="font-size:15px;color:${t.time <= 10 ? '#C62828' : '#B07D00'}">${t.time}s</b> · score <b>${t.score}</b> · ✓${t.correct} ✗${t.wrong}</div>`;
    },
    newProb: function(){
      let topic = this.topic;
      if (this.timed.active){
        const keys = Object.keys(BANKS);
        topic = keys[Math.floor(Math.random() * keys.length)];
      }
      const bank = BANKS[topic];
      const gen = bank[Math.floor(Math.random() * bank.length)];
      const rnd = Q.rng((Math.random() * 1e9) | 0);
      this.cur = gen(rnd);
      Q.$('ps-topic-name').innerHTML = `${NAMES[topic]} <span class="tag">${this.timed.active ? '⚡ speed round' : 'derive it — the grader checks'}</span>`;
      Q.$('ps-q').innerHTML = this.cur.q;
      Q.$('ps-unit').textContent = this.cur.unit || '';
      Q.$('ps-ans').value = '';
      const fb = Q.$('ps-feedback');
      fb.className = 'prob-feedback'; fb.innerHTML = '';
      Q.$('ps-ans').focus();
    },
    check: function(){
      const cur = this.cur;
      if (!cur) return;
      const input = Q.$('ps-ans').value.trim();
      const fb = Q.$('ps-feedback');
      const g = grade(input, cur.ans, cur.tol);
      if (g === 'invalid'){
        fb.className = 'prob-feedback invalid show';
        fb.innerHTML = `<b>enter a number</b> — try 0.25, 1/3, sqrt(2), pi, 2^3. (got: "${input}")`;
        return;
      }
      if (this.timed.active){
        if (g === 'correct'){ this.timed.correct++; this.timed.score++; }
        else { this.timed.wrong++; this.timed.score--; }
        const sol = `<div class="sol"><b>derivation:</b> ${cur.sol}</div>`;
        if (g === 'correct'){ fb.className = 'prob-feedback correct show'; fb.innerHTML = `<b>✓ correct</b> +1 (${this.timed.score} total)${sol}`; }
        else { fb.className = 'prob-feedback wrong show'; fb.innerHTML = `<b>✗ wrong</b> — answer ${Q.fmt(cur.ans)} (score ${this.timed.score})${sol}`; }
        this.renderTimed();
        setTimeout(() => { if (this.timed.active) this.newProb(); }, 800);
        return;
      }
      const p = this.progress[this.topic] || { c: 0, t: 0, s: 0, b: 0 };
      p.t++;
      if (g === 'correct'){ p.c++; p.s++; p.b = Math.max(p.b, p.s); }
      else { p.s = 0; }
      this.progress[this.topic] = p;
      this.save(); this.renderScore();
      const sol = `<div class="sol"><b>derivation:</b> ${cur.sol}</div>`;
      if (g === 'correct'){
        fb.className = 'prob-feedback correct show';
        fb.innerHTML = `<b>✓ correct</b> — ${NAMES[this.topic]} +1 · streak ${p.s}${sol}`;
      } else {
        fb.className = 'prob-feedback wrong show';
        fb.innerHTML = `<b>✗ wrong</b> — you said ${input}, correct answer is <b>${Q.fmt(cur.ans)}</b>${sol}`;
      }
    },
    reveal: function(){
      const cur = this.cur;
      if (!cur) return;
      const fb = Q.$('ps-feedback');
      fb.className = 'prob-feedback show';
      fb.innerHTML = `<b>solution for ${NAMES[this.topic]}</b> — answer: <b>${Q.fmt(cur.ans)}</b><div class="sol">${cur.sol}</div>`;
    },
    onResize: function(){}
  };
  Q.reg('problems', mod);
})();
