'use strict';
/* Module: Eigenvectors — interactive 2D matrix, eigen lines, Fibonacci via eigen */
(function(){
  const W = 620, H = 420;

  const mod = {
    id: 'eigen',
    init: function(){
      const el = Q.$('mod-eigen');
      el.innerHTML = `
        <div class="mhead">
          <h2>Eigenvectors &amp; Eigenvalues <span class="src">SETOSA</span></h2>
          <p>Av = λv: a matrix only stretches vectors along special directions — the eigenvectors — by the eigenvalue λ. Drag the vector v, edit the matrix A, and watch Av. The eigenspaces (dashed lines) attract repeated multiplication: Aᵏv converges to the dominant eigenvector. This is the engine behind PageRank, PCA, and Markov chains.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>🧭 Matrix A · drag v <span class="tag">Av = λv</span></h3>
            <div class="controls">
              <div class="ctl"><label>a₁₁</label><input type="number" id="eg-a" value="1.2" step="0.1"></div>
              <div class="ctl"><label>a₁₂</label><input type="number" id="eg-b" value="0.6" step="0.1"></div>
              <div class="ctl"><label>a₂₁</label><input type="number" id="eg-c" value="0.4" step="0.1"></div>
              <div class="ctl"><label>a₂₂</label><input type="number" id="eg-d" value="1.4" step="0.1"></div>
              <button class="btn" id="eg-preset1">rotation</button>
              <button class="btn" id="eg-preset2">shear</button>
              <button class="btn" id="eg-preset3">scale</button>
            </div>
            <canvas id="eg-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#1565C0"></span>v</span>
              <span><span class="swatch" style="background:#008B00"></span>Av</span>
              <span><span class="swatch" style="background:#008B00; opacity:.5"></span>eigenspace λ₁</span>
              <span><span class="swatch" style="background:#6A1B9A; opacity:.5"></span>eigenspace λ₂</span>
            </div>
          </div>
          <div class="card">
            <h3>🔢 Eigenvalues</h3>
            <div class="readout" id="eg-out" style="font-size:13px"></div>
            <h3 style="margin-top:16px">🐚 Fibonacci via eigen <span class="tag">Aᵏv</span></h3>
            <div class="controls">
              <div class="ctl"><label>k</label><input type="range" id="eg-k" min="1" max="30" value="10"><span class="val" id="eg-k-val">10</span></div>
            </div>
            <canvas id="eg-cv2" width="300" height="160"></canvas>
            <div class="readout" id="eg-out2" style="margin-top:8px"></div>
          </div>
        </div>`;
      this.cv = Q.canvas('eg-cv', W, H);
      this.cv2 = Q.canvas('eg-cv2', 300, 160);
      this.cvEl = Q.$('eg-cv');
      this.v = [0.7, 0.5];
      this.dragging = false;
      const self = this;
      const bindM = id => Q.bind(id, 'change', () => { self.draw(); self.out(); });
      ['eg-a', 'eg-b', 'eg-c', 'eg-d'].forEach(bindM);
      Q.bind('eg-preset1', 'click', () => { self.setM(0.8, -0.6, 0.6, 0.8); });
      Q.bind('eg-preset2', 'click', () => { self.setM(1, 0.8, 0, 1); });
      Q.bind('eg-preset3', 'click', () => { self.setM(2, 0, 0, 0.5); });
      Q.bind('eg-k', 'input', e => { Q.$('eg-k-val').textContent = e.target.value; self.draw2(); });
      this.cvEl.addEventListener('mousedown', e => { this.dragging = true; this.drag(e); });
      window.addEventListener('mousemove', e => { if (this.dragging) this.drag(e); });
      window.addEventListener('mouseup', () => { this.dragging = false; });
      this.draw(); this.out(); this.draw2();
    },
    setM: function(a, b, c, d){
      Q.$('eg-a').value = a; Q.$('eg-b').value = b; Q.$('eg-c').value = c; Q.$('eg-d').value = d;
      this.draw(); this.out();
    },
    M: function(){ return [[+Q.$('eg-a').value, +Q.$('eg-b').value], [+Q.$('eg-c').value, +Q.$('eg-d').value]]; },
    drag: function(e){
      const r = this.cvEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * W - W / 2;
      const y = H / 2 - (e.clientY - r.top) / r.height * H;
      this.v = [x / 130, y / 130];
      this.draw(); this.out();
    },
    draw: function(){
      const ctx = this.cv;
      Q.clear(ctx, W, H);
      const cx = W / 2, cy = H / 2, scale = 130;
      // grid
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++){
        Q.line(ctx, cx + i * scale, 10, cx + i * scale, H - 10, 'rgba(0,0,0,0.06)', 1);
        Q.line(ctx, 10, cy + i * scale, W - 10, cy + i * scale, 'rgba(0,0,0,0.06)', 1);
      }
      Q.line(ctx, 10, cy, W - 10, cy, '#D5D6D8', 1.2);
      Q.line(ctx, cx, 10, cx, H - 10, '#D5D6D8', 1.2);
      Q.text(ctx, 'x', W - 14, cy - 8, '#717174', 10);
      Q.text(ctx, 'y', cx + 8, 12, '#717174', 10);
      const M = this.M();
      const eigs = Q.eig2(M[0][0], M[0][1], M[1][0], M[1][1]);
      // eigenspaces
      eigs.forEach((e, i) => {
        const col = i === 0 ? 'rgba(0,139,0,0.4)' : 'rgba(106,27,154,0.4)';
        const vx = e.vec[0], vy = e.vec[1];
        const len = 3.2;
        Q.line(ctx, cx - vx * len * scale, cy + vy * len * scale, cx + vx * len * scale, cy - vy * len * scale, col, 2, [6, 5]);
      });
      // Av
      const Av = Q.matVec(M, this.v);
      const px = cx + this.v[0] * scale, py = cy - this.v[1] * scale;
      const qx = cx + Av[0] * scale, qy = cy - Av[1] * scale;
      // arrow v
      ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      Q.circle(ctx, px, py, 5, '#1565C0', '#fff', 2);
      // arrow Av
      ctx.strokeStyle = '#008B00'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(qx, qy); ctx.stroke();
      Q.circle(ctx, qx, qy, 5, '#008B00', '#fff', 2);
      Q.text(ctx, 'v', px + 8, py - 8, '#1565C0', 13, 'left', 'bold');
      Q.text(ctx, 'Av', qx + 8, qy - 8, '#00A800', 13, 'left', 'bold');
      // A^k path
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let p = this.v.slice();
      for (let k = 0; k < 8; k++){
        const x = cx + p[0] * scale, y = cy - p[1] * scale;
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        p = Q.matVec(M, p); }
      ctx.stroke(); ctx.setLineDash([]);
    },
    out: function(){
      const M = this.M();
      const eigs = Q.eig2(M[0][0], M[0][1], M[1][0], M[1][1]);
      const Av = Q.matVec(M, this.v);
      const ratio = Math.hypot(Av[0], Av[1]) / Math.hypot(this.v[0], this.v[1]);
      let html = `A = [[${Q.fmt(M[0][0])}, ${Q.fmt(M[0][1])}], [${Q.fmt(M[1][0])}, ${Q.fmt(M[1][1])}]]<br>`;
      html += `v = [${Q.fmt(this.v[0])}, ${Q.fmt(this.v[1])}] → Av = <b class="r">[${Q.fmt(Av[0])}, ${Q.fmt(Av[1])}]</b> · stretch ${Q.fmt(ratio)}×<br>`;
      html += `λ₁ = <b class="g">${Q.fmt(eigs[0].val)}</b> along [${Q.fmt(eigs[0].vec[0], 2)}, ${Q.fmt(eigs[0].vec[1], 2)}] · λ₂ = <b class="p">${Q.fmt(eigs[1].val)}</b> along [${Q.fmt(eigs[1].vec[0], 2)}, ${Q.fmt(eigs[1].vec[1], 2)}]<br>`;
      html += `<span style="color:#717174">det = ${Q.fmt(M[0][0] * M[1][1] - M[0][1] * M[1][0])} · tr = ${Q.fmt(M[0][0] + M[1][1])} · λ₁+λ₂ = tr, λ₁λ₂ = det</span>`;
      Q.$('eg-out').innerHTML = html;
    },
    draw2: function(){
      const ctx = this.cv2;
      const k = +Q.$('eg-k').value;
      Q.clear(ctx, 300, 160);
      // Fibonacci via eigen: F = [[1,1],[1,0]]
      const M = [[1, 1], [1, 0]];
      let v = [1, 0];
      const pts = [];
      for (let i = 0; i <= k; i++){ pts.push(v[1]); v = Q.matVec(M, v); }
      const maxV = pts[pts.length - 1];
      const X = i => 10 + i / k * 280;
      const Y = val => 140 - val / maxV * 115;
      ctx.strokeStyle = '#B07D00'; ctx.lineWidth = 2; ctx.beginPath();
      pts.forEach((p, i) => { const x = X(i), y = Y(p); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.stroke();
      pts.forEach((p, i) => Q.circle(ctx, X(i), Y(p), 3, '#B07D00', '#fff', 1));
      Q.text(ctx, 'F_k via Aᵏv, A=[[1,1],[1,0]]', 150, 12, '#B07D00', 11, 'center');
      Q.$('eg-out2').innerHTML = `F<sub>${k}</sub> = <b class="r">${pts[k]}</b> · φ = ${Q.fmt((1 + Math.sqrt(5)) / 2)} · F<sub>k</sub> ≈ φᵏ/√5 = ${Q.fmt(Math.pow((1 + Math.sqrt(5)) / 2, k) / Math.sqrt(5), 1)}`;
    },
    onResize: function(){}
  };
  Q.reg('eigen', mod);
})();
