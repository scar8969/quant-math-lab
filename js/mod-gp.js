'use strict';
/* Module: Gaussian Processes — prior/posterior with RBF kernel, hyperparameter sliders */
(function(){
  const W = 620, H = 340;

  const mod = {
    id: 'gp',
    init: function(){
      const el = Q.$('mod-gp');
      el.innerHTML = `
        <div class="mhead">
          <h2>Gaussian Processes <span class="src">DISTILL · 2019</span></h2>
          <p>A Gaussian process is a distribution over functions: any finite set of points has a joint Gaussian distribution, with covariance given by a kernel. Click on the plot to add observations — the posterior mean snaps through them and the uncertainty (shaded) collapses near data, exactly like the Distill exploration.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>🌫️ GP regression <span class="tag">click to add data</span></h3>
                        <div class="controls">
                          <div class="ctl"><label>kernel</label><select id="gp-k"><option value="rbf">RBF</option><option value="m32">Matern 3/2</option><option value="m52">Matern 5/2</option></select></div>
                          <div class="ctl"><label>length ℓ</label><input type="range" id="gp-l" min="0.1" max="2" step="0.05" value="0.6"><span class="val" id="gp-l-val">0.60</span></div>
              <div class="ctl"><label>σ_f</label><input type="range" id="gp-sf" min="0.1" max="2" step="0.05" value="1"><span class="val" id="gp-sf-val">1.00</span></div>
              <div class="ctl"><label>σ_n (noise)</label><input type="range" id="gp-sn" min="0.01" max="0.3" step="0.01" value="0.05"><span class="val" id="gp-sn-val">0.05</span></div>
              <button class="btn" id="gp-clear">clear</button>
              <button class="btn" id="gp-sin">sine</button>
              <button class="btn" id="gp-step">step</button>
            </div>
            <canvas id="gp-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>posterior mean</span>
              <span><span class="swatch" style="background:rgba(21,101,192,.25)"></span>±2σ uncertainty</span>
              <span><span class="swatch" style="background:#008B00"></span>observations</span>
            </div>
          </div>
          <div class="card">
            <h3>🧠 Prior samples <span class="tag">draw functions from the GP</span></h3>
            <canvas id="gp-cv2" width="300" height="200"></canvas>
            <div class="readout" id="gp-out" style="margin-top:10px"></div>
            <h3 style="margin-top:14px">📏 Kernel: k(x,x') = σ_f²·exp(−(x−x')²/2ℓ²)</h3>
            <canvas id="gp-cv3" width="300" height="90"></canvas>
            <div class="hint">ℓ = how far correlation reaches · σ_f = function amplitude · σ_n = observation noise</div>
          </div>
        </div>`;
      this.cv = Q.canvas('gp-cv', W, H);
      this.cv2 = Q.canvas('gp-cv2', 300, 200);
      this.cv3 = Q.canvas('gp-cv3', 300, 90);
      this.cvEl = Q.$('gp-cv');
            this.data = [];
            this.ktype = 'rbf';
      const self = this;
      Q.bind('gp-k', 'change', e => { self.ktype = e.target.value; self.draw(); self.draw2(); self.draw3(); self.out(); });
      Q.bind('gp-l', 'input', e => { Q.$('gp-l-val').textContent = (+e.target.value).toFixed(2); self.draw(); self.draw2(); self.draw3(); });
      Q.bind('gp-sf', 'input', e => { Q.$('gp-sf-val').textContent = (+e.target.value).toFixed(2); self.draw(); self.draw2(); self.draw3(); });
      Q.bind('gp-sn', 'input', e => { Q.$('gp-sn-val').textContent = (+e.target.value).toFixed(2); self.draw(); self.draw2(); self.draw3(); });
      Q.bind('gp-clear', 'click', () => { self.data = []; self.draw(); self.out(); });
      Q.bind('gp-sin', 'click', () => { self.data = []; for (let i = 0; i < 6; i++) self.data.push([-2.2 + i * 0.9, Math.sin(-2.2 + i * 0.9) * 0.7]); self.draw(); self.out(); });
      Q.bind('gp-step', 'click', () => { self.data = [[-1.5, -0.6], [-0.5, -0.6], [0.5, 0.6], [1.5, 0.6]]; self.draw(); self.out(); });
      this.cvEl.addEventListener('mousedown', e => {
        const r = this.cvEl.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * 6 - 3;
        const y = 1.5 - (e.clientY - r.top) / r.height * 3;
        this.data.push([x, y]);
        this.draw(); this.out();
      });
      this.draw(); this.draw2(); this.draw3(); this.out();
    },
    kernel: function(x1, x2, l, sf){
          const d = Math.abs(x1 - x2);
          if (this.ktype === 'm32'){
            const r = Math.sqrt(3) * d / l;
            return sf * sf * (1 + r) * Math.exp(-r);
          }
          if (this.ktype === 'm52'){
            const r = Math.sqrt(5) * d / l;
            return sf * sf * (1 + r + r * r / 3) * Math.exp(-r);
          }
          // rbf
          return sf * sf * Math.exp(-(d * d) / (2 * l * l));
        },
    posterior: function(){
      const l = +Q.$('gp-l').value, sf = +Q.$('gp-sf').value, sn = +Q.$('gp-sn').value;
      const xs = this.data.map(d => d[0]), ys = this.data.map(d => d[1]);
      const n = xs.length;
      const test = [];
      for (let x = -3; x <= 3; x += 0.06) test.push(x);
      if (n === 0){
        return { test, means: test.map(() => 0), vars: test.map(() => sf * sf), n: 0 };
      }
      // K = Kxx + sn^2 I
      const K = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => this.kernel(xs[i], xs[j], l, sf) + (i === j ? sn * sn : 0)));
      const L = Q.cholesky(K);
      const alpha = Q.solveChol(L, ys); // K^-1 y (compute once)
      const means = [], vars = [];
      test.forEach(x => {
        const ks = xs.map(xx => this.kernel(x, xx, l, sf));
        const kss = this.kernel(x, x, l, sf);
        let mu = 0;
        for (let i = 0; i < n; i++) mu += ks[i] * alpha[i];
        // z = L^-1 k* (forward substitution only); cov = k** - z^T z
        const z = Q.solveForward(L, ks);
        let vv = kss;
        for (let i = 0; i < n; i++) vv -= z[i] ** 2;
        means.push(mu); vars.push(Math.max(0, vv));
      });
      return { test, means, vars, n };
    },
    draw: function(){
      const ctx = this.cv;
      Q.clear(ctx, W, H);
      const X = v => (v + 3) / 6 * W;
      const Y = v => H / 2 - v / 1.5 * (H / 2 - 20);
      // grid
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++){ Q.line(ctx, X(i), 10, X(i), H - 10, 'rgba(0,0,0,0.05)', 1); }
      for (let j = -1; j <= 1; j++){ Q.line(ctx, 10, Y(j), W - 10, Y(j), 'rgba(0,0,0,0.05)', 1); }
      Q.line(ctx, 10, Y(0), W - 10, Y(0), '#D5D6D8', 1);
      const p = this.posterior();
      // uncertainty band
      ctx.fillStyle = 'rgba(21,101,192,0.16)';
      ctx.beginPath();
      p.test.forEach((x, i) => { const xx = X(x), yy = Y(p.means[i] + 2 * Math.sqrt(p.vars[i])); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
      for (let i = p.test.length - 1; i >= 0; i--){ const x = p.test[i]; ctx.lineTo(X(x), Y(p.means[i] - 2 * Math.sqrt(p.vars[i]))); }
      ctx.closePath(); ctx.fill();
      // mean
      ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2.4; ctx.beginPath();
      p.test.forEach((x, i) => { const xx = X(x), yy = Y(p.means[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); });
      ctx.stroke();
      // data
      this.data.forEach(d => Q.circle(ctx, X(d[0]), Y(d[1]), 5, '#008B00', '#fff', 2));
      Q.text(ctx, 'n = ' + p.n, W - 50, 16, '#717174', 12);
    },
    draw2: function(){
      const ctx = this.cv2;
      Q.clear(ctx, 300, 200);
      const l = +Q.$('gp-l').value, sf = +Q.$('gp-sf').value;
      const rnd = Q.rng(99);
      const xs = [];
      for (let x = -3; x <= 3; x += 0.12) xs.push(x);
      const n = xs.length;
      const K = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => this.kernel(xs[i], xs[j], l, sf) + 1e-8 * (i === j ? 1 : 0)));
      const L = Q.cholesky(K);
      const X = v => (v + 3) / 6 * 300;
      const Y = v => 100 - v / 1.5 * 80;
      const colors = ['#1565C0', '#008B00', '#008B00', '#B07D00', '#6A1B9A'];
      for (let s = 0; s < 4; s++){
              const z = xs.map(() => Q.gauss(rnd));
              const f = Q.matVec(L, z); // f ~ N(0, K) since Cov(Lz) = L*I*L^T = K
              ctx.strokeStyle = colors[s % 5]; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8; ctx.beginPath();
        f.forEach((v, i) => { const x = X(xs[i]), y = Y(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      Q.line(ctx, 10, Y(0), 290, Y(0), '#D5D6D8', 1, [4, 4]);
      Q.text(ctx, 'prior samples', 150, 12, '#717174', 11, 'center');
    },
    draw3: function(){
      const ctx = this.cv3;
      Q.clear(ctx, 300, 90);
      const l = +Q.$('gp-l').value, sf = +Q.$('gp-sf').value;
      const X = v => (v + 4) / 8 * 290 + 5;
      const Y = v => 75 - v / (sf * sf) * 55;
      ctx.strokeStyle = '#6A1B9A'; ctx.lineWidth = 2; ctx.beginPath();
      for (let d = -4; d <= 4; d += 0.05){
        const x = X(d), y = Y(this.kernel(0, d, l, sf));
        d === -4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      Q.line(ctx, X(0), 10, X(0), 80, '#D5D6D8', 1, [3, 3]);
      Q.text(ctx, 'k(0, x)', 150, 12, '#6A1B9A', 11, 'center');
    },
    out: function(){
      const p = this.posterior();
      const l = +Q.$('gp-l').value, sf = +Q.$('gp-sf').value;
      Q.$('gp-out').innerHTML =
        `ℓ = <b>${Q.fmt(l)}</b> · σ_f = <b>${Q.fmt(sf)}</b> · observations <b>${p.n}</b><br>` +
        `<span style="color:#717174">posterior: f|X,y ~ GP(m, k) with m(x) = k(x,X)ᵀ(K+σ²I)⁻¹y — exact Bayesian inference, no training loop</span>`;
    },
    onResize: function(){}
  };
  Q.reg('gp', mod);
})();
