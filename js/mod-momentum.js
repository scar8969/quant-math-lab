'use strict';
/* Module: Momentum Optimization — why momentum works (Distill) */
(function(){
  const W = 620, H = 400;

  const mod = {
    id: 'momentum',
    init: function(){
      const el = Q.$('mod-momentum');
      el.innerHTML = `
        <div class="mhead">
          <h2>Why Momentum Really Works <span class="src">DISTILL · 2017</span></h2>
          <p>Plain gradient descent zig-zags across a loss surface when the curvature differs between directions. Momentum averages the gradient history, damping the high-curvature (fast) direction and letting the low-curvature (slow) direction accelerate — exactly like a heavy ball rolling down the bowl.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>⚡ Loss surface: f(x,y) = λx² + y² <span class="tag">λ = curvature ratio</span></h3>
            <div class="controls">
              <div class="ctl"><label>λ</label><input type="range" id="mo-lambda" min="2" max="40" value="10"><span class="val" id="mo-lambda-val">10</span></div>
              <div class="ctl"><label>β (momentum)</label><input type="range" id="mo-beta" min="0" max="0.99" step="0.01" value="0.9"><span class="val" id="mo-beta-val">0.90</span></div>
              <div class="ctl"><label>α (step)</label><input type="range" id="mo-alpha" min="0.01" max="0.2" step="0.01" value="0.05"><span class="val" id="mo-alpha-val">0.05</span></div>
              <button class="btn primary" id="mo-run">run</button>
              <button class="btn" id="mo-reset">reset</button>
            </div>
            <canvas id="mo-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>gradient descent</span>
              <span><span class="swatch" style="background:#008B00"></span>momentum</span>
            </div>
          </div>
          <div class="card">
            <h3>📉 Convergence</h3>
            <canvas id="mo-cv2" width="300" height="200"></canvas>
            <div class="readout" id="mo-out" style="margin-top:10px"></div>
            <div class="hint">optimal α for momentum is ~(√λ−1)/(√λ+1) — the "magic" step size from the Distill article</div>
          </div>
        </div>`;
      this.cv = Q.canvas('mo-cv', W, H);
      this.cv2 = Q.canvas('mo-cv2', 300, 200);
      this.timer = null;
      const self = this;
      Q.bind('mo-lambda', 'input', e => { Q.$('mo-lambda-val').textContent = e.target.value; self.draw(); });
      Q.bind('mo-beta', 'input', e => { Q.$('mo-beta-val').textContent = (+e.target.value).toFixed(2); });
      Q.bind('mo-alpha', 'input', e => { Q.$('mo-alpha-val').textContent = (+e.target.value).toFixed(3); });
      Q.bind('mo-run', 'click', () => self.run());
      Q.bind('mo-reset', 'click', () => { clearInterval(self.timer); self.reset(); });
      this.reset();
    },
    reset: function(){
      this.gd = { x: 1.0, y: 0.9, hist: [] };
      this.mom = { x: 1.0, y: 0.9, vx: 0, vy: 0, hist: [] };
      this.t = 0;
      this.draw(); this.out();
    },
    run: function(){
      const self = this;
      clearInterval(this.timer);
      this.reset();
      this.timer = setInterval(() => {
        self.step();
        self.draw(); self.out();
        if (self.gd.hist.length > 400) clearInterval(self.timer);
      }, 30);
    },
    step: function(){
      const lam = +Q.$('mo-lambda').value, beta = +Q.$('mo-beta').value, alpha = +Q.$('mo-alpha').value;
      // GD: x -= alpha * grad
      const g = this.gd;
      g.x -= alpha * 2 * lam * g.x;
      g.y -= alpha * 2 * g.y;
      g.hist.push([g.x, g.y]);
      // momentum: v = beta*v - alpha*grad; x += v
      const m = this.mom;
      m.vx = beta * m.vx - alpha * 2 * lam * m.x;
      m.vy = beta * m.vy - alpha * 2 * m.y;
      m.x += m.vx; m.y += m.vy;
      m.hist.push([m.x, m.y]);
      this.t++;
    },
    draw: function(){
      const ctx = this.cv;
      const lam = +Q.$('mo-lambda').value;
      Q.clear(ctx, W, H);
      // contour map of f = lam*x^2 + y^2
      const X = v => W / 2 + v * 110;
      const Y = v => H / 2 - v * 110;
      // background gradient
      const img = ctx.createImageData(W, H);
      for (let px = 0; px < W; px++){
        for (let py = 0; py < H; py++){
          const x = (px - W / 2) / 110, y = (H / 2 - py) / 110;
          const v = Math.min(1, (lam * x * x + y * y) / 30);
          const i = (py * W + px) * 4;
          img.data[i] = 245 - v * 20;
          img.data[i+1] = 246 - v * 15;
          img.data[i+2] = 247 - v * 12;
          img.data[i+3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // contours
      ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 1;
      for (let c = 1; c <= 8; c++){
        ctx.beginPath();
        const r = Math.sqrt(c * 3 / lam);
        for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.05){
          const x = X(r * Math.cos(a)), y = Y(r * Math.sin(a));
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      Q.line(ctx, X(-2.2), 0, X(2.2), 0, 'rgba(0,0,0,0.15)', 1);
      Q.line(ctx, 0, Y(-2.2), 0, Y(2.2), 'rgba(0,0,0,0.15)', 1);
      // paths
      const drawPath = (hist, col, dots) => {
        if (hist.length < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
        hist.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke();
        if (dots) hist.forEach((p, i) => { if (i % 5 === 0) Q.circle(ctx, X(p[0]), Y(p[1]), 2.5, col, '', 0); });
      };
      drawPath(this.gd.hist, '#1565C0', true);
      drawPath(this.mom.hist, '#008B00', true);
      // current positions
      if (this.gd.hist.length){
        const gp = this.gd.hist[this.gd.hist.length - 1], mp = this.mom.hist[this.mom.hist.length - 1];
        Q.circle(ctx, X(gp[0]), Y(gp[1]), 5, '#1565C0', '#fff', 2);
        Q.circle(ctx, X(mp[0]), Y(mp[1]), 5, '#008B00', '#fff', 2);
      }
      Q.circle(ctx, X(0), Y(0), 4, '#008B00', '#fff', 2);
      Q.text(ctx, 'λ=' + lam, W - 60, 16, '#717174', 12);
            this.drawConv();
          },
          drawConv: function(){
            const ctx = this.cv2;
            const lam = +Q.$('mo-lambda').value;
            Q.clear(ctx, 300, 200);
            Q.line(ctx, 10, 190, 290, 190, '#D5D6D8', 1);
            Q.line(ctx, 10, 10, 10, 190, '#D5D6D8', 1);
            const maxSteps = Math.max(this.gd.hist.length, this.mom.hist.length, 1);
            const plot = (hist, color) => {
              if (hist.length < 2) return;
              const losses = hist.map(p => lam * p[0] ** 2 + p[1] ** 2);
                            const maxL = Math.log10(Math.max(...losses, 1e-16));
                            const minLoss = Math.max(Math.min(...losses), 1e-16);
                            const minL = Math.log10(minLoss);
                            const range = maxL - minL || 1;
              ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
              losses.forEach((L, i) => {
                const x = 10 + i / (maxSteps - 1) * 275;
                const y = 190 - (maxL - Math.log10(Math.max(L, 1e-16))) / range * 170;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
              });
              ctx.stroke();
            };
            plot(this.gd.hist, '#1565C0');
            plot(this.mom.hist, '#008B00');
            Q.text(ctx, 'log₁₀(loss)', 5, 12, '#717174', 10);
            Q.text(ctx, 'iter', 280, 196, '#717174', 10);
          },
          out: function(){
      const lam = +Q.$('mo-lambda').value, beta = +Q.$('mo-beta').value;
      const gd = this.gd.hist.length ? this.gd.hist[this.gd.hist.length - 1] : [1, 0.9];
      const mom = this.mom.hist.length ? this.mom.hist[this.mom.hist.length - 1] : [1, 0.9];
      const gdLoss = lam * gd[0] ** 2 + gd[1] ** 2;
      const momLoss = lam * mom[0] ** 2 + mom[1] ** 2;
      const opt = (Math.sqrt(lam) - 1) / (Math.sqrt(lam) + 1);
      Q.$('mo-out').innerHTML =
        `GD loss <b class="c">${Q.fmt(gdLoss)}</b> · momentum loss <b class="r">${Q.fmt(momLoss)}</b> · steps ${this.t}<br>` +
        `<span style="color:#717174">optimal β ≈ ${Q.fmt(opt, 3)} for λ=${lam} · momentum damps the fast axis (λ) and accelerates the slow one (1)</span>`;
    },
    onResize: function(){}
  };
  Q.reg('momentum', mod);
})();
