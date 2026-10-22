(() => {
    const C = {
        bg: '#111217', grid: '#1f2226', text: '#ccccdc', muted: '#8e8e8e',
        green: '#73bf69', yellow: '#fade2a', red: '#f2495c', orange: '#ff9830', blue: '#5794f2', purple: '#b877d9',
    };

    const BUG_LABELS = [
        'NullPointerException', 'off-by-one', 'race condition', 'CORS', 'YAML indentation',
        'undefined is not a function', 'timezone bug', 'leap year', 'N+1 query', 'stale cache',
        "it's DNS", 'works on my machine', 'infinite retry', 'expired token', 'wrong env var',
    ];

    const ENEMIES = {
        bug: { emoji: '🐛', hp: 1, r: 15, speed: 55, points: 10 },
        leak: { emoji: '🪲', hp: 3, r: 16, speed: 38, points: 30, label: 'memory leak' },
        flaky: { emoji: '🦗', hp: 1, r: 15, speed: 70, points: 20, label: 'flaky test' },
    };

    const POWERUPS = {
        aws: { icon: '☁️', label: 'AWS Support', color: C.orange, weight: 3 },
        azure: { icon: '🎫', label: 'Azure Ticket', color: C.blue, weight: 3 },
        rds: { icon: '🛢️', label: 'RDS Multi-AZ', color: C.green, weight: 3 },
        rollback: { icon: '⏪', label: 'argocd rollback', color: C.yellow, weight: 2 },
        coffee: { icon: '☕', label: 'coffee', color: C.green, weight: 3 },
        scale: { icon: '📈', label: 'scale --replicas=20', color: C.purple, weight: 2 },
        friday: { icon: '🚀', label: 'Friday 5pm deploy', color: C.red, weight: 2 },
    };

    const AZURE_CLOSED = [
        'Support: "Please clear your browser cache." Ticket closed.',
        'Support: "Works as designed." Ticket closed.',
        'Support: "Have you tried restarting?" Ticket closed.',
        'Support: "Can you send a HAR file?" Ticket closed for inactivity.',
    ];

    const BILLING_REPLIES = {
        exposure: 'AWS Billing: "We do not accept exposure." Waived anyway. Back to work.',
        data: 'The data team blamed the platform team. Bill split three ways. Nobody is happy.',
        finops: 'FinOps forgives you. They also added you to the weekly cost review.',
    };

    const BEST_KEY = 'bughunt-best';

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let root, stage, canvas, ctx, toastsEl, screenEl, sparkCanvas, hud;
    let W = 0, H = 0, dpr = 1;
    let s = null;
    let keys = {};
    let raf = 0, lastFrame = 0, lastRender = 0, renderCount = 0, fpsWindowStart = 0, fps = 60, lastHud = 0;
    let resolveExit = null;
    let best = Number(localStorage.getItem(BEST_KEY) || 0);

    function newState() {
        return {
            phase: 'start',
            played: false,
            player: { x: W / 2, targetX: null, shield: false, hitFlash: 0 },
            bullets: [], enemies: [], enemyBullets: [], powerups: [], particles: [], floaters: [], wingmen: [],
            timers: [],
            wave: 0, toSpawn: 0, spawnTimer: 0, waveCleared: false,
            score: 0, squashed: 0, budget: 100, bill: 0,
            fireTimer: 0, powerTimer: rand(6, 10),
            effects: { triple: 0, laser: 0, coffee: 0, scale: 0, lowfps: 0 },
            history: [], historyTimer: 0, maxBill: 0,
        };
    }

    // DOM

    function panel(key, title, extra = '') {
        return `<div class="bh-panel ${key === 'spark' ? 'spark' : ''}"><div class="bh-ptitle">${title}</div>${extra || `<div class="bh-pvalue" data-k="${key}">–</div>`}</div>`;
    }

    function build(container) {
        root = document.createElement('div');
        root.className = 'bh-root';
        root.innerHTML = `
            <div class="bh-topbar">
                <span class="bh-crumbs">Dashboards / prod-us-east-1 / <b>Bug Hunt</b></span>
                <span class="bh-pill">🕒 Last 15 minutes</span>
                <span class="bh-pill">⟳ 5s</span>
                <button type="button" class="bh-btn" data-act="exit">Exit (Esc)</button>
            </div>
            <div class="bh-panels">
                ${panel('squashed', 'Bugs squashed')}
                ${panel('budget', 'Error budget', '<div class="bh-pvalue" data-k="budget">100%</div><div class="bh-gauge"><div data-k="gauge"></div></div>')}
                ${panel('bill', 'AWS bill (MTD)')}
                ${panel('wave', 'Wave')}
                ${panel('fps', 'Render FPS')}
                ${panel('spark', 'Bugs in prod', '<canvas class="bh-spark"></canvas>')}
            </div>
            <div class="bh-stage">
                <canvas></canvas>
                <div class="bh-toasts"></div>
                <div class="bh-screen"></div>
            </div>`;
        container.appendChild(root);

        stage = root.querySelector('.bh-stage');
        canvas = stage.querySelector('canvas');
        ctx = canvas.getContext('2d');
        toastsEl = root.querySelector('.bh-toasts');
        screenEl = root.querySelector('.bh-screen');
        sparkCanvas = root.querySelector('.bh-spark');
        hud = {};
        root.querySelectorAll('[data-k]').forEach((el) => { hud[el.dataset.k] = el; });

        root.addEventListener('click', onClick);
        stage.addEventListener('pointermove', onPointer);
        stage.addEventListener('pointerdown', onPointer);
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('resize', resize);
        resize();
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = stage.clientWidth;
        H = stage.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const r = sparkCanvas.getBoundingClientRect();
        sparkCanvas.width = r.width * dpr;
        sparkCanvas.height = r.height * dpr;
        if (s) s.player.x = Math.min(Math.max(s.player.x, 20), W - 20);
    }

    function toast(text, color = C.blue) {
        const el = document.createElement('div');
        el.className = 'bh-toast';
        el.style.borderLeftColor = color;
        el.textContent = text;
        toastsEl.prepend(el);
        while (toastsEl.children.length > 4) toastsEl.lastChild.remove();
        setTimeout(() => el.remove(), 3800);
    }

    function showScreen(html) {
        screenEl.innerHTML = `<div class="bh-card">${html}</div>`;
        screenEl.hidden = false;
    }

    function hideScreen() {
        screenEl.hidden = true;
        screenEl.innerHTML = '';
    }

    function startScreen() {
        const legend = [
            ['☁️ AWS Support', 'Escalation takes a moment. Then the TAM joins: triple shot.'],
            ['🎫 Azure Ticket', 'Might escalate to the product group. Might get closed.'],
            ['🛢️ RDS Multi-AZ', 'Shield. The next hit fails over to the standby.'],
            ['⏪ argocd rollback', 'Back to the last known good state. Clears the screen.'],
            ['☕ coffee', 'Commit rate doubled.'],
            ['📈 scale --replicas=20', '20 pods of firepower. Also 1 FPS. Also the bill.'],
            ['🚀 Friday 5pm deploy', 'Do not catch this one.'],
        ].map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join('');
        showScreen(`
            <h3>🐛 BUG HUNT</h3>
            <p>Production is crawling with bugs. Ship patches before they reach prod and burn the error budget.
            Every 5th wave the Legacy Monolith shows up.</p>
            <p>← → / A D, mouse or touch to move. Auto-fire is on. P pauses, Esc exits.</p>
            <div class="bh-legend">${legend}</div>
            <div class="bh-actions">
                <button type="button" class="bh-btn primary" data-act="start">Start (Space)</button>
                <button type="button" class="bh-btn" data-act="exit">Back to terminal</button>
            </div>
            ${best ? `<p class="bh-fine">Best score on this machine: ${best.toLocaleString('en-US')}</p>` : ''}`);
    }

    function overScreen() {
        const isBest = s.score > 0 && s.score >= best;
        showScreen(`
            <h3 style="color:${C.red}">SLO BREACHED</h3>
            <p>Error budget exhausted on wave ${s.wave}. The incident channel has 214 people in it.</p>
            <div class="bh-stats">
                <span>Score</span><b>${s.score.toLocaleString('en-US')}${isBest ? ' 🏆 new best' : ''}</b>
                <span>Bugs squashed</span><b>${s.squashed}</b>
                <span>AWS bill</span><b>${money(s.bill)}</b>
            </div>
            <div class="bh-actions">
                <button type="button" class="bh-btn primary" data-act="start">Play again (Space)</button>
                <button type="button" class="bh-btn" data-act="exit">Back to terminal (Esc)</button>
            </div>`);
    }

    function billingScreen() {
        s.phase = 'modal';
        showScreen(`
            <h3 style="color:${C.orange}">AWS Billing: payment required</h3>
            <p>Your estimated bill for this month is <b style="color:${C.red}">${money(s.bill)}</b>.
            Running 20 pods for six seconds was… a choice. Please add a payment method to continue.</p>
            <div class="bh-cardrow">
                <input readonly placeholder="4111 1111 1111 1111" aria-label="Card number (disabled)">
                <input readonly placeholder="MM/YY" aria-label="Expiry (disabled)">
                <input readonly placeholder="CVC" aria-label="CVC (disabled)">
            </div>
            <div class="bh-actions">
                <button type="button" class="bh-btn primary" data-act="pay" data-reply="exposure">Pay with exposure</button>
                <button type="button" class="bh-btn" data-act="pay" data-reply="data">Blame the data team</button>
                <button type="button" class="bh-btn" data-act="pay" data-reply="finops">Ask FinOps for forgiveness</button>
            </div>
            <p class="bh-fine">This is a joke. The fields are disabled; nothing is collected.</p>`);
    }

    // Game flow

    function startGame() {
        s = newState();
        s.phase = 'play';
        s.played = true;
        s.player.x = W / 2;
        hideScreen();
        toastsEl.innerHTML = '';
        startWave();
    }

    function startWave() {
        s.wave += 1;
        s.waveCleared = false;
        const boss = s.wave % 5 === 0;
        s.toSpawn = boss ? 4 : 6 + s.wave * 3;
        s.spawnTimer = 0.6;
        if (boss) {
            const hp = 40 + s.wave * 8;
            s.enemies.push({ type: 'boss', x: W / 2, y: -70, r: 44, hp, maxHp: hp, dir: 1, fire: 1.5, t: 0, label: 'Legacy Monolith (Java 6)' });
            toast(`Wave ${s.wave}: Legacy Monolith detected`, C.red);
        } else {
            toast(`Wave ${s.wave}: ${s.toSpawn} bugs incoming`, C.blue);
        }
    }

    function spawnEnemy(type, x, y) {
        const d = ENEMIES[type];
        s.enemies.push({
            type,
            x: x ?? rand(24, W - 24),
            y: y ?? -20,
            r: d.r,
            baseR: d.r,
            hp: d.hp + (type === 'leak' ? Math.floor(s.wave / 3) : 0),
            speed: d.speed * (1 + s.wave * 0.08) * rand(0.8, 1.2),
            t: rand(0, 6),
            label: d.label || pick(BUG_LABELS),
        });
    }

    function randomEnemyType() {
        const r = Math.random();
        if (s.wave >= 2 && r < 0.18 + s.wave * 0.01) return 'leak';
        if (s.wave >= 2 && r < 0.42) return 'flaky';
        return 'bug';
    }

    function spawnPowerup(x, y, type) {
        if (!type) {
            const total = Object.values(POWERUPS).reduce((a, p) => a + p.weight, 0);
            let r = Math.random() * total;
            type = Object.keys(POWERUPS).find((k) => (r -= POWERUPS[k].weight) < 0);
        }
        s.powerups.push({ type, x: x ?? rand(60, W - 60), y: y ?? -16, vy: 85 });
    }

    function later(seconds, fn) {
        s.timers.push({ t: seconds, fn });
    }

    function applyPowerup(type) {
        const p = s.player;
        floater(POWERUPS[type].label, p.x, H - 70, POWERUPS[type].color);
        switch (type) {
            case 'aws': {
                const caseId = Math.floor(rand(1e9, 9e9));
                toast(`AWS Support: case #${caseId} opened (Severity: production system down)`, C.orange);
                later(2.5, () => {
                    s.effects.triple = 10;
                    toast('Your TAM joined the bridge: triple shot for 10s', C.green);
                });
                break;
            }
            case 'azure':
                toast('Azure: Severity A ticket opened. An engineer will contact you shortly.', C.blue);
                later(3, () => {
                    if (Math.random() < 0.45) {
                        s.effects.laser = 8;
                        toast('Escalated to the product group: patches now pierce', C.green);
                    } else {
                        toast(pick(AZURE_CLOSED), C.muted);
                    }
                });
                break;
            case 'rds':
                p.shield = true;
                toast('RDS Multi-AZ: standby is ready. The next hit fails over.', C.green);
                break;
            case 'rollback': {
                toast('argocd app rollback: back to the last known good revision', C.yellow);
                s.enemies.forEach((e) => {
                    if (e.type === 'boss') {
                        e.hp -= 15;
                        if (e.hp <= 0) killEnemy(e);
                    } else {
                        e.dead = true;
                        burst(e.x, e.y, C.yellow);
                    }
                });
                s.enemyBullets = [];
                break;
            }
            case 'coffee':
                s.effects.coffee = 8;
                toast('Coffee: commit rate doubled for 8s', C.green);
                break;
            case 'scale':
                s.effects.scale = 6;
                s.effects.lowfps = 4;
                s.wingmen = Array.from({ length: 20 }, (_, i) => ({ i, fire: rand(0, 0.6) }));
                toast('kubectl scale --replicas=20: 20 pods scheduled', C.purple);
                later(0.2, () => toast('Node pressure: the cluster now renders at 1 FPS', C.red));
                break;
            case 'friday':
                toast('Friday 5pm deploy shipped. Everyone has logged off. 10 new bugs.', C.red);
                for (let i = 0; i < 10; i++) spawnEnemy('bug', rand(24, W - 24), rand(-140, -10));
                break;
        }
    }

    function hitPlayer(damage, reason) {
        const p = s.player;
        if (p.shield) {
            p.shield = false;
            toast('RDS failover complete: standby promoted, no damage', C.green);
            burst(p.x, H - 46, C.green);
            return;
        }
        s.budget -= damage;
        p.hitFlash = 0.3;
        floater(`-${damage}% ${reason}`, p.x, H - 70, C.red);
        if (s.budget <= 0) gameOver();
    }

    function killEnemy(e) {
        if (e.dead) return;
        e.dead = true;
        if (e.type === 'boss') {
            s.score += 500 * Math.ceil(s.wave / 5);
            toast('Monolith decomposed… into 6 microservices', C.purple);
            for (let i = 0; i < 6; i++) spawnEnemy('bug', e.x + rand(-60, 60), e.y + rand(-20, 20));
            spawnPowerup(e.x - 30, e.y);
            spawnPowerup(e.x + 30, e.y);
            burst(e.x, e.y, C.orange, 40);
            return;
        }
        const pts = Math.round(ENEMIES[e.type].points * (1 + s.wave * 0.1));
        s.score += pts;
        s.squashed += 1;
        floater(`+${pts}`, e.x, e.y, C.green);
        burst(e.x, e.y, C.green);
        if (Math.random() < 0.08) spawnPowerup(e.x, e.y);
    }

    function gameOver() {
        s.budget = 0;
        s.phase = 'over';
        if (s.score > best) {
            best = s.score;
            localStorage.setItem(BEST_KEY, String(best));
        }
        render();
        overScreen();
    }

    function burst(x, y, color, n = 12) {
        for (let i = 0; i < n; i++) {
            const a = rand(0, Math.PI * 2), v = rand(40, 180);
            s.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.7), color });
        }
    }

    function floater(text, x, y, color) {
        s.floaters.push({ text, x, y, life: 1.1, color });
    }

    // Update

    function update(dt) {
        const p = s.player;
        const fx = s.effects;

        for (const k of Object.keys(fx)) {
            const before = fx[k];
            fx[k] = Math.max(0, fx[k] - dt);
            if (k === 'lowfps' && before > 0 && fx[k] === 0) billingScreen();
            if (k === 'scale' && before > 0 && fx[k] === 0) s.wingmen = [];
        }
        if (s.phase !== 'play') return;

        s.bill += dt * (40 + s.wave * 25 + (fx.scale > 0 ? 9000 : 0));

        for (const t of s.timers) t.t -= dt;
        const due = s.timers.filter((t) => t.t <= 0);
        s.timers = s.timers.filter((t) => t.t > 0);
        due.forEach((t) => t.fn());

        // Player
        const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (dir) {
            p.x += dir * 460 * dt;
            p.targetX = null;
        } else if (p.targetX != null) {
            const d = p.targetX - p.x;
            p.x += Math.sign(d) * Math.min(Math.abs(d), 900 * dt);
        }
        p.x = Math.min(Math.max(p.x, 18), W - 18);
        p.hitFlash = Math.max(0, p.hitFlash - dt);

        // Firing
        s.fireTimer -= dt;
        if (s.fireTimer <= 0) {
            s.fireTimer = fx.coffee > 0 ? 0.09 : 0.18;
            const pierce = fx.laser > 0;
            const shots = fx.triple > 0 ? [-0.22, 0, 0.22] : [0];
            for (const a of shots) s.bullets.push({ x: p.x, y: H - 60, vx: Math.sin(a) * 560, vy: -Math.cos(a) * 560, pierce });
        }
        for (const w of s.wingmen) {
            w.fire -= dt;
            if (w.fire <= 0) {
                w.fire = rand(0.35, 0.7);
                s.bullets.push({ x: (w.i + 0.5) * (W / 20), y: H - 30, vx: 0, vy: -480, pierce: false, small: true });
            }
        }

        // Spawning
        s.spawnTimer -= dt;
        if (s.toSpawn > 0 && s.spawnTimer <= 0) {
            spawnEnemy(randomEnemyType());
            s.toSpawn -= 1;
            s.spawnTimer = Math.max(0.22, 1.1 - s.wave * 0.07) * rand(0.6, 1.4);
        }
        if (s.toSpawn === 0 && s.enemies.length === 0 && !s.waveCleared) {
            s.waveCleared = true;
            toast(`Wave ${s.wave} cleared. Deploying hotfixes…`, C.green);
            later(1.5, startWave);
        }
        s.powerTimer -= dt;
        if (s.powerTimer <= 0) {
            spawnPowerup();
            s.powerTimer = rand(9, 15);
        }

        // Enemies
        for (const e of s.enemies) {
            e.t += dt;
            if (e.type === 'boss') {
                if (e.y < 90) e.y += 45 * dt;
                else {
                    e.x += e.dir * (70 + s.wave * 4) * dt;
                    if (e.x < 60 || e.x > W - 60) e.dir *= -1;
                    e.fire -= dt;
                    if (e.fire <= 0) {
                        e.fire = Math.max(0.5, 1.4 - s.wave * 0.04);
                        const a = Math.atan2(H - 46 - e.y, p.x - e.x);
                        s.enemyBullets.push({ x: e.x, y: e.y + 30, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, label: `JIRA-${Math.floor(rand(1000, 9999))}` });
                    }
                }
                continue;
            }
            e.y += e.speed * dt;
            if (e.type === 'flaky') e.x += Math.sin(e.t * 5) * 90 * dt;
            else e.x += Math.sin(e.t * 2) * 20 * dt;
            if (e.type === 'leak') e.r = e.baseR + Math.min(16, e.t * 1.6);
            e.x = Math.min(Math.max(e.x, 12), W - 12);

            if (e.y > H + e.r) {
                e.dead = true;
                s.budget -= 8;
                floater(`-8% prod: ${e.label}`, e.x, H - 20, C.red);
                if (s.budget <= 0) return gameOver();
            } else if (Math.hypot(e.x - p.x, e.y - (H - 46)) < e.r + 14) {
                e.dead = true;
                burst(e.x, e.y, C.red);
                hitPlayer(15, e.label);
                if (s.phase !== 'play') return;
            }
        }

        // Bullets vs enemies
        for (const b of s.bullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.y < -20 || b.x < -20 || b.x > W + 20) { b.dead = true; continue; }
            for (const e of s.enemies) {
                if (e.dead) continue;
                if (e.type === 'flaky' && Math.sin(e.t * 6) < -0.3) continue;
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
                    e.hp -= 1;
                    if (e.hp <= 0) killEnemy(e);
                    else burst(b.x, b.y, C.yellow, 3);
                    if (!b.pierce) { b.dead = true; break; }
                }
            }
        }

        // Boss tickets
        for (const b of s.enemyBullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.y > H + 20 || b.x < -40 || b.x > W + 40) b.dead = true;
            else if (Math.hypot(b.x - p.x, b.y - (H - 46)) < 18) {
                b.dead = true;
                hitPlayer(10, b.label);
                if (s.phase !== 'play') return;
            }
        }

        // Power-ups
        for (const u of s.powerups) {
            u.y += u.vy * dt;
            if (u.y > H + 20) u.dead = true;
            else if (Math.abs(u.x - p.x) < 60 && Math.abs(u.y - (H - 46)) < 24) {
                u.dead = true;
                applyPowerup(u.type);
            }
        }

        for (const q of s.particles) {
            q.x += q.vx * dt;
            q.y += q.vy * dt;
            q.life -= dt;
        }
        for (const f of s.floaters) {
            f.y -= 40 * dt;
            f.life -= dt;
        }

        const alive = (o) => !o.dead;
        s.enemies = s.enemies.filter(alive);
        s.bullets = s.bullets.filter(alive);
        s.enemyBullets = s.enemyBullets.filter(alive);
        s.powerups = s.powerups.filter(alive);
        s.particles = s.particles.filter((q) => q.life > 0);
        s.floaters = s.floaters.filter((f) => f.life > 0);

        s.historyTimer -= dt;
        if (s.historyTimer <= 0) {
            s.historyTimer = 0.5;
            s.history.push(s.enemies.length);
            if (s.history.length > 80) s.history.shift();
        }
    }

    // Render

    function drawShip(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.8, y + size * 0.7);
        ctx.lineTo(x, y + size * 0.35);
        ctx.lineTo(x - size * 0.8, y + size * 0.7);
        ctx.closePath();
        ctx.fill();
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function render() {
        renderCount += 1;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        for (let x = 0.5; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0.5; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.strokeStyle = C.red;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, H - 6.5);
        ctx.lineTo(W, H - 6.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.red;
        ctx.font = '10px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('prod', 6, H - 10);

        if (!s) return;
        const p = s.player;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const u of s.powerups) {
            const d = POWERUPS[u.type];
            ctx.font = '11px Inter, Arial, sans-serif';
            const text = `${d.icon} ${d.label}`;
            const w = ctx.measureText(text).width + 16;
            roundRect(u.x - w / 2, u.y - 11, w, 22, 11);
            ctx.fillStyle = 'rgba(24,27,31,0.92)';
            ctx.fill();
            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = d.color;
            ctx.fillText(text, u.x, u.y + 1);
        }

        for (const e of s.enemies) {
            if (e.type === 'boss') {
                ctx.font = '72px serif';
                ctx.fillText('🏚️', e.x, e.y);
                const bw = 120;
                ctx.fillStyle = '#2c3235';
                ctx.fillRect(e.x - bw / 2, e.y - 56, bw, 6);
                ctx.fillStyle = C.red;
                ctx.fillRect(e.x - bw / 2, e.y - 56, bw * Math.max(0, e.hp / e.maxHp), 6);
                ctx.fillStyle = C.muted;
                ctx.font = '11px Inter, Arial, sans-serif';
                ctx.fillText(e.label, e.x, e.y + 46);
                continue;
            }
            ctx.globalAlpha = e.type === 'flaky' && Math.sin(e.t * 6) < -0.3 ? 0.2 : 1;
            ctx.font = `${Math.round(e.r * 2)}px serif`;
            ctx.fillText(ENEMIES[e.type].emoji, e.x, e.y);
            ctx.fillStyle = C.muted;
            ctx.font = '10px Inter, Arial, sans-serif';
            ctx.fillText(e.label, e.x, e.y + e.r + 9);
            ctx.globalAlpha = 1;
        }

        for (const b of s.enemyBullets) {
            ctx.font = '10px Inter, Arial, sans-serif';
            const w = ctx.measureText(b.label).width + 10;
            roundRect(b.x - w / 2, b.y - 8, w, 16, 3);
            ctx.fillStyle = C.red;
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(b.label, b.x, b.y + 1);
        }

        for (const b of s.bullets) {
            ctx.fillStyle = b.pierce ? C.purple : C.green;
            ctx.fillRect(b.x - (b.small ? 1 : 1.5), b.y - (b.pierce ? 9 : 6), b.small ? 2 : 3, b.pierce ? 18 : 12);
        }

        s.wingmen.forEach((w) => drawShip((w.i + 0.5) * (W / 20), H - 24, 7, C.purple));

        const py = H - 46;
        drawShip(p.x, py, 16, p.hitFlash > 0 ? C.red : C.blue);
        ctx.fillStyle = C.muted;
        ctx.font = '10px Inter, Arial, sans-serif';
        ctx.fillText('main', p.x, py + 24);
        if (p.shield) {
            ctx.strokeStyle = C.green;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(p.x, py, 26, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        for (const q of s.particles) {
            ctx.globalAlpha = Math.max(0, q.life / 0.7);
            ctx.fillStyle = q.color;
            ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
        }
        for (const f of s.floaters) {
            ctx.globalAlpha = Math.max(0, f.life);
            ctx.fillStyle = f.color;
            ctx.font = '12px Inter, Arial, sans-serif';
            ctx.fillText(f.text, Math.min(Math.max(f.x, 70), W - 70), f.y);
        }
        ctx.globalAlpha = 1;

        if (s.effects.lowfps > 0) {
            ctx.fillStyle = C.red;
            ctx.font = 'bold 14px Inter, Arial, sans-serif';
            ctx.fillText(`⚠ NODE PRESSURE · 1 FPS · ${money(s.bill)}`, W / 2, 24);
        }
        if (s.phase === 'pause') {
            ctx.fillStyle = C.text;
            ctx.font = 'bold 20px Inter, Arial, sans-serif';
            ctx.fillText('Paused (P to resume)', W / 2, H / 2);
        }
    }

    function renderHud(now) {
        if (!s) return;
        hud.squashed.textContent = s.squashed.toLocaleString('en-US');
        const budget = Math.max(0, Math.round(s.budget));
        const color = budget > 60 ? C.green : budget > 30 ? C.yellow : C.red;
        hud.budget.textContent = `${budget}%`;
        hud.budget.style.color = color;
        hud.gauge.style.width = `${budget}%`;
        hud.gauge.style.backgroundColor = color;
        hud.bill.textContent = s.bill < 10000 ? money(s.bill) : `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(s.bill)}`;
        hud.bill.style.color = s.bill > 10000 ? C.red : s.bill > 1000 ? C.orange : C.text;
        hud.wave.textContent = s.wave || '–';
        hud.fps.textContent = fps;
        hud.fps.style.color = fps < 10 ? C.red : C.green;

        const sc = sparkCanvas.getContext('2d');
        const sw = sparkCanvas.width, sh = sparkCanvas.height;
        sc.clearRect(0, 0, sw, sh);
        if (s.history.length > 1) {
            const max = Math.max(5, ...s.history);
            const step = sw / 79;
            sc.beginPath();
            s.history.forEach((v, i) => {
                const x = i * step, y = sh - (v / max) * (sh - 4) - 2;
                if (i === 0) sc.moveTo(x, y); else sc.lineTo(x, y);
            });
            sc.strokeStyle = C.green;
            sc.lineWidth = 1.5 * dpr;
            sc.stroke();
            sc.lineTo((s.history.length - 1) * step, sh);
            sc.lineTo(0, sh);
            sc.fillStyle = 'rgba(115,191,105,0.15)';
            sc.fill();
        }
        lastHud = now;
    }

    function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
        lastFrame = now;
        if (s && s.phase === 'play') update(dt);

        const lowfps = s && s.effects.lowfps > 0 && s.phase === 'play';
        if (!lowfps || now - lastRender >= 1000) {
            render();
            lastRender = now;
            if (now - lastHud > 100) renderHud(now);
        }
        if (now - fpsWindowStart >= 1000) {
            fps = Math.round((renderCount * 1000) / (now - fpsWindowStart));
            renderCount = 0;
            fpsWindowStart = now;
        }
    }

    // Input

    function onClick(e) {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === 'exit') exit();
        else if (act === 'start') startGame();
        else if (act === 'pay') {
            toast(BILLING_REPLIES[btn.dataset.reply], C.orange);
            hideScreen();
            s.phase = 'play';
        }
    }

    function onPointer(e) {
        if (!s || (e.type === 'pointermove' && e.pointerType !== 'mouse' && !e.buttons)) return;
        const rect = stage.getBoundingClientRect();
        s.player.targetX = e.clientX - rect.left;
    }

    function onKeyDown(e) {
        const k = e.key;
        e.stopPropagation();
        if (k === 'Escape') {
            e.preventDefault();
            exit();
        } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
            keys.left = true;
            e.preventDefault();
        } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
            keys.right = true;
            e.preventDefault();
        } else if (k === ' ' || k === 'Enter') {
            e.preventDefault();
            if (!s || s.phase === 'start' || s.phase === 'over') startGame();
        } else if (k === 'p' || k === 'P') {
            if (s && s.phase === 'play') s.phase = 'pause';
            else if (s && s.phase === 'pause') s.phase = 'play';
        }
    }

    function onKeyUp(e) {
        e.stopPropagation();
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    }

    function exit() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('resize', resize);
        root.remove();
        const result = s && s.played
            ? { played: true, score: s.score, squashed: s.squashed, wave: s.wave, bill: s.bill, best }
            : { played: false, best };
        s = null;
        keys = {};
        resolveExit(result);
    }

    window.BugHunt = {
        start(container) {
            return new Promise((resolve) => {
                resolveExit = resolve;
                build(container);
                s = newState();
                startScreen();
                lastFrame = lastRender = fpsWindowStart = performance.now();
                raf = requestAnimationFrame(frame);
            });
        },
        money,
    };
})();
