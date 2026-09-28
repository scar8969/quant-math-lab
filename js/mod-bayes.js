'use strict';
/* Module: Bayes & Conditional — shelf/ball visual, Bayes theorem, sensitivity/specificity */
(function(){
  const W = 620, H = 320;

  const mod = {
    id: 'bayes',
    init: function(){
      const el = Q.$('mod-bayes');
      el.innerHTML = `
        <div class="mhead">
          <h2>Bayes &amp; Conditional Probability <span class="src">SETOSA · SEEING THEORY</span></h2>
          <p>P(B|A) is not P(A|B). Drag the sliders to change the joint distribution of two events, watch the Venn diagram and the conditional probabilities update, then see Bayes' theorem flip the conditioning — the single most important formula in quant finance and ML.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>🍀 Joint Distribution <span class="tag">drag sliders → P(B|A) vs P(A|B)</span></h3>
            <div class="controls">
              <div class="ctl"><label>P(A)</label><input type="range" id="bayes-pa" min="5" max="95" value="60"><span class="val" id="bayes-pa-val">0.60</span></div>
              <div class="ctl"><label>P(B)</label><input type="range" id="bayes-pb" min="5" max="95" value="40"><span class="val" id="bayes-pb-val">0.40</span></div>
              <div class="ctl"><label>overlap</label><input type="range" id="bayes-overlap" min="0" max="100" value="35"><span class="val" id="bayes-overlap-val">0.35</span></div>
            </div>
            <canvas id="bayes-cv" width="${W}" height="${H}"></canvas>
            <div class="legend">
              <span><span class="swatch" style="background:#3fb950"></span>A</span>
                            <span><span class="swatch" style="background:#58a6ff"></span>B</span>
                            <span><span class="swatch" style="background:#bc8cff"></span>A∩B</span>
            </div>
          </div>
          <div class="card">
            <h3>⚖️ Bayes' Theorem</h3>
            <div class="readout" id="bayes-out" style="font-size:13px"></div>
            <div style="margin:12px 0 6px; font-size:12px; color:#717174">P(B|A) = P(A|B)·P(B) / P(A)</div>
            <canvas id="bayes-cv2" width="300" height="180"></canvas>
            <div class="hint">the two conditionals differ by the prior ratio P(B)/P(A)</div>
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>🩺 Medical Test — sensitivity &amp; specificity <span class="tag">the classic Bayes trap</span></h3>
          <div class="controls">
            <div class="ctl"><label>prevalence</label><input type="range" id="bayes-prev" min="0.1" max="20" step="0.1" value="1"><span class="val" id="bayes-prev-val">1%</span></div>
            <div class="ctl"><label>sensitivity</label><input type="range" id="bayes-sens" min="50" max="100" value="99"><span class="val" id="bayes-sens-val">99%</span></div>
            <div class="ctl"><label>specificity</label><input type="range" id="bayes-spec" min="50" max="100" value="95"><span class="val" id="bayes-spec-val">95%</span></div>
          </div>
          <div class="readout" id="bayes-out2"></div>
        </div>`;
      this.cv = Q.canvas('bayes-cv', W, H);
      this.cv2 = Q.canvas('bayes-cv2', 300, 180);
      const self = this;
      const bind = (id, fn) => Q.bind(id, 'input', e => { Q.$(id + '-val').textContent = e.target.value / 100; self.draw(); self.out(); });
      bind('bayes-pa', null); bind('bayes-pb', null); bind('bayes-overlap', null);
      Q.bind('bayes-prev', 'input', e => { Q.$('bayes-prev-val').textContent = e.target.value + '%'; self.out2(); });
      Q.bind('bayes-sens', 'input', e => { Q.$('bayes-sens-val').textContent = e.target.value + '%'; self.out2(); });
      Q.bind('bayes-spec', 'input', e => { Q.$('bayes-spec-val').textContent = e.target.value + '%'; self.out2(); });
      this.draw(); this.out(); this.out2();
    },
    joint: function(){
      const pA = +Q.$('bayes-pa').value / 100, pB = +Q.$('bayes-pb').value / 100;
      const ov = +Q.$('bayes-overlap').value / 100;
      const pAB = Math.min(pA, pB) * ov; // overlap as fraction of smaller event
      return { pA, pB, pAB,
        pAgB: pAB / pB, pBgA: pAB / pA,
        pAonly: pA - pAB, pBonly: pB - pAB, pNone: 1 - pA - pB + pAB };
    },
    draw: function(){
      const ctx = this.cv, j = this.joint();
      Q.clear(ctx, W, H);
      const cx = W / 2 - 20, cy = H / 2 + 10;
      const rA = 95, rB = 95;
      // A circle (red)
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#3fb950'; ctx.beginPath(); ctx.arc(cx - 40, cy, rA, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#58a6ff'; ctx.beginPath(); ctx.arc(cx + 40, cy, rB, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx - 40, cy, rA, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 40, cy, rB, 0, 2 * Math.PI); ctx.stroke();
      Q.text(ctx, 'A', cx - 100, cy - 70, '#56d364', 16, 'center', 'bold');
      Q.text(ctx, 'B', cx + 100, cy - 70, '#58a6ff', 16, 'center', 'bold');
      Q.text(ctx, 'A∩B', cx, cy - 60, '#bc8cff', 12, 'center');
      Q.text(ctx, 'A only ' + (j.pAonly * 100).toFixed(1) + '%', cx - 100, cy + 60, '#56d364', 11, 'center');
      Q.text(ctx, 'B only ' + (j.pBonly * 100).toFixed(1) + '%', cx + 100, cy + 60, '#58a6ff', 11, 'center');
      Q.text(ctx, 'neither ' + (j.pNone * 100).toFixed(1) + '%', cx, cy + 105, '#8b949e', 11, 'center');
      // bar chart of conditionals
      const bx = 20, by = H - 60;
      const bars = [['P(B|A)', j.pBgA, '#3fb950'], ['P(A|B)', j.pAgB, '#58a6ff']];
      bars.forEach((b, i) => {
        const x = bx + i * 160;
        Q.text(ctx, b[0], x, by + 40, b[2], 12);
        ctx.fillStyle = b[2];
        ctx.fillRect(x, by - b[1] * 40, 60, b[1] * 40);
        Q.text(ctx, (b[1] * 100).toFixed(1) + '%', x + 30, by - b[1] * 40 - 10, '#e6edf3', 11, 'center');
      });
    },
    out: function(){
      const j = this.joint();
      Q.$('bayes-out').innerHTML =
        `P(A) = <b>${(j.pA * 100).toFixed(1)}%</b> &nbsp; P(B) = <b>${(j.pB * 100).toFixed(1)}%</b> &nbsp; P(A∩B) = <b>${(j.pAB * 100).toFixed(1)}%</b><br>` +
        `P(B|A) = <b class="r">${(j.pBgA * 100).toFixed(1)}%</b> &nbsp; P(A|B) = <b class="c">${(j.pAgB * 100).toFixed(1)}%</b><br>` +
        `<span style="color:#717174">P(B|A) = P(A∩B)/P(A) = ${Q.fmt(j.pAB)}/${Q.fmt(j.pA)}</span>`;
      this.draw2();
    },
    draw2: function(){
      const ctx = this.cv2, j = this.joint();
      Q.clear(ctx, 300, 180);
      const cx = 150, cy = 90, r = 62;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#3fb950'; ctx.beginPath(); ctx.arc(cx - 22, cy, r, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#58a6ff'; ctx.beginPath(); ctx.arc(cx + 22, cy, r, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx - 22, cy, r, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 22, cy, r, 0, 2 * Math.PI); ctx.stroke();
      Q.text(ctx, 'A', cx - 55, cy - 40, '#56d364', 12, 'center');
      Q.text(ctx, 'B', cx + 55, cy - 40, '#58a6ff', 12, 'center');
    },
    out2: function(){
      const prev = +Q.$('bayes-prev').value / 100;
      const sens = +Q.$('bayes-sens').value / 100;
      const spec = +Q.$('bayes-spec').value / 100;
      const pPos = prev * sens + (1 - prev) * (1 - spec);
      const ppv = prev * sens / pPos;
      const npv = (1 - prev) * spec / (1 - pPos);
      Q.$('bayes-out2').innerHTML =
        `P(disease|positive) = <b class="r">${(ppv * 100).toFixed(1)}%</b> &nbsp;·&nbsp; P(healthy|negative) = <b class="g">${(npv * 100).toFixed(1)}%</b><br>` +
        `<span style="color:#717174">P(D|+) = sens·prev / (sens·prev + (1−spec)(1−prev)) = ${Q.fmt(prev * sens)} / ${Q.fmt(pPos)}</span><br>` +
        `<span style="color:#717174">even a ${(sens*100).toFixed(0)}% sensitive / ${(spec*100).toFixed(0)}% specific test gives only ${(ppv*100).toFixed(0)}% PPV at ${(prev*100).toFixed(1)}% prevalence — the base-rate fallacy</span>`;
    },
    onResize: function(){}
  };
  Q.reg('bayes', mod);
})();
