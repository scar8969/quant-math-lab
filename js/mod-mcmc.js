'use strict';
/* Module: MCMC — Metropolis-Hastings, HMC, MALA on a 2D mixture target */
(function(){
  const W = 620, H = 420;

  // target: mixture of two gaussians (the classic MCMC gallery "two islands")
  function target(x, y){
    const g1 = Math.exp(-0.5 * ((x + 1.8) ** 2 + (y + 1.8) ** 2));
    const g2 = Math.exp(-0.5 * ((x - 1.8) ** 2 + (y - 1.8) ** 2));
    return 0.5 * g1 + 0.5 * g2;
  }
  function dtarget(x, y){
    const g1 = Math.exp(-0.5 * ((x + 1.8) ** 2 + (y + 1.8) ** 2));
    const g2 = Math.exp(-0.5 * ((x - 1.8) ** 2 + (y - 1.8) ** 2));
    const dx = -((x + 1.8) * g1 + (x - 1.8) * g2);
    const dy = -((y + 1.8) * g1 + (y - 1.8) * g2);
    return [dx, dy];
  }

  const mod = {
    id: 'mcmc',
    init: function(){
      const el = Q.$('mod-mcmc');
      el.innerHTML = `
        <div class="mhead">
          <h2>MCMC Sampling <span class="src">MCMC GALLERY · CHI FENG</span></h2>
          <p>Markov Chain Monte Carlo draws samples from a distribution we can only evaluate (not sample directly). The chain explores the target — a two-mode mixture here — and its histogram converges to the true density. Compare the classic samplers and watch the acceptance rate.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>🎯 Sampler comparison <span class="tag">target: 50/50 gaussian mixture</span></h3>
            <div class="controls">
              <div class="ctl"><label>algorithm</label><select id="mc-algo">
                <option value="mh">Random-walk Metropolis</option>
                <option value="mala">MALA</option>
                <option value="hmc">Hamiltonian MC</option>
              </select></div>
              <div class="ctl"><label>step σ</label><input type="range" id="mc-step" min="0.1" max="2" step="0.05" value="0.6"><span class="val" id="mc-step-val">0.60</span></div>
              <div class="ctl"><label>samples</label><input type="range" id="mc-n" min="500" max="20000" step="500" value="5000"><span class="val" id="mc-n-val">5000</span></div>
              <button class="btn primary" id="mc-run">sample</button>
            </div>
            <canvas id="mc-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>samples</span>
                            <span><span class="swatch" style="background:#008B00"></span>target contours</span>
            </div>
          </div>
          <div class="card">
            <h3>📊 Marginal histogram</h3>
            <canvas id="mc-cv2" width="300" height="200"></canvas>
            <div class="readout" id="mc-out" style="margin-top:10px"></div>
            <h3 style="margin-top:14px">⏱️ Trace (x)</h3>
            <canvas id="mc-cv3" width="300" height="110"></canvas>
            <div class="hint">HMC uses gradient info → far fewer rejections and faster mixing than random-walk</div>
          </div>
        </div>`;
      this.cv = Q.canvas('mc-cv', W, H);
      this.cv2 = Q.canvas('mc-cv2', 300, 200);
      this.cv3 = Q.canvas('mc-cv3', 300, 110);
      const self = this;
      Q.bind('mc-algo', 'change', () => self.sample());
      Q.bind('mc-step', 'input', e => { Q.$('mc-step-val').textContent = (+e.target.value).toFixed(2); });
      Q.bind('mc-n', 'input', e => { Q.$('mc-n-val').textContent = e.target.value; });
      Q.bind('mc-run', 'click', () => self.sample());
      this.sample();
    },
    sample: function(){
      const algo = Q.$('mc-algo').value;
      const step = +Q.$('mc-step').value;
      const n = +Q.$('mc-n').value;
      const rnd = Q.rng(1234);
      let x = 0, y = 0, acc = 0, total = 0;
      const pts = [], xs = [], ys = [];
      let vx = 0, vy = 0;
      for (let i = 0; i < n; i++){
        let xp, yp, logr;
        if (algo === 'mh'){
          xp = x + Q.gauss(rnd) * step; yp = y + Q.gauss(rnd) * step;
          logr = Math.log(target(xp, yp) / target(x, y));
        } else if (algo === 'mala'){
          const g = dtarget(x, y);
          const meanx = x + step * step / 2 * g[0];
          const meany = y + step * step / 2 * g[1];
          xp = meanx + Q.gauss(rnd) * step; yp = meany + Q.gauss(rnd) * step;
          const g2 = dtarget(xp, yp);
          const q1 = -((x - xp - step * step / 2 * g2[0]) ** 2) / (2 * step * step);
          const q2 = -((y - yp - step * step / 2 * g2[1]) ** 2) / (2 * step * step);
          logr = Math.log(target(xp, yp) / target(x, y)) + q1 + q2;
        } else { // hmc
          const L = 10, eps = step * 0.4;
          let qx = x, qy = y;
          let px = Q.gauss(rnd), py = Q.gauss(rnd);
          let p0x = px, p0y = py;
          // leapfrog
          let g = dtarget(qx, qy);
          px += eps / 2 * g[0]; py += eps / 2 * g[1];
          for (let l = 0; l < L; l++){
            qx += eps * px; qy += eps * py;
            g = dtarget(qx, qy);
            if (l < L - 1){ px += eps * g[0]; py += eps * g[1]; }
          }
          px += eps / 2 * g[0]; py += eps / 2 * g[1];
          const H0 = 0.5 * (p0x ** 2 + p0y ** 2) - Math.log(target(x, y));
          const H1 = 0.5 * (px ** 2 + py ** 2) - Math.log(target(qx, qy));
          logr = H0 - H1;
          xp = qx; yp = qy;
        }
        total++;
        if (Math.log(rnd()) < logr){ x = xp; y = yp; acc++; }
        pts.push([x, y]); xs.push(x); ys.push(y);
      }
      this.pts = pts; this.accRate = acc / total;
      this.draw(); this.out();
    },
    draw: function(){
      const ctx = this.cv;
      Q.clear(ctx, W, H);
      const X = v => W / 2 + v * 75;
      const Y = v => H / 2 - v * 75;
      // target density background
      const img = ctx.createImageData(W, H);
      for (let px = 0; px < W; px += 2){
        for (let py = 0; py < H; py += 2){
          const x = (px - W / 2) / 75, y = (H / 2 - py) / 75;
          const v = target(x, y) / 0.5;
          const i = (py * W + px) * 4;
          img.data[i] = 240 - v * 25;
          img.data[i+1] = 244 - v * 18;
          img.data[i+2] = 248 - v * 15;
          img.data[i+3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // samples
      this.pts.forEach(p => Q.circle(ctx, X(p[0]), Y(p[1]), 1.8, '#1565C0', '', 0));
      // contours of target
      ctx.strokeStyle = 'rgba(0,139,0,0.6)'; ctx.lineWidth = 1.2;
      for (let c = 0.05; c <= 0.45; c += 0.1){
        ctx.beginPath();
        for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.05){
          const x = -1.8 + 0.8 * Math.cos(a) * (c / 0.45), y = -1.8 + 0.8 * Math.sin(a) * (c / 0.45);
          const xx = X(x), yy = Y(y);
          a === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke();
        ctx.beginPath();
        for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.05){
          const x = 1.8 + 0.8 * Math.cos(a) * (c / 0.45), y = 1.8 + 0.8 * Math.sin(a) * (c / 0.45);
          const xx = X(x), yy = Y(y);
          a === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke();
      }
      Q.text(ctx, 'x', W - 12, H / 2 + 12, '#717174', 11, 'right');
      Q.text(ctx, 'y', W / 2 + 8, 12, '#717174', 11);
      // histogram
      const c2 = this.cv2;
      Q.clear(c2, 300, 200);
      const xs = this.pts.map(p => p[0]);
      const bins = 30, min = -4, max = 4;
      const counts = new Array(bins).fill(0);
      xs.forEach(v => { const b = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / (max - min) * bins))); counts[b]++; });
      const maxC = Math.max(...counts, 1);
      const bw = 300 / bins;
      const ctx2 = c2;
      counts.forEach((c, i) => {
        const h = c / maxC * 160;
        ctx2.fillStyle = Q.hex(21, 101, 192, 0.8);
        ctx2.fillRect(i * bw + 1, 185 - h, bw - 2, h);
      });
      // true marginal: 0.5 N(-1.8,1) + 0.5 N(1.8,1)
      ctx2.strokeStyle = '#008B00'; ctx2.lineWidth = 2; ctx2.beginPath();
      for (let v = min; v <= max; v += 0.05){
        const d = 0.5 * Q.normPdf(v, -1.8, 1) + 0.5 * Q.normPdf(v, 1.8, 1);
        const x = (v - min) / (max - min) * 300;
        const y = 185 - d / 0.5 * 160;
        v === min ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y); }
      ctx2.stroke();
      Q.text(c2, 'marginal x', 150, 12, '#717174', 11, 'center');
      // trace
      const c3 = this.cv3;
      Q.clear(c3, 300, 110);
      const ctx3 = c3;
      ctx3.strokeStyle = '#B07D00'; ctx3.lineWidth = 1.2; ctx3.beginPath();
      xs.forEach((v, i) => {
        const x = i / (xs.length - 1) * 290 + 5;
        const y = 100 - (v + 4) / 8 * 90;
        i === 0 ? ctx3.moveTo(x, y) : ctx3.lineTo(x, y); });
      ctx3.stroke();
      Q.text(c3, 'trace x', 150, 8, '#717174', 10, 'center');
    },
    out: function(){
      const algo = Q.$('mc-algo').value;
      const names = { mh: 'Random-walk Metropolis', mala: 'MALA', hmc: 'Hamiltonian MC' };
      const xs = this.pts.map(p => p[0]), ys = this.pts.map(p => p[1]);
      Q.$('mc-out').innerHTML =
        `${names[algo]} · n = ${this.pts.length} · acceptance <b class="${this.accRate > 0.4 ? 'g' : 'r'}">${(this.accRate * 100).toFixed(1)}%</b><br>` +
        `mean x = <b>${Q.fmt(Q.mean(xs))}</b> (true 0) · mean y = <b>${Q.fmt(Q.mean(ys))}</b> (true 0)<br>` +
        `<span style="color:#717174">target ∝ ½N(−1.8,1) + ½N(+1.8,1) · MH acceptance ~23% optimal (random walk), HMC can hit 90%+</span>`;
    },
    onResize: function(){}
  };
  Q.reg('mcmc', mod);
})();
