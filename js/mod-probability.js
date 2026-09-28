'use strict';
/* Module: Probability — dice/coin simulation, normal curve, CLT */
(function(){
  const W = 620, H = 300;

  function drawDist(ctx, counts, n, maxC){
    Q.clear(ctx, W, H);
    const bw = W / counts.length;
    for (let i = 0; i < counts.length; i++){
      const h = (counts[i] / maxC) * (H - 46);
      const grad = ctx.createLinearGradient(0, H - 24 - h, 0, H - 24);
      grad.addColorStop(0, '#3fb950'); grad.addColorStop(1, '#1a7a1a');
      ctx.fillStyle = grad;
      ctx.fillRect(i * bw + 1, H - 24 - h, bw - 2, h);
    }
    Q.text(ctx, '0', 4, H - 12, '#8b949e', 10);
    Q.text(ctx, String(counts.length - 1), W - 22, H - 12, '#8b949e', 10);
    Q.text(ctx, 'outcome', W / 2, H - 8, '#8b949e', 10, 'center');
  }

  const mod = {
    id: 'probability',
    init: function(){
      const el = Q.$('mod-probability');
      el.innerHTML = `
        <div class="mhead">
          <h2>Probability <span class="src">SEEING THEORY · ch.1</span></h2>
          <p>Chance events, expectation and variance — the building blocks of quant math. Simulate dice and coins, watch the law of large numbers pull empirical frequencies toward the theoretical probability, and see the Central Limit Theorem turn any distribution into a bell curve.</p>
        </div>
        <div class="grid g2">
          <div class="card">
            <h3>🎲 Dice &amp; Coin Simulation <span class="tag">law of large numbers</span></h3>
            <div class="controls">
              <div class="ctl"><label>rolls</label><input type="range" id="prob-n" min="10" max="2000" value="200"><span class="val" id="prob-n-val">200</span></div>
              <div class="ctl"><label>die</label><select id="prob-die"><option value="6">d6</option><option value="20">d20</option></select></div>
              <button class="btn primary" id="prob-roll">roll</button>
              <button class="btn" id="prob-clear">clear</button>
            </div>
            <canvas id="prob-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#3fb950"></span>empirical frequency</span>
              <span><span class="swatch" style="background:#58a6ff"></span>theoretical 1/sides</span>
            </div>
            <div class="readout" id="prob-out" style="margin-top:10px"></div>
          </div>
          <div class="card">
            <h3>🔔 Normal Curve <span class="tag">pdf · z-scores</span></h3>
            <div class="controls">
              <div class="ctl"><label>μ</label><input type="range" id="prob-mu" min="-3" max="3" step="0.1" value="0"><span class="val" id="prob-mu-val">0</span></div>
              <div class="ctl"><label>σ</label><input type="range" id="prob-sigma" min="0.2" max="2" step="0.05" value="1"><span class="val" id="prob-sigma-val">1</span></div>
              <div class="ctl"><label>shade x ≤</label><input type="number" id="prob-x" value="0.5" step="0.1" style="width:56px"></div>
            </div>
            <canvas id="prob-cv2" width="${W}" height="${H}"></canvas>
            <div class="readout" id="prob-out2" style="margin-top:10px"></div>
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>📊 Central Limit Theorem <span class="tag">sum of dice → normal</span></h3>
          <div class="controls">
            <div class="ctl"><label>dice per sum</label><input type="range" id="prob-clt-k" min="1" max="12" value="3"><span class="val" id="prob-clt-k-val">3</span></div>
            <div class="ctl"><label>samples</label><input type="range" id="prob-clt-n" min="200" max="20000" step="200" value="4000"><span class="val" id="prob-clt-n-val">4000</span></div>
            <button class="btn primary" id="prob-clt-run">sample</button>
          </div>
          <canvas id="prob-cv3" width="${W}" height="${H}"></canvas>
          <div class="readout" id="prob-out3" style="margin-top:10px"></div>
        </div>`;
      this.cv = Q.canvas('prob-cv', W, H);
      this.cv2 = Q.canvas('prob-cv2', W, H);
      this.cv3 = Q.canvas('prob-cv3', W, H);
      this.counts = new Array(6).fill(0);
      this.n = 0;

      const self = this;
      Q.bind('prob-n', 'input', e => { Q.$('prob-n-val').textContent = e.target.value; });
      Q.bind('prob-roll', 'click', () => self.roll());
      Q.bind('prob-clear', 'click', () => { self.counts = new Array(6).fill(0); self.n = 0; self.draw(); self.out(); });
      Q.bind('prob-die', 'change', e => { self.sides = +e.target.value; self.counts = new Array(self.sides).fill(0); self.n = 0; self.draw(); self.out(); });
      Q.bind('prob-mu', 'input', e => { Q.$('prob-mu-val').textContent = e.target.value; self.draw2(); });
      Q.bind('prob-sigma', 'input', e => { Q.$('prob-sigma-val').textContent = e.target.value; self.draw2(); });
      Q.bind('prob-x', 'change', () => self.draw2());
      Q.bind('prob-clt-k', 'input', e => { Q.$('prob-clt-k-val').textContent = e.target.value; });
      Q.bind('prob-clt-n', 'input', e => { Q.$('prob-clt-n-val').textContent = e.target.value; });
      Q.bind('prob-clt-run', 'click', () => self.clt());
      this.sides = 6;
      this.draw(); this.out(); this.draw2(); this.clt();
    },
    roll: function(){
      const rnd = Q.rng(Date.now() & 0xffff);
      const n = +Q.$('prob-n').value, s = this.sides;
      for (let i = 0; i < n; i++){ this.counts[(rnd() * s) | 0]++; this.n++; }
      this.draw(); this.out();
    },
    draw: function(){
      const ctx = this.cv, s = this.sides;
      Q.clear(ctx, W, H);
      const maxC = Math.max(...this.counts, 1);
      const bw = W / s;
      for (let i = 0; i < s; i++){
        const h = (this.counts[i] / maxC) * (H - 46);
        const grad = ctx.createLinearGradient(0, H - 24 - h, 0, H - 24);
        grad.addColorStop(0, '#3fb950'); grad.addColorStop(1, '#1a7a1a');
        ctx.fillStyle = grad;
        ctx.fillRect(i * bw + 1, H - 24 - h, bw - 2, h);
        Q.text(ctx, String(i + 1), i * bw + bw / 2, H - 12, '#8b949e', 10, 'center');
        if (this.n > 0){
          const freq = this.counts[i] / this.n;
          const theo = 1 / s;
          const ty = H - 24 - freq * (H - 46) / (1 / s * 1.2);
          Q.line(ctx, i * bw + 2, ty, (i + 1) * bw - 2, ty, '#58a6ff', 1.5);
        }
      }
      Q.text(ctx, 'outcome', W / 2, H - 8, '#8b949e', 10, 'center');
    },
    out: function(){
      const s = this.sides;
      const exp = (1 + s) / 2;
      const varv = (s * s - 1) / 12;
      const mean = this.n ? this.counts.reduce((a, c, i) => a + c * (i + 1), 0) / this.n : 0;
      const v = this.n ? this.counts.reduce((a, c, i) => a + c * ((i + 1) - mean) ** 2, 0) / this.n : 0;
      Q.$('prob-out').innerHTML =
        `rolls: <b>${this.n}</b> · empirical mean <b>${Q.fmt(mean)}</b> vs E[X] <b>${Q.fmt(exp)}</b> · empirical var <b>${Q.fmt(v)}</b> vs Var[X] <b>${Q.fmt(varv)}</b><br>` +
        `<span class="dim" style="color:#717174">E[X] = (1+${s})/2 = ${Q.fmt(exp)} &nbsp;·&nbsp; Var[X] = (${s}²−1)/12 = ${Q.fmt(varv)}</span>`;
    },
    draw2: function(){
      const ctx = this.cv2;
      const mu = +Q.$('prob-mu').value, sigma = +Q.$('prob-sigma').value;
      const x0 = +Q.$('prob-x').value;
      Q.clear(ctx, W, H);
      const xmin = mu - 4 * sigma, xmax = mu + 4 * sigma;
      const X = v => (v - xmin) / (xmax - xmin) * (W - 30) + 15;
      const Y = v => H - 24 - Q.normPdf(v, mu, sigma) / Q.normPdf(mu, mu, sigma) * (H - 60);
      // shade
      const xc = Math.min(Math.max(x0, xmin), xmax);
      const px = X(xc);
      ctx.fillStyle = 'rgba(63,185,80,0.18)';
      ctx.beginPath(); ctx.moveTo(15, H - 24);
      for (let v = xmin; v <= xc; v += (xmax - xmin) / 200) ctx.lineTo(X(v), Y(v));
      ctx.lineTo(px, H - 24); ctx.closePath(); ctx.fill();
      // curve
      ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let v = xmin; v <= xmax; v += (xmax - xmin) / 300){
        const x = X(v), y = Y(v);
        v === xmin ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      // mu line
      Q.line(ctx, X(mu), 10, X(mu), H - 24, '#8b949e', 1, [4, 4]);
      Q.text(ctx, 'μ=' + Q.fmt(mu), X(mu) + 5, 16, '#8b949e', 11);
      // x line
      Q.line(ctx, px, 10, px, H - 24, '#3fb950', 1.5, [3, 3]);
      Q.text(ctx, 'x=' + Q.fmt(x0), px + 5, 30, '#56d364', 11);
      const p = Q.normCdf(x0, mu, sigma);
      Q.$('prob-out2').innerHTML =
        `P(X ≤ ${Q.fmt(x0)}) = Φ(${Q.fmt((x0 - mu) / sigma)}) = <b class="r">${(p * 100).toFixed(2)}%</b><br>` +
        `<span style="color:#717174">z = (x−μ)/σ = ${Q.fmt((x0 - mu) / sigma)} · P(X ≥ ${Q.fmt(x0)}) = ${((1 - p) * 100).toFixed(2)}%</span>`;
    },
    clt: function(){
      const ctx = this.cv3;
      const k = +Q.$('prob-clt-k').value, n = +Q.$('prob-clt-n').value;
      const rnd = Q.rng(42);
      const sums = new Array(n);
      for (let i = 0; i < n; i++){
        let s = 0; for (let j = 0; j < k; j++) s += 1 + (rnd() * 6 | 0);
        sums[i] = s; }
      const min = k, max = 6 * k;
      const bins = Math.min(60, max - min + 1);
      const counts = new Array(bins).fill(0);
      for (let i = 0; i < n; i++){
        const b = Math.min(bins - 1, Math.floor((sums[i] - min) / (max - min + 1) * bins));
        counts[b]++; }
      Q.clear(ctx, W, H);
      const maxC = Math.max(...counts, 1);
      const bw = W / bins;
      for (let i = 0; i < bins; i++){
        const h = counts[i] / maxC * (H - 46);
        ctx.fillStyle = Q.hex(88, 166, 255, 0.85);
        ctx.fillRect(i * bw + 1, H - 24 - h, bw - 2, h);
      }
      // normal overlay
      const mu = k * 3.5, sigma = Math.sqrt(k * 35 / 12);
      ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 2; ctx.beginPath();
      for (let v = min; v <= max; v += (max - min) / 200){
        const x = (v - min) / (max - min + 1) * W;
        const y = H - 24 - Q.normPdf(v, mu, sigma) / Q.normPdf(mu, mu, sigma) * (H - 46);
        v === min ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      const m = Q.mean(sums), sd = Q.std(sums);
      Q.$('prob-out3').innerHTML =
        `sample mean <b>${Q.fmt(m)}</b> vs theory k·3.5 = <b>${Q.fmt(mu)}</b> · sample σ <b>${Q.fmt(sd)}</b> vs theory √(k·35/12) = <b>${Q.fmt(sigma)}</b> · n = ${n}`;
    },
    onResize: function(){}
  };
  Q.reg('probability', mod);
})();
