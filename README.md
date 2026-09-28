# quant-math-lab

Interactive quant math learning lab — 10 visual modules + auto-graded problem sets. Built from scratch after scraping Seeing Theory, Setosa, Distill, and the MCMC Gallery.

**Live demo:** https://scar8969.github.io/quant-math-lab/

![Quant Math Lab](assets/screenshot.png)

## What's inside

**10 interactive modules:**
1. Probability — dice simulation, normal curve, central limit theorem
2. Bayes & Conditional — Venn diagram, Bayes' theorem, medical test base-rate trap
3. Markov Chains — editable transition matrix, stationary distribution, convergence plot
4. Growth & Interest — linear vs exponential, compound interest, SIR model
5. Eigenvectors — drag v, see Av, eigenspaces, Fibonacci via matrix powers
6. PCA — drag points, principal component axes, variance explained, 1-D projection
7. Momentum Optimization — gradient descent vs momentum on contour plots (Distill)
8. MCMC Sampling — Metropolis-Hastings, MALA, Hamiltonian MC on a 2-mode target
9. Gaussian Processes — click to add data, posterior mean + uncertainty bands (Distill)
10. Problem Sets — auto-graded derivation problems (54 across all topics)

**Auto-graded problem sets:**
- 54 parameterized problems on all 9 topics
- 0.1% tolerance numeric grading
- Expression parser: type `1/3`, `sqrt(2)`, `2^3`, `pi`, `e`
- Progress tracking with streaks, saved in localStorage

## How to run

```bash
cd quant-math-lab
python -m http.server 8899
```

Open http://127.0.0.1:8899/index.html

Note: file:// renders blank — must serve over HTTP.

## Sources

- [Seeing Theory](https://seeing-theory.brown.edu/)
- [Setosa — Explained Visually](https://setosa.io/ev/)
- [Distill — Why Momentum Really Works](https://distill.pub/2017/momentum/)
- [Distill — Visual Exploration of Gaussian Processes](https://distill.pub/2019/visual-exploration-gaussian-processes/)
- [MCMC Interactive Gallery](https://chi-feng.github.io/mcmc-demo/)

## Tech

Zero dependencies. One HTML file, one CSS file, 11 vanilla JS files. All math runs live in your browser.