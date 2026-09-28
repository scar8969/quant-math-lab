'use strict';
/* Module: PCA — draggable 2D points, eigen-decomposition of covariance, PC axes */
(function(){
  const W = 620, H = 420;

  const mod = {
    id: 'pca',
    init: function(){
      const el = Q.$('mod-pca');
      el.innerHTML = `
        <div class="mhead">
          <h2>Principal Component Analysis <span class="src">SETOSA</span></h2>
          <p>PCA finds the directions of maximum variance in a dataset. Drag the points around — the red axes (PC1, PC2) are the eigenvectors of the covariance matrix, and their eigenvalues are the variance explained. The projection shows how much information survives when you drop PC2.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>📊 Drag the points <span class="tag">PC axes = eigenvectors of Σ</span></h3>
            <div class="controls">
              <button class="btn primary" id="pca-random">random blob</button>
              <button class="btn" id="pca-circle">circle</button>
              <button class="btn" id="pca-line">line</button>
              <button class="btn" id="pca-clear">clear</button>
              <div class="ctl"><label>n points</label><input type="range" id="pca-n" min="10" max="200" value="60"><span class="val" id="pca-n-val">60</span></div>
            </div>
            <canvas id="pca-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>PC1 (most variance)</span>
              <span><span class="swatch" style="background:#008B00"></span>PC2</span>
            </div>
          </div>
          <div class="card">
            <h3>📉 Variance explained</h3>
            <canvas id="pca-cv2" width="300" height="200"></canvas>
            <div class="readout" id="pca-out" style="margin-top:10px"></div>
            <h3 style="margin-top:14px">↘️ Projection onto PC1</h3>
            <canvas id="pca-cv3" width="300" height="120"></canvas>
            <div class="hint">dropping PC2 keeps the most variance — this is dimensionality reduction</div>
          </div>
        </div>`;
      this.cv = Q.canvas('pca-cv', W, H);
      this.cv2 = Q.canvas('pca-cv2', 300, 200);
      this.cv3 = Q.canvas('pca-cv3', 300, 120);
      this.cvEl = Q.$('pca-cv');
      this.pts = [];
      this.dragIdx = -1;
      const self = this;
      const rnd = Q.rng(7);
      for (let i = 0; i < 60; i++){
        const a = rnd() * 2 * Math.PI, r = Math.sqrt(rnd()) * 90;
        this.pts.push([W / 2 + Math.cos(a) * r * 1.6, H / 2 + Math.sin(a) * r * 0.7]); }
      Q.bind('pca-random', 'click', () => { self.genBlob(); });
      Q.bind('pca-circle', 'click', () => { self.genCircle(); });
      Q.bind('pca-line', 'click', () => { self.genLine(); });
      Q.bind('pca-clear', 'click', () => { self.pts = []; self.draw(); self.out(); });
      Q.bind('pca-n', 'input', e => { Q.$('pca-n-val').textContent = e.target.value; });
      this.cvEl.addEventListener('mousedown', e => {
        const r = this.cvEl.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
        let best = -1, bd = 12;
        this.pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd){ bd = d; best = i; } });
        if (best >= 0){ this.dragIdx = best; }
        else { this.pts.push([x, y]); this.dragIdx = this.pts.length - 1; }
        this.draw(); this.out();
      });
      window.addEventListener('mousemove', e => {
        if (this.dragIdx < 0) return;
        const r = this.cvEl.getBoundingClientRect();
        this.pts[this.dragIdx] = [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
        this.draw(); this.out();
      });
      window.addEventListener('mouseup', () => { this.dragIdx = -1; });
      this.draw(); this.out();
    },
    genBlob: function(){
      const n = +Q.$('pca-n').value, rnd = Q.rng(Date.now() & 0xffff);
      this.pts = [];
      for (let i = 0; i < n; i++){
        const x = Q.gauss(rnd) * 55 + W / 2, y = Q.gauss(rnd) * 22 + H / 2;
        this.pts.push([x, y]); }
      this.draw(); this.out();
    },
    genCircle: function(){
      const n = +Q.$('pca-n').value, rnd = Q.rng(Date.now() & 0xffff);
      this.pts = [];
      for (let i = 0; i < n; i++){
        const a = rnd() * 2 * Math.PI, r = Math.sqrt(rnd()) * 80;
        this.pts.push([W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r]); }
      this.draw(); this.out();
    },
    genLine: function(){
      const n = +Q.$('pca-n').value, rnd = Q.rng(Date.now() & 0xffff);
      this.pts = [];
      for (let i = 0; i < n; i++){
        const t = (rnd() - 0.5) * 2 * 110;
        this.pts.push([W / 2 + t * 0.8 + Q.gauss(rnd) * 8, H / 2 + t * 0.6 + Q.gauss(rnd) * 8]); }
      this.draw(); this.out();
    },
    pca: function(){
      const xs = this.pts.map(p => p[0]), ys = this.pts.map(p => p[1]);
      const mx = Q.mean(xs), my = Q.mean(ys);
      if (this.pts.length < 2) return { mx, my, pc1: [1, 0], pc2: [0, 1], l1: 0, l2: 0 };
      let cxx = 0, cyy = 0, cxy = 0;
      for (let i = 0; i < this.pts.length; i++){
        cxx += (xs[i] - mx) ** 2; cyy += (ys[i] - my) ** 2; cxy += (xs[i] - mx) * (ys[i] - my); }
      const n = this.pts.length;
      cxx /= n; cyy /= n; cxy /= n;
      const eigs = Q.eig2(cxx, cxy, cxy, cyy);
      return { mx, my, pc1: eigs[0].vec, pc2: eigs[1].vec, l1: eigs[0].val, l2: eigs[1].val };
    },
    draw: function(){
      const ctx = this.cv;
      Q.clear(ctx, W, H);
      // grid
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 60){ Q.line(ctx, i, 0, i, H, 'rgba(0,0,0,0.05)', 1); }
      for (let j = 0; j < H; j += 60){ Q.line(ctx, 0, j, W, j, 'rgba(0,0,0,0.05)', 1); }
      const p = this.pca();
      // points
      this.pts.forEach(pt => Q.circle(ctx, pt[0], pt[1], 3.2, '#1565C0', 'rgba(21,101,192,0.4)', 1));
      // PC axes through mean
      const len = 150;
      const ax = (v, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
        ctx.moveTo(p.mx - v[0] * len, p.my - v[1] * len);
        ctx.lineTo(p.mx + v[0] * len, p.my + v[1] * len); ctx.stroke(); };
      ax(p.pc2, '#008B00'); ax(p.pc1, '#1565C0');
      Q.circle(ctx, p.mx, p.my, 4, '#fff', '#fff', 2);
      Q.text(ctx, 'PC1 λ=' + Q.fmt(p.l1), p.mx + p.pc1[0] * len + 6, p.my + p.pc1[1] * len + 4, '#1565C0', 12, 'left', 'bold');
      Q.text(ctx, 'PC2 λ=' + Q.fmt(p.l2), p.mx + p.pc2[0] * len + 6, p.my + p.pc2[1] * len + 4, '#00A800', 12, 'left', 'bold');
      // variance bars
      const c2 = this.cv2;
      Q.clear(c2, 300, 200);
      const total = p.l1 + p.l2;
      const frac = total > 0 ? [p.l1 / total, p.l2 / total] : [0.5, 0.5];
      const bw = 90;
      const ctx2 = c2;
      [0, 1].forEach(i => {
        const x = 40 + i * 140;
        const h = frac[i] * 140;
        ctx2.fillStyle = i === 0 ? '#1565C0' : '#008B00';
        ctx2.fillRect(x, 170 - h, bw, h);
        Q.text(ctx2, 'PC' + (i + 1), x + bw / 2, 185, '#717174', 11, 'center');
        Q.text(ctx2, (frac[i] * 100).toFixed(1) + '%', x + bw / 2, 170 - h - 8, '#1F2023', 12, 'center');
      });
      Q.text(c2, 'variance explained', 150, 14, '#717174', 11, 'center');
      // projection
      const c3 = this.cv3;
      Q.clear(c3, 300, 120);
      const proj = this.pts.map(pt => (pt[0] - p.mx) * p.pc1[0] + (pt[1] - p.my) * p.pc1[1]);
      const mxp = Math.max(...proj), mnp = Math.min(...proj);
      proj.forEach(v => {
        const x = 15 + (v - mnp) / (mxp - mnp || 1) * 270;
        Q.circle(c3, x, 60, 3, '#1565C0', 'rgba(21,101,192,0.4)', 1);
      });
      Q.text(c3, 'PC1 scores (1-D view)', 150, 15, '#717174', 11, 'center');
    },
    out: function(){
      const p = this.pca();
      const total = p.l1 + p.l2;
      const f1 = total > 0 ? p.l1 / total * 100 : 0;
      const r = Q.corr(this.pts.map(pt => pt[0]), this.pts.map(pt => pt[1]));
      Q.$('pca-out').innerHTML =
        `λ₁ = <b class="c">${Q.fmt(p.l1)}</b> (${f1.toFixed(1)}% variance) · λ₂ = <b class="r">${Q.fmt(p.l2)}</b> (${(100 - f1).toFixed(1)}%)<br>` +
        `corr(x,y) = <b>${Q.fmt(r)}</b> · PC1 = [${Q.fmt(p.pc1[0], 2)}, ${Q.fmt(p.pc1[1], 2)}] · n = ${this.pts.length}<br>` +
        `<span style="color:#717174">Σ = [[${Q.fmt(p.l1 * p.pc1[0] ** 2 + p.l2 * p.pc2[0] ** 2, 2)}, …]] — eigen-decomposition of the covariance matrix</span>`;
    },
    onResize: function(){}
  };
  Q.reg('pca', mod);
})();
