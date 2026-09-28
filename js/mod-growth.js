'use strict';
/* Module: Growth & Interest — linear vs exponential, compound interest, e, virus spread */
(function(){
  const W = 620, H = 300;

  const mod = {
    id: 'growth',
    init: function(){
      const el = Q.$('mod-growth');
      el.innerHTML = `
        <div class="mhead">
          <h2>Growth &amp; Compound Interest <span class="src">SETOSA · SEEING THEORY</span></h2>
          <p>Linear growth adds, exponential growth multiplies. This is why compounding is the most powerful force in finance — and why e shows up everywhere. Watch the difference explode, and see how compounding frequency converges to continuous growth.</p>
        </div>
        <div class="grid g2">
          <div class="card">
            <h3>📈 Linear vs Exponential <span class="tag">same starting point</span></h3>
            <div class="controls">
              <div class="ctl"><label>rate</label><input type="range" id="gr-rate" min="1" max="40" value="15"><span class="val" id="gr-rate-val">15%</span></div>
              <div class="ctl"><label>steps</label><input type="range" id="gr-steps" min="5" max="60" value="30"><span class="val" id="gr-steps-val">30</span></div>
              <button class="btn primary" id="gr-run">animate</button>
              <button class="btn" id="gr-reset">reset</button>
            </div>
            <canvas id="gr-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>linear: x₀ + r·t</span>
              <span><span class="swatch" style="background:#008B00"></span>exponential: x₀·(1+r)ᵗ</span>
            </div>
            <div class="readout" id="gr-out" style="margin-top:10px"></div>
          </div>
          <div class="card">
            <h3>💰 Compound Interest → e <span class="tag">(1 + r/n)^(n·t)</span></h3>
            <div class="controls">
              <div class="ctl"><label>principal</label><input type="number" id="gr-princ" value="1000" step="100" style="width:70px"></div>
              <div class="ctl"><label>rate</label><input type="range" id="gr-apr" min="1" max="25" value="8"><span class="val" id="gr-apr-val">8%</span></div>
              <div class="ctl"><label>years</label><input type="range" id="gr-years" min="1" max="50" value="20"><span class="val" id="gr-years-val">20</span></div>
              <div class="ctl"><label>compounds/yr</label><input type="range" id="gr-n" min="1" max="365" value="12"><span class="val" id="gr-n-val">12</span></div>
            </div>
            <canvas id="gr-cv2" width="${W}" height="${H}"></canvas>
            <div class="readout" id="gr-out2" style="margin-top:10px"></div>
            <div class="hint">as n → ∞, (1 + r/n)^(n·t) → e^(r·t). the dashed line is continuous compounding.</div>
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>🦠 Virus Spread — the logistic reality <span class="tag">exponential until it runs out of people</span></h3>
          <div class="controls">
            <div class="ctl"><label>R₀</label><input type="range" id="gr-r0" min="1" max="6" step="0.1" value="2.5"><span class="val" id="gr-r0-val">2.5</span></div>
            <div class="ctl"><label>population</label><input type="range" id="gr-pop" min="1000" max="100000" step="1000" value="10000"><span class="val" id="gr-pop-val">10k</span></div>
            <button class="btn primary" id="gr-sir-run">simulate</button>
          </div>
          <canvas id="gr-cv3" width="${W}" height="${H}"></canvas>
          <div class="readout" id="gr-out3" style="margin-top:10px"></div>
        </div>`;
      this.cv = Q.canvas('gr-cv', W, H);
      this.cv2 = Q.canvas('gr-cv2', W, H);
      this.cv3 = Q.canvas('gr-cv3', W, H);
      this.t = 0; this.timer = null;
      const self = this;
      Q.bind('gr-rate', 'input', e => { Q.$('gr-rate-val').textContent = e.target.value + '%'; });
      Q.bind('gr-steps', 'input', e => { Q.$('gr-steps-val').textContent = e.target.value; });
      Q.bind('gr-run', 'click', () => self.animate());
      Q.bind('gr-reset', 'click', () => { clearInterval(self.timer); self.t = 0; self.draw(); self.out(); });
      Q.bind('gr-apr', 'input', e => { Q.$('gr-apr-val').textContent = e.target.value + '%'; self.draw2(); self.out2(); });
      Q.bind('gr-years', 'input', e => { Q.$('gr-years-val').textContent = e.target.value; self.draw2(); self.out2(); });
      Q.bind('gr-n', 'input', e => { Q.$('gr-n-val').textContent = e.target.value; self.draw2(); self.out2(); });
      Q.bind('gr-princ', 'change', () => { self.draw2(); self.out2(); });
      Q.bind('gr-r0', 'input', e => { Q.$('gr-r0-val').textContent = e.target.value; });
      Q.bind('gr-pop', 'input', e => { Q.$('gr-pop-val').textContent = (+e.target.value >= 1000 ? (+e.target.value / 1000).toFixed(0) + 'k' : e.target.value); });
      Q.bind('gr-sir-run', 'click', () => self.sir());
      this.draw(); this.out(); this.draw2(); this.out2(); this.sir();
    },
    animate: function(){
      const self = this;
      clearInterval(this.timer);
      this.t = 0;
      this.timer = setInterval(() => {
        self.t++;
        self.draw(); self.out();
        if (self.t >= +Q.$('gr-steps').value) clearInterval(self.timer);
      }, 120);
    },
    draw: function(){
      const ctx = this.cv;
      const rate = +Q.$('gr-rate').value / 100, steps = +Q.$('gr-steps').value;
      Q.clear(ctx, W, H);
      const x0 = 1;
      const maxV = x0 * Math.pow(1 + rate, steps);
      const X = t => 15 + t / steps * (W - 30);
      const Y = v => H - 24 - v / maxV * (H - 50);
      // linear
      ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2; ctx.beginPath();
      for (let t = 0; t <= this.t; t++){ const x = X(t), y = Y(x0 + rate * t); t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      // exp
      ctx.strokeStyle = '#008B00'; ctx.lineWidth = 2; ctx.beginPath();
      for (let t = 0; t <= this.t; t++){ const x = X(t), y = Y(x0 * Math.pow(1 + rate, t)); t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      // dots
      if (this.t > 0){
        Q.circle(ctx, X(this.t), Y(x0 + rate * this.t), 4, '#1565C0', '#fff');
        Q.circle(ctx, X(this.t), Y(x0 * Math.pow(1 + rate, this.t)), 4, '#008B00', '#fff');
      }
      Q.text(ctx, 't=' + this.t, W - 40, 16, '#1F2023', 12);
    },
    out: function(){
      const rate = +Q.$('gr-rate').value / 100, steps = +Q.$('gr-steps').value;
      Q.$('gr-out').innerHTML =
        `after ${steps} steps: linear <b class="c">${Q.fmt(1 + rate * steps)}</b> vs exponential <b class="r">${Q.fmt(Math.pow(1 + rate, steps))}</b> — ratio <b>${Q.fmt(Math.pow(1 + rate, steps) / (1 + rate * steps))}×</b>`;
    },
    draw2: function(){
      const ctx = this.cv2;
      const P = +Q.$('gr-princ').value, r = +Q.$('gr-apr').value / 100, yrs = +Q.$('gr-years').value, n = +Q.$('gr-n').value;
      Q.clear(ctx, W, H);
      const maxV = P * Math.exp(r * yrs) * 1.05;
      const X = t => 15 + t / yrs * (W - 30);
      const Y = v => H - 24 - v / maxV * (H - 50);
      // discrete
      ctx.strokeStyle = '#008B00'; ctx.lineWidth = 2; ctx.beginPath();
      for (let t = 0; t <= yrs; t += 1 / n){
        const x = X(t), y = Y(P * Math.pow(1 + r / n, n * t));
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      // continuous
      ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (let t = 0; t <= yrs; t += 0.05){
        const x = X(t), y = Y(P * Math.exp(r * t));
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      Q.text(ctx, 'A(t) = P(1+r/n)^(nt)', W / 2, 14, '#00A800', 12, 'center');
      Q.text(ctx, 'A(t) = Pe^(rt)', W / 2, 30, '#1565C0', 12, 'center');
    },
    out2: function(){
      const P = +Q.$('gr-princ').value, r = +Q.$('gr-apr').value / 100, yrs = +Q.$('gr-years').value, n = +Q.$('gr-n').value;
      const disc = P * Math.pow(1 + r / n, n * yrs);
      const cont = P * Math.exp(r * yrs);
      const eff = Math.pow(1 + r / n, n) - 1;
      Q.$('gr-out2').innerHTML =
        `discrete (n=${n}): <b class="r">$${Q.fmt(disc, 2)}</b> · continuous: <b class="c">$${Q.fmt(cont, 2)}</b> · effective APR <b>${(eff * 100).toFixed(2)}%</b><br>` +
        `<span style="color:#717174">(1 + ${Q.fmt(r, 3)}/${n})^(${n}·${yrs}) = ${Q.fmt(disc, 2)} vs e^(${Q.fmt(r, 3)}·${yrs}) = ${Q.fmt(cont, 2)}</span>`;
    },
    sir: function(){
      const ctx = this.cv3;
      const R0 = +Q.$('gr-r0').value, N = +Q.$('gr-pop').value;
      const gamma = 0.2, beta = R0 * gamma;
      let S = N - 1, I = 1, R = 0;
      const days = 200, dt = 0.5;
      const Ss = [], Is = [], Rs = [];
      for (let d = 0; d < days; d += dt){
        Ss.push(S); Is.push(I); Rs.push(R);
        const dS = -beta * S * I / N * dt;
        const dI = (beta * S * I / N - gamma * I) * dt;
        const dR = gamma * I * dt;
        S += dS; I += dI; R += dR;
        if (I < 0.5 && d > 30) break;
      }
      Q.clear(ctx, W, H);
      const maxV = N;
      const X = i => 15 + i / (Ss.length - 1) * (W - 30);
      const Y = v => H - 24 - v / maxV * (H - 50);
      const plot = (arr, color) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        arr.forEach((v, i) => { const x = X(i), y = Y(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke(); };
      plot(Ss, '#1565C0'); plot(Is, '#008B00'); plot(Rs, '#6A1B9A');
            Q.text(ctx, 'S', W - 20, Y(Ss[Ss.length-1]), '#1565C0', 12, 'right');
            Q.text(ctx, 'I', W - 20, Y(Math.max(...Is)), '#00A800', 12, 'right');
            Q.text(ctx, 'R', W - 20, Y(Rs[Rs.length-1]), '#6A1B9A', 12, 'right');
      const peak = Math.max(...Is), peakDay = Is.indexOf(peak) * dt;
      const herd = 1 - 1 / R0;
      Q.$('gr-out3').innerHTML =
        `peak infected: <b class="r">${(peak / N * 100).toFixed(1)}%</b> of population (day ${peakDay.toFixed(0)}) · R₀ = ${R0} · herd immunity threshold <b>${(herd * 100).toFixed(0)}%</b><br>` +
        `<span style="color:#717174">SIR model: dS/dt = −βSI/N, dI/dt = βSI/N − γI, dR/dt = γI · β = R₀·γ</span>`;
    },
    onResize: function(){}
  };
  Q.reg('growth', mod);
})();
