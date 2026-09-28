'use strict';
/* Module: Markov Chains — transition matrix editor, simulation, stationary distribution */
(function(){
  const W = 620, H = 300;

  const mod = {
    id: 'markov',
    init: function(){
      const el = Q.$('mod-markov');
      el.innerHTML = `
        <div class="mhead">
          <h2>Markov Chains <span class="src">SETOSA · MCMC GALLERY</span></h2>
          <p>Systems that hop between states with fixed probabilities. Edit the transition matrix, run the chain, and watch the distribution converge to the stationary distribution π — the same math behind PageRank, credit ratings, and MCMC samplers.</p>
        </div>
        <div class="grid g23">
          <div class="card">
            <h3>🔄 Transition Matrix <span class="tag">rows sum to 1</span></h3>
            <div class="controls">
              <div class="ctl"><label>states</label><select id="mk-n"><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
              <button class="btn primary" id="mk-run">run chain</button>
              <button class="btn" id="mk-step">step</button>
              <button class="btn" id="mk-reset">reset</button>
              <div class="ctl"><label>speed</label><input type="range" id="mk-speed" min="1" max="30" value="10"></div>
            </div>
            <div id="mk-matrix"></div>
            <div class="legend" style="margin-top:10px">
              <span><span class="swatch" style="background:#1565C0"></span>empirical freq</span>
                            <span><span class="swatch" style="background:#008B00"></span>stationary π</span>
            </div>
          </div>
          <div class="card">
            <h3>📈 Convergence to π</h3>
            <canvas id="mk-cv" width="300" height="200"></canvas>
            <div class="readout" id="mk-out" style="margin-top:10px"></div>
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>🧠 PageRank intuition <span class="tag">random surfer = Markov chain</span></h3>
          <p style="color:#717174; font-size:12.5px; line-height:1.6">PageRank runs a Markov chain over web pages: at each step the "surfer" follows an outgoing link with probability 0.85 or teleports to a random page with probability 0.15. The stationary distribution π is the PageRank vector — pages with high π are ranked first. The chain is irreducible + aperiodic (thanks to teleporting), so π exists and is unique.</p>
        </div>`;
      this.cv = Q.canvas('mk-cv', 300, 200);
      this.n = 2;
      this.P = [[0.7, 0.3], [0.4, 0.6]];
      this.pi = [1, 0];
      this.hist = [];
      this.timer = null;
      this.running = false;
      const self = this;
      Q.bind('mk-n', 'change', e => { self.n = +e.target.value; self.resetMatrix(); self.renderMatrix(); self.reset(); });
      Q.bind('mk-run', 'click', () => self.toggle());
      Q.bind('mk-step', 'click', () => { self.step(); self.draw(); });
      Q.bind('mk-reset', 'click', () => { self.stop(); self.reset(); });
      this.renderMatrix(); this.reset();
    },
    resetMatrix: function(){
      const n = this.n;
      this.P = Array.from({length: n}, () => new Array(n).fill(1 / n));
      if (n === 3) this.P = [[0.6, 0.3, 0.1], [0.2, 0.5, 0.3], [0.4, 0.1, 0.5]];
      if (n === 4) this.P = [[0.5, 0.3, 0.1, 0.1], [0.2, 0.4, 0.2, 0.2], [0.3, 0.2, 0.3, 0.2], [0.1, 0.1, 0.4, 0.4]];
    },
    renderMatrix: function(){
      const n = this.n, self = this;
      let h = '<table class="mtx"><tr><th></th>';
      for (let j = 0; j < n; j++) h += `<th>→${j + 1}</th>`;
      h += '</tr>';
      for (let i = 0; i < n; i++){
        h += `<tr><th>${i + 1}</th>`;
        for (let j = 0; j < n; j++){
          h += `<td><input type="number" step="0.05" min="0" max="1" value="${this.P[i][j].toFixed(2)}" data-i="${i}" data-j="${j}"></td>`; }
        h += '</tr>'; }
      h += '</table>';
      Q.$('mk-matrix').innerHTML = h;
      Q.$('mk-matrix').querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => {
          const i = +inp.dataset.i, j = +inp.dataset.j;
          this.P[i][j] = Math.max(0, Math.min(1, +inp.value || 0));
          // renormalize row
          const row = this.P[i];
          const sum = row.reduce((a, b) => a + b, 0);
          if (sum > 0) for (let k = 0; k < n; k++) row[k] /= sum;
          this.renderMatrix();
          this.reset();
        }); });
    },
    reset: function(){
      this.pi = new Array(this.n).fill(0); this.pi[0] = 1;
            this.state = 0;
            this.hist = [this.pi.slice()];
      this.stop(); this.draw(); this.out();
    },
    step: function(){
      const rnd = Q.rng(Date.now() & 0xffff);
      const u = rnd();
      let acc = 0;
      const row = this.P[this.state || 0];
      for (let j = 0; j < this.n; j++){ acc += row[j]; if (u < acc){ this.state = j; break; } }
      this.pi = this.pi.map((p, i) => {
        let s = 0; for (let k = 0; k < this.n; k++) s += this.pi[k] * this.P[k][i]; return s; });
      this.hist.push(this.pi.slice());
      if (this.hist.length > 400) this.hist.shift();
    },
    toggle: function(){
      this.running = !this.running;
      Q.$('mk-run').textContent = this.running ? 'pause' : 'run chain';
      const self = this;
      if (this.running){
        this.timer = setInterval(() => { self.step(); self.draw(); }, 1000 / +Q.$('mk-speed').value);
      } else { clearInterval(this.timer); }
    },
    stop: function(){ this.running = false; clearInterval(this.timer); Q.$('mk-run').textContent = 'run chain'; },
    draw: function(){
      const ctx = this.cv;
      Q.clear(ctx, 300, 200);
      const n = this.n;
      // stationary
      const stat = Q.powerIter(this.P, 5000, 1e-14);
      // convergence lines
      const colors = ['#1565C0', '#008B00', '#6A1B9A', '#B07D00'];
      const h = this.hist;
      for (let j = 0; j < n; j++){
        ctx.strokeStyle = colors[j % 4]; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let t = 0; t < h.length; t++){
          const x = t / 399 * 290 + 5;
          const y = 190 - h[t][j] * 170;
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        Q.line(ctx, 5, 190 - stat[j] * 170, 295, 190 - stat[j] * 170, colors[j % 4], 1, [3, 3]);
      }
      Q.text(ctx, 'π = [' + stat.map(x => Q.fmt(x, 2)).join(', ') + ']', 150, 12, '#008B00', 11, 'center');
      Q.text(ctx, 't', 292, 196, '#717174', 10);
      // state occupancy + stationary bars
            const bw = 300 / n;
            for (let j = 0; j < n; j++){
              ctx.fillStyle = Q.hex(21, 101, 192, 0.85);
              ctx.fillRect(j * bw, 0, this.pi[j] * (bw - 2), 6);
              ctx.fillStyle = Q.hex(0, 139, 0, 0.9);
              ctx.fillRect(j * bw, 8, stat[j] * (bw - 2), 4);
            }
      const out = `π* = [${stat.map(x => Q.fmt(x, 3)).join(', ')}] · current dist [${this.pi.map(x => Q.fmt(x, 3)).join(', ')}]`;
      Q.$('mk-out').innerHTML = out;
    },
    out: function(){
      const stat = Q.powerIter(this.P, 5000, 1e-14);
      Q.$('mk-out').innerHTML = `stationary π = [${stat.map(x => Q.fmt(x, 3)).join(', ')}] · solved by π = πP (power iteration)`;
    },
    onResize: function(){}
  };
  Q.reg('markov', mod);
})();
