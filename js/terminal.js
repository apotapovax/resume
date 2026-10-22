(() => {
    const PDF = 'assets/Alex-Potapov-Resume.pdf';
    const PROMPT = 'alex@cloudops:~$';
    const ONCALL_PROMPT = 'oncall@prod-us-east-1:~$';

    const EXPERIENCE = [
        {
            name: 'fedex-dataworks',
            company: 'FedEx DataWorks',
            role: 'CloudOps Engineer III',
            period: 'Jan 2022 – Present',
            since: [2022, 1],
            location: 'Remote',
            bullets: [
                'Operates enterprise-scale Kubernetes: hundreds of clusters, thousands of microservices on AWS and Azure',
                'Architected reusable, nested Terraform modules (AWS, Azure) with built-in policy enforcement: compliant by default',
                'Designed the org-wide CI/CD templating framework on GitHub Actions, adopted by hundreds of repositories',
                'Migrated legacy Jenkins pipelines to GitHub Actions with self-hosted runners',
                'Integrated AI into CI/CD: LLM agents in GitHub Actions for PR review and pipeline failure analysis',
                'Patched critical bugs in the azurerm Terraform provider',
            ],
            stack: 'AWS, Azure, Kubernetes, Terraform, Terragrunt, Crossplane, Helm, ArgoCD, GitHub Actions, Prometheus, Grafana, Datadog',
        },
        {
            name: 'shoprunner',
            company: 'ShopRunner',
            role: 'Senior Cloud Engineer',
            period: 'Nov 2020 – Jan 2022',
            age: '1y3m',
            location: 'Remote',
            bullets: [
                'Promoted from Cloud Engineer to Senior Cloud Engineer',
                'Owned health, performance and stability of production systems',
                'Implemented GitHub Actions CI and reusable CI templates for hundreds of repositories',
                'Built and maintained Jenkins and GitHub Actions pipelines',
            ],
            stack: 'AWS, Kubernetes (EKS), Helm, Terraform, Jenkins, Spinnaker, GitHub Actions, Datadog, PagerDuty',
        },
        {
            name: 'renessans-roaming',
            company: 'Renessans-Roaming Ltd',
            role: 'DevOps Engineer',
            period: 'Aug 2019 – Nov 2020',
            age: '1y4m',
            location: 'Remote',
            bullets: [
                'Automated build, test and release across AWS, GCP and Azure',
                'Turned recurring production errors into tooling that prevented repeat incidents',
                'Built CI/CD with Jenkins and GitLab CI; ran security and performance testing',
            ],
            stack: 'GCP, AWS, Azure, Kubernetes, Docker, Terraform, Ansible, Packer, Jenkins, GitLab CI, Prometheus',
        },
        {
            name: 'step-construction',
            company: 'STEP Construction',
            role: 'Lead Systems Administrator',
            period: '2008 – 2019',
            age: '10y9m',
            location: 'St. Petersburg, Russia',
            bullets: [
                'Grew from Systems Administrator (2008) to Senior (2012) to Lead (2016)',
                'Led a team of 7 system administrators; partnered with the CEO and CIO on the IT roadmap',
                'Built the server infrastructure for 400+ users from the ground up',
                'Implemented HA geo-distributed VMware clusters and 2-node vSAN / Hyper-V in branches',
                'Integrated on-prem infrastructure with AWS and GCP; introduced Terraform, Ansible and Packer',
            ],
            stack: 'VMware vSphere/vSAN, Hyper-V, Windows Server, Linux, AD, Exchange, Veeam, Zabbix, AWS, GCP, Terraform, Ansible',
        },
    ];

    const SKILLS = [
        ['cloud', 'AWS, Azure, GCP, Cloudflare'],
        ['containers', 'Kubernetes (EKS, AKS, GKE), Docker, Helm'],
        ['iac', 'Terraform, Terragrunt, Crossplane, Ansible, Packer'],
        ['ci_cd', 'GitHub Actions, ArgoCD, Azure DevOps, Jenkins, GitLab CI'],
        ['observability', 'Prometheus, Grafana, Datadog, Honeycomb, Sumo Logic, PagerDuty'],
        ['ai_gpu', 'AI in CI/CD (LLM agents), MCP, NVIDIA GPU Operator, GPU autoscaling'],
        ['security_finops', 'SOC 2, Snyk, Cloud Custodian, OpenCost, Vantage'],
        ['code_data', 'Python, Bash, PowerShell, PostgreSQL, Redis, Elasticsearch, ClickHouse'],
    ];

    const CERTS = [
        ['Microsoft DevOps Engineer Expert (course)', 2023],
        ['AWS DevOps Engineer (A Cloud Guru course)', 2021],
        ['Red Hat RH124, RH134', 2019],
        ['Cisco ICND1, ICND2', 2019],
        ['Microsoft 20740, 20742 (Windows Server)', 2018],
    ];

    // On-call game. Each command advances the incident clock; the error budget burns per minute.
    const GAME_CMDS = {
        pods: { cmd: 'kubectl get pods', label: 'get pods', cost: 2 },
        logs: { cmd: 'kubectl logs deploy/checkout-api', label: 'logs', cost: 2 },
        describe: { cmd: 'kubectl describe pod checkout-api', label: 'describe pod', cost: 2 },
        history: { cmd: 'argocd app history checkout-api', label: 'argocd history', cost: 2 },
        top: { cmd: 'kubectl top nodes', label: 'top nodes', cost: 2 },
        hpa: { cmd: 'kubectl get hpa', label: 'get hpa', cost: 2 },
        certs: { cmd: 'kubectl get certificate', label: 'get certificate', cost: 2 },
        rollback: { cmd: 'argocd app rollback checkout-api', label: 'rollback', cost: 3, fix: true },
        scale: { cmd: 'kubectl scale deploy/checkout-api --replicas=20', label: 'scale to 20', cost: 3, fix: true },
        restart: { cmd: 'kubectl rollout restart deploy/checkout-api', label: 'rollout restart', cost: 3, fix: true },
        renew: { cmd: 'cmctl renew checkout-tls', label: 'renew cert', cost: 3, fix: true },
    };

    const GAME_PREFIXES = [
        ['kubectl get pod', 'pods'], ['pods', 'pods'],
        ['kubectl logs', 'logs'], ['logs', 'logs'],
        ['kubectl describe', 'describe'], ['describe', 'describe'],
        ['argocd app history', 'history'], ['history', 'history'],
        ['kubectl top', 'top'], ['top', 'top'],
        ['kubectl get hpa', 'hpa'], ['hpa', 'hpa'],
        ['kubectl get cert', 'certs'], ['certs', 'certs'],
        ['argocd app rollback', 'rollback'], ['rollback', 'rollback'],
        ['kubectl scale', 'scale'], ['scale', 'scale'],
        ['kubectl rollout restart', 'restart'], ['restart', 'restart'],
        ['cmctl renew', 'renew'], ['renew', 'renew'],
    ];

    const HEALTHY = {
        pods: [
            'NAME                            READY   STATUS    RESTARTS   AGE',
            'checkout-api-7d9f8c6b5-2xk4p    1/1     Running   0          3d',
            'checkout-api-7d9f8c6b5-9qz7m    1/1     Running   0          3d',
            'checkout-api-7d9f8c6b5-tl6wd    1/1     Running   0          3d',
        ],
        logs: [
            '03:06:58 INFO  GET /healthz 200 1ms',
            '03:07:08 INFO  GET /healthz 200 1ms',
        ],
        describe: [
            'Image:          registry.internal/checkout-api:v2.13.2',
            'State:          Running',
            'Ready:          True',
            'Restart Count:  0',
            'Events:         <none>',
        ],
        history: [
            'ID  DATE           REVISION',
            '40  9 days ago     v2.13.1 (9be41c2)',
            '41  3 days ago     v2.13.2 (a1c9e04)   <- current',
        ],
        top: [
            'NAME                 CPU%   MEMORY%',
            'ip-10-0-12-41        38%    52%',
            'ip-10-0-14-07        41%    49%',
            'ip-10-0-15-88        35%    55%',
        ],
        hpa: [
            'NAME           TARGETS    MINPODS   MAXPODS   REPLICAS',
            'checkout-api   22%/70%    3         20        3',
        ],
        certs: [
            'NAME           READY   SECRET         EXPIRES',
            'checkout-tls   True    checkout-tls   in 61d',
        ],
    };

    const SCENARIOS = [
        {
            id: 'bad-deploy',
            burn: 4,
            alert: '[P1] checkout-api: HTTP 5xx rate 41% (threshold 2%)',
            fix: 'rollback',
            clues: {
                pods: [
                    'NAME                            READY   STATUS             RESTARTS   AGE',
                    'checkout-api-7d9f8c6b5-2xk4p    1/1     Running            0          3d',
                    'checkout-api-7d9f8c6b5-9qz7m    1/1     Running            0          3d',
                    'checkout-api-84c5d7f9d-hb2lw    0/1     <red>CrashLoopBackOff</red>   6          6m',
                    'checkout-api-84c5d7f9d-x8r4t    0/1     <red>CrashLoopBackOff</red>   6          6m',
                    'checkout-api-84c5d7f9d-p5n2c    0/1     <red>CrashLoopBackOff</red>   5          6m',
                ],
                logs: [
                    '03:01:12 INFO  starting checkout-api v2.14.0',
                    '03:01:12 INFO  loading config from environment',
                    '<red>03:01:12 FATAL config: required env PAYMENTS_API_URL is not set</red>',
                ],
                describe: [
                    'Image:          registry.internal/checkout-api:<yellow>v2.14.0</yellow>',
                    'Last State:     Terminated (Reason: Error, Exit Code: 1)',
                    'Restart Count:  6',
                    'Events:         Warning  BackOff  Back-off restarting failed container',
                ],
                history: [
                    'ID  DATE           REVISION',
                    '41  3 days ago     v2.13.2 (a1c9e04)',
                    '42  <yellow>6 minutes ago  v2.14.0 (f37b2d1)</yellow>   <- current',
                ],
            },
            wrong: {
                restart: 'Pods restarted… and went straight back to CrashLoopBackOff.',
                scale: 'More replicas, more crashing pods. The error rate did not move.',
                renew: 'Certificate renewed. It was valid for 61 more days anyway. Nothing changed.',
            },
            resolved: [
                'Rollback to revision 41 (v2.13.2) started',
                'checkout-api: Synced, Healthy',
                '5xx rate 41% → 0.1%',
            ],
            cause: 'Release v2.14.0 shipped without the PAYMENTS_API_URL environment variable, so new pods crashed on startup.',
            actions: [
                'Validate required env vars in CI before the image is promoted',
                'Use progressive delivery (canary + automatic rollback on error rate)',
            ],
            hints: [
                'Start with the pods. Are they all the same age?',
                'Something changed 6 minutes ago. What does ArgoCD say?',
                'A bad release is fixed fastest by going back to the last good one.',
            ],
        },
        {
            id: 'traffic-spike',
            burn: 3,
            alert: '[P1] checkout-api: p99 latency 9.8s, 5xx rate 23%',
            fix: 'scale',
            clues: {
                pods: [
                    'NAME                            READY   STATUS    RESTARTS   AGE',
                    'checkout-api-7d9f8c6b5-2xk4p    1/1     Running   0          3d',
                    'checkout-api-7d9f8c6b5-9qz7m    1/1     Running   0          3d',
                    'checkout-api-7d9f8c6b5-c81vx    1/1     Running   0          41m',
                    'checkout-api-7d9f8c6b5-k2m9e    1/1     Running   0          38m',
                    '<muted>… 6 more, all Running</muted>',
                ],
                logs: [
                    '<yellow>03:06:41 WARN  worker pool exhausted (64/64 busy)</yellow>',
                    '<yellow>03:06:42 WARN  upstream request queue depth 4812</yellow>',
                    '<red>03:06:52 ERROR request timed out after 10000ms</red>',
                    '03:06:53 INFO  marketing-campaign=flash-sale-50 utm_source=email',
                ],
                describe: [
                    'Image:          registry.internal/checkout-api:v2.13.2',
                    'State:          Running',
                    'Limits:         cpu: 1, memory: 1Gi',
                    'Restart Count:  0',
                ],
                top: [
                    'NAME                 CPU%   MEMORY%',
                    'ip-10-0-12-41        <red>96%</red>    71%',
                    'ip-10-0-14-07        <red>93%</red>    69%',
                    'ip-10-0-15-88        <red>91%</red>    74%',
                ],
                hpa: [
                    'NAME           TARGETS     MINPODS   MAXPODS   REPLICAS',
                    'checkout-api   <red>187%/70%</red>    3         <red>10</red>        <red>10</red>',
                ],
            },
            wrong: {
                rollback: 'Rolled back to v2.13.1. Same traffic, same timeouts. Rolled forward again.',
                restart: 'Restarting pods at peak load: 10 pods went cold at once. 5xx briefly hit 60%.',
                renew: 'Certificate renewed. Customers are still waiting 10 seconds per request.',
            },
            resolved: [
                'deployment.apps/checkout-api scaled to 20',
                'HPA maxReplicas 10 → 30, cluster-autoscaler added 4 nodes',
                'p99 latency 9.8s → 180ms, 5xx 23% → 0.2%',
            ],
            cause: 'A surprise flash-sale email tripled traffic; the HPA was capped at 10 replicas and the nodes ran out of CPU.',
            actions: [
                'Raise HPA maxReplicas and alert when the HPA sits at max',
                'Add a launch checklist so marketing campaigns reach the platform team',
            ],
            hints: [
                'Pods look healthy. Are they just… busy?',
                'Check the autoscaler and the nodes.',
                'The HPA is at its ceiling. Give it more room.',
            ],
        },
        {
            id: 'cert-expired',
            burn: 5,
            alert: '[P1] checkout: external availability 0% (synthetic checks failing)',
            fix: 'renew',
            clues: {
                logs: [
                    '03:06:58 INFO  GET /healthz 200 1ms',
                    '03:07:08 INFO  GET /healthz 200 1ms',
                    '<yellow>no customer requests received in the last 9 minutes</yellow>',
                ],
                top: [
                    'NAME                 CPU%   MEMORY%',
                    'ip-10-0-12-41        <yellow>6%</yellow>     31%',
                    'ip-10-0-14-07        <yellow>5%</yellow>     30%',
                    'ip-10-0-15-88        <yellow>7%</yellow>     33%',
                ],
                hpa: [
                    'NAME           TARGETS   MINPODS   MAXPODS   REPLICAS',
                    'checkout-api   4%/70%    3         20        3',
                ],
                certs: [
                    'NAME           READY   SECRET         EXPIRES',
                    'checkout-tls   <red>False</red>   checkout-tls   <red>expired 9m ago</red>',
                    '<muted>Message: renewal failed 29d ago: DNS-01 challenge timed out (no retry)</muted>',
                ],
            },
            wrong: {
                rollback: 'Rolled back to v2.13.1. Pods are healthy. They were healthy before, too.',
                restart: 'Fresh pods, same result: nothing reaches them.',
                scale: '20 idle pods. The cloud bill went up, availability is still 0%.',
            },
            resolved: [
                'Order checkout-tls-1 created, DNS-01 challenge passed',
                'Certificate checkout-tls issued, valid for 90 days',
                'External probes: 0% → 100% available',
            ],
            cause: 'The TLS certificate expired after cert-manager silently failed to renew it 29 days earlier.',
            actions: [
                'Alert on certificates expiring within 14 days',
                'Alert on failed cert-manager renewals, not just on expiry',
            ],
            hints: [
                'The pods are fine and idle. Traffic is not reaching them at all.',
                'What sits in front of the pods and has an expiry date?',
                'Check the certificate.',
            ],
        },
    ];

    let overlay, output, input, promptEl, chipsEl;
    let busy = false;
    let booted = false;
    let history = [];
    let historyIndex = 0;
    let game = null;
    let lastScenario = null;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const colorize = (s) => s.replace(/<(red|yellow|green|blue|muted|purple|bold)>(.*?)<\/\1>/g, '<span class="t-$1">$2</span>');
    const span = (cls, text) => `<span class="t-${cls}">${text}</span>`;
    const finePointer = () => window.matchMedia('(pointer: fine)').matches;

    function monthsSince([year, month]) {
        const now = new Date();
        const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month) + 1;
        return `${Math.floor(months / 12)}y${months % 12}m`;
    }

    function line(html = '', cls = '') {
        const div = document.createElement('div');
        div.className = `term-line ${cls}`;
        div.innerHTML = html || '&nbsp;';
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
    }

    async function print(lines, { delay = 12, cls = '' } = {}) {
        for (const l of lines) {
            line(colorize(l), cls);
            if (delay) await sleep(delay);
        }
    }

    // Shell commands

    function help() {
        return print([
            span('bold', 'Available commands'),
            `  ${span('green', 'whoami')}                    who is this guy`,
            `  ${span('green', 'kubectl get experience')}    work history`,
            `  ${span('green', 'kubectl describe')} ${span('muted', '&lt;name&gt;')}   details for one job (Tab to complete)`,
            `  ${span('green', 'cat skills.yaml')}           tech stack`,
            `  ${span('green', 'cat certifications.yaml')}   training & certifications`,
            `  ${span('green', 'terraform plan')}            preview adding Alex to your team`,
            `  ${span('red', 'oncall')}                    ${span('red', 'take the pager. a production incident awaits')}`,
            `  ${span('red', 'bug-hunt')}                  ${span('red', 'shoot bugs before they reach prod (arcade)')}`,
            `  ${span('green', 'contact')}                   how to reach Alex`,
            `  ${span('green', 'resume')}                    download the PDF`,
            `  ${span('green', 'clear')} / ${span('green', 'exit')}`,
            '',
            span('muted', 'Tip: Tab completes, ↑/↓ browse history, Esc closes. Some commands are not listed.'),
        ]);
    }

    function whoami() {
        return print([
            span('bold', 'Alex Potapov') + ' — Senior DevOps / CloudOps Engineer',
            'Cary, NC · 16+ years in infrastructure, from racking servers to running hundreds of Kubernetes clusters.',
            'Builds platforms other engineers actually enjoy using: Terraform modules, GitHub Actions frameworks,',
            'GitOps with ArgoCD, and AI agents wired into CI/CD.',
        ]);
    }

    function experience() {
        const rows = EXPERIENCE.map((e, i) => {
            const status = i === 0 ? span('green', 'Running  ') : span('muted', 'Completed');
            const age = e.since ? monthsSince(e.since) : e.age;
            return `${e.name.padEnd(20)} ${e.role.padEnd(28)} ${status}  ${age}`;
        });
        line(span('muted', `${'NAME'.padEnd(20)} ${'ROLE'.padEnd(28)} STATUS     AGE`), 'pre');
        return print([...rows, '', span('muted', "Run 'kubectl describe &lt;name&gt;' for details.")], { cls: 'pre' });
    }

    function describe(name) {
        const job = EXPERIENCE.find((e) => e.name === name || e.name.startsWith(name));
        if (!name || !job) {
            return print([
                `${span('red', 'Error from server (NotFound):')} experience "${escapeHtml(name || '')}" not found`,
                span('muted', `Try one of: ${EXPERIENCE.map((e) => e.name).join(', ')}`),
            ]);
        }
        return print([
            `Name:       ${span('bold', job.company)}`,
            `Role:       ${job.role}`,
            `Period:     ${job.period}`,
            `Location:   ${job.location}`,
            'Highlights:',
            ...job.bullets.map((b) => `  - ${b}`),
            `Stack:      ${span('blue', job.stack)}`,
        ]);
    }

    function skills() {
        return print([
            span('muted', '# skills.yaml'),
            ...SKILLS.map(([k, v]) => `${span('purple', k)}: [${span('green', v)}]`),
        ]);
    }

    function certs() {
        return print([
            span('muted', '# certifications.yaml'),
            ...CERTS.map(([name, year]) => `- name: ${span('green', name)}\n  year: ${span('yellow', year)}`),
        ]);
    }

    function plan() {
        return print([
            'Terraform will perform the following actions:',
            '',
            `  ${span('muted', '# module.your_team.engineer.alex_potapov')} will be created`,
            `  ${span('green', '+')} resource "engineer" "alex_potapov" {`,
            `      ${span('green', '+')} title       = "Senior DevOps / CloudOps Engineer"`,
            `      ${span('green', '+')} experience  = "16+ years"`,
            `      ${span('green', '+')} clouds      = ["aws", "azure", "gcp"]`,
            `      ${span('green', '+')} kubernetes  = "hundreds of clusters, thousands of microservices"`,
            `      ${span('green', '+')} iac         = ["terraform", "terragrunt", "crossplane"]`,
            `      ${span('green', '+')} ci_cd       = "GitHub Actions framework across hundreds of repos"`,
            `      ${span('green', '+')} on_call     = true`,
            `      ${span('green', '+')} location    = "Cary, NC"`,
            '    }',
            '',
            `${span('bold', 'Plan:')} 1 to add, 0 to change, 0 to destroy.`,
            '',
            span('muted', "Run 'terraform apply' to hire."),
        ], { cls: 'pre' });
    }

    async function apply() {
        await print([
            'engineer.alex_potapov: Creating...',
            'engineer.alex_potapov: Still creating... [10s elapsed]',
        ], { delay: 350 });
        await print([
            span('green', 'engineer.alex_potapov: Creation complete after 12s'),
            '',
            span('green', 'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.'),
            '',
        ]);
        return contact();
    }

    function contact() {
        return print([
            `email:     <a href="mailto:alexpotapov87@gmail.com">alexpotapov87@gmail.com</a>`,
            `phone:     <a href="tel:+14355135214">(435) 513-5214</a>`,
            `linkedin:  <a href="https://linkedin.com/in/alex-potapov" target="_blank" rel="noopener">linkedin.com/in/alex-potapov</a>`,
            `resume:    <a href="${PDF}" download>Alex-Potapov-Resume.pdf</a>`,
            `location:  Cary, NC`,
        ]);
    }

    function resume() {
        const a = document.createElement('a');
        a.href = PDF;
        a.download = '';
        a.click();
        return print([span('green', `Downloading ${PDF}…`)]);
    }

    function ls() {
        return print([
            `${span('blue', 'experience/')}  skills.yaml  certifications.yaml  README.md  ${span('red', 'pager.sh')}  ${span('red', 'bug-hunt')}`,
        ]);
    }

    function readme() {
        return print([
            '# alex-potapov',
            '',
            'Interactive resume. Run `help` for commands.',
            'If you only have 2 minutes, run `oncall` and see how you would do on a 3 AM page.',
        ]);
    }

    async function bugHunt() {
        if (!window.BugHunt) return print([span('red', 'bug-hunt: dashboard failed to load. Try a refresh.')]);
        await print([span('muted', 'Provisioning bug-hunt dashboard… grafana ready.')], { delay: 200 });
        const r = await window.BugHunt.start(overlay.querySelector('.term-window'));
        if (!r.played) return print([span('muted', 'Dashboard closed. The bugs are still out there.')]);
        return print([
            span('bold', 'bug-hunt summary'),
            `  wave reached    ${span('yellow', r.wave)}`,
            `  bugs squashed   ${span('green', r.squashed)}`,
            `  score           ${span('green', r.score.toLocaleString('en-US'))}  ${span('muted', `(best ${r.best.toLocaleString('en-US')})`)}`,
            `  aws bill        ${span('red', window.BugHunt.money(r.bill))}`,
            '',
            span('muted', "Alex fixes real bugs too. Run 'contact'."),
        ], { cls: 'pre' });
    }

    const SHELL = {
        help, '?': help, whoami,
        'kubectl get experience': experience, experience,
        'cat skills.yaml': skills, skills,
        'cat certifications.yaml': certs, certs, certifications: certs,
        'cat readme.md': readme, ls,
        'terraform plan': plan, 'terraform apply': apply,
        oncall: startGame, './pager.sh': startGame,
        'bug-hunt': bugHunt, bughunt: bugHunt, './bug-hunt': bugHunt,
        contact, hire: contact, resume,
        clear: () => { output.innerHTML = ''; },
        exit: () => close(),
        history: () => print(history.map((h, i) => `${String(i + 1).padStart(4)}  ${escapeHtml(h)}`)),
    };

    const EASTER_EGGS = [
        [/^sudo\b/, () => print([`${span('red', 'alex is not in the sudoers file.')} This incident will be reported.`])],
        [/^rm -rf/, () => print(['Nice try. Prod is protected by RBAC, OPA policies and a very tired on-call engineer.'])],
        [/^git blame/, () => print(['It was DNS. It is always DNS.'])],
        [/^(vim|vi|nano|emacs)\b/, () => print(['Opening editor… just kidding. You would never get out. (:q!)'])],
        [/^ping\b/, () => print(['PONG. Alex usually replies to email within a day.'])],
        [/^(coffee|brew)\b/, () => print(['☕ HTTP 418: I\'m a teapot.'])],
        [/^kubectl\b/, () => print([`${span('red', 'error:')} You must be logged in to the server (Unauthorized). Try 'kubectl get experience'.`])],
        [/^echo\s+(.*)/, (m) => print([escapeHtml(m[1])])],
        [/^date$/, () => print([new Date().toString()])],
        [/^cd\b/, () => print(['There is only one directory here, and it is a good one.'])],
    ];

    async function runShell(cmd) {
        const key = cmd.toLowerCase();
        if (SHELL[key]) return SHELL[key]();
        const describeMatch = key.match(/^kubectl describe (?:experience )?(\S*)/);
        if (describeMatch) return describe(describeMatch[1]);
        for (const [re, fn] of EASTER_EGGS) {
            const m = cmd.match(re);
            if (m) return fn(m);
        }
        return print([`${escapeHtml(cmd.split(' ')[0])}: command not found. Try ${span('green', 'help')}.`]);
    }

    // On-call game

    function clockAt(minutes) {
        const total = 3 * 60 + 7 + minutes;
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')} AM`;
    }

    function budgetBar() {
        const filled = Math.max(0, Math.round(game.budget / 10));
        const cls = game.budget > 60 ? 'green' : game.budget > 30 ? 'yellow' : 'red';
        return `${span('muted', 'error budget')} ${span(cls, `[${'#'.repeat(filled)}${'-'.repeat(10 - filled)}] ${Math.max(0, game.budget)}%`)}  ${span('muted', `${clockAt(game.minutes)} · T+${game.minutes}m`)}`;
    }

    async function startGame() {
        const choices = SCENARIOS.filter((s) => s.id !== lastScenario);
        const scenario = choices[Math.floor(Math.random() * choices.length)];
        lastScenario = scenario.id;
        game = { s: scenario, minutes: 0, budget: 100, commands: 0, hint: 0, investigated: new Set() };
        updatePrompt();
        renderChips();

        line('Paging on-call engineer', 't-muted');
        await sleep(400);
        line('*** PAGERDUTY · 03:07 AM ***', 't-page');
        await print([
            span('red', scenario.alert),
            '',
            'You are the on-call engineer. Find the root cause and fix it before the error budget runs out.',
            'Every command takes time. Investigating is cheap, a wrong fix is not.',
            span('muted', "Type a command or tap one below. 'hint' if stuck, 'status' for the clock, 'exit' to hand off the pager."),
            '',
            budgetBar(),
        ], { delay: 60 });
    }

    function resolveGameCommand(cmd) {
        const key = cmd.toLowerCase().replace(/\s+/g, ' ');
        const match = GAME_PREFIXES.find(([prefix]) => key.startsWith(prefix));
        return match ? match[1] : null;
    }

    async function runGame(cmd) {
        const key = cmd.toLowerCase();
        if (key === 'exit' || key === 'quit') {
            await print([span('yellow', 'Pager handed off to the secondary. They will remember this.')]);
            return endGame();
        }
        if (key === 'status') return print([budgetBar()]);
        if (key === 'hint') {
            const hints = game.s.hints;
            await print([span('purple', `hint: ${hints[Math.min(game.hint, hints.length - 1)]}`)]);
            game.hint += 1;
            return;
        }
        if (key === 'help') {
            return print([
                'Investigate: ' + ['pods', 'logs', 'describe', 'history', 'top', 'hpa', 'certs'].map((k) => span('blue', GAME_CMDS[k].cmd)).join(', '),
                'Fix:         ' + ['rollback', 'scale', 'restart', 'renew'].map((k) => span('yellow', GAME_CMDS[k].cmd)).join(', '),
                'Other:       hint, status, exit',
            ]);
        }

        const action = resolveGameCommand(cmd);
        if (!action) {
            return print([`${escapeHtml(cmd.split(' ')[0])}: not useful right now. Type ${span('green', 'help')} for incident commands.`]);
        }

        const def = GAME_CMDS[action];
        game.commands += 1;
        game.minutes += def.cost;

        if (!def.fix) {
            game.investigated.add(action);
            await print(game.s.clues[action] || HEALTHY[action], { delay: 30, cls: 'pre' });
        } else if (action === game.s.fix) {
            await print(game.s.resolved.map((l) => span('green', l)), { delay: 300 });
            return finishGame(true);
        } else {
            game.minutes += 3;
            await print([span('yellow', game.s.wrong[action])], { delay: 0 });
        }

        game.budget = 100 - game.minutes * game.s.burn;
        line(budgetBar());
        if (game.budget <= 0) return finishGame(false);
    }

    async function finishGame(won) {
        const { s, minutes, commands } = game;
        game.budget = Math.max(0, 100 - minutes * s.burn);
        line();
        if (!won) {
            await print([
                span('red', 'Error budget exhausted. Customers are posting screenshots. Your VP just joined the bridge.'),
                `Root cause: ${s.cause}`,
                '',
                `Run ${span('red', 'oncall')} to try another incident.`,
            ], { delay: 40 });
            return endGame();
        }

        const rating = minutes <= 8 ? ['green', 'Legendary. The pager fears you.']
            : minutes <= 14 ? ['green', 'Senior on-call material.']
                : minutes <= 22 ? ['yellow', 'Solid. The postmortem will be short.']
                    : ['yellow', 'Survived. Coffee is on the house.'];
        const luck = game.investigated.size === 0
            ? [span('purple', 'Fixed without looking at a single log. Bold. The postmortem will ask for evidence.')]
            : [];

        await print([
            span('bold', '── POSTMORTEM ─────────────────────────────'),
            `Incident:    ${s.alert}`,
            `Root cause:  ${s.cause}`,
            `MTTR:        ${span('bold', `${minutes} min`)} (${commands} commands, ${game.budget}% error budget left)`,
            `Rating:      ${span(rating[0], rating[1])}`,
            ...luck,
            'Action items:',
            ...s.actions.map((a) => `  - ${a}`),
            span('bold', '───────────────────────────────────────────'),
            '',
            `Alex handles incidents like this for real. Run ${span('green', 'contact')} to put him on your rotation,`,
            `or ${span('red', 'oncall')} to take another page.`,
        ], { delay: 40 });
        return endGame();
    }

    function endGame() {
        game = null;
        updatePrompt();
        renderChips();
    }

    // UI

    const SHELL_CHIPS = [
        ['help'], ['whoami'], ['kubectl get experience'], ['cat skills.yaml'],
        ['terraform plan'], ['oncall', 'hot'], ['bug-hunt', 'hot'], ['contact'], ['resume'],
    ];

    function renderChips() {
        chipsEl.innerHTML = '';
        const chips = game
            ? [
                ...['pods', 'logs', 'describe', 'history', 'top', 'hpa', 'certs'].map((k) => [GAME_CMDS[k].cmd, '', GAME_CMDS[k].label]),
                ...['rollback', 'scale', 'restart', 'renew'].map((k) => [GAME_CMDS[k].cmd, 'fix', GAME_CMDS[k].label]),
                ['hint'], ['exit'],
            ]
            : SHELL_CHIPS;
        for (const [cmd, cls = '', label = cmd] of chips) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `term-chip ${cls}`;
            b.textContent = label;
            b.title = cmd;
            b.disabled = busy;
            b.addEventListener('click', () => run(cmd));
            chipsEl.appendChild(b);
        }
    }

    function updatePrompt() {
        promptEl.textContent = game ? ONCALL_PROMPT : PROMPT;
        promptEl.classList.toggle('oncall', !!game);
    }

    async function run(raw) {
        if (busy) return;
        const cmd = raw.trim().replace(/\s+/g, ' ');
        const promptCls = game ? 't-red' : 't-green';
        line(`<span class="${promptCls}">${promptEl.textContent}</span> ${escapeHtml(cmd)}`);
        input.value = '';
        if (!cmd) return;
        history.push(cmd);
        historyIndex = history.length;

        busy = true;
        input.disabled = true;
        renderChips();
        try {
            await (game ? runGame(cmd) : runShell(cmd));
        } finally {
            busy = false;
            input.disabled = false;
            renderChips();
            if (!overlay.hidden && finePointer()) input.focus();
            output.scrollTop = output.scrollHeight;
        }
    }

    function completions() {
        if (game) return Object.values(GAME_CMDS).map((c) => c.cmd).concat(['hint', 'status', 'exit']);
        return Object.keys(SHELL).concat(EXPERIENCE.map((e) => `kubectl describe ${e.name}`));
    }

    function complete() {
        const value = input.value.toLowerCase();
        if (!value) return;
        const matches = completions().filter((c) => c.startsWith(value));
        if (matches.length === 1) {
            input.value = matches[0];
        } else if (matches.length > 1) {
            let prefix = matches[0];
            for (const m of matches) {
                while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
            }
            if (prefix.length > value.length) input.value = prefix;
            else line(span('muted', matches.join('   ')));
        }
    }

    function onKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            run(input.value);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            complete();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) input.value = history[--historyIndex];
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            historyIndex = Math.min(history.length, historyIndex + 1);
            input.value = history[historyIndex] || '';
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            output.innerHTML = '';
        }
    }

    function build() {
        overlay = document.createElement('div');
        overlay.className = 'term-overlay';
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="term-window" role="dialog" aria-modal="true" aria-label="Interactive terminal resume">
                <div class="term-titlebar">
                    <button type="button" class="term-dot red" aria-label="Close terminal"></button>
                    <span class="term-dot yellow"></span>
                    <span class="term-dot green"></span>
                    <span class="term-title">alex@cloudops: ~</span>
                </div>
                <div class="term-output" aria-live="polite"></div>
                <div class="term-inputrow">
                    <span class="term-prompt"></span>
                    <input class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command">
                </div>
                <div class="term-chips"></div>
            </div>`;
        document.body.appendChild(overlay);

        output = overlay.querySelector('.term-output');
        input = overlay.querySelector('.term-input');
        promptEl = overlay.querySelector('.term-prompt');
        chipsEl = overlay.querySelector('.term-chips');

        overlay.querySelector('.term-dot.red').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        output.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus(); });
        input.addEventListener('keydown', onKey);
        updatePrompt();
        renderChips();
    }

    async function boot() {
        booted = true;
        busy = true;
        renderChips();
        await print([
            span('muted', 'Connecting to apotapovax.github.io…'),
            span('muted', 'Authenticating as guest… ok'),
        ], { delay: 180 });
        await print([
            '',
            span('bold', 'Alex Potapov · Senior DevOps / CloudOps Engineer'),
            `Type ${span('green', 'help')} or tap a command below.`,
            `Feeling brave? Run ${span('red', 'oncall')} and fix a production incident.`,
            '',
        ], { delay: 40 });
        busy = false;
        renderChips();
        if (finePointer()) input.focus();
    }

    function open() {
        if (!overlay) build();
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        if (!booted) boot();
        else if (finePointer()) input.focus();
    }

    function close() {
        if (!overlay) return;
        overlay.hidden = true;
        document.body.style.overflow = '';
        if (location.hash === '#terminal') window.history.replaceState(null, '', location.pathname);
    }

    document.addEventListener('keydown', (e) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        if (e.key === 'Escape' && overlay && !overlay.hidden) close();
        else if (e.key === '`' && !typing) {
            e.preventDefault();
            open();
        }
    });

    document.querySelectorAll('[data-open-terminal]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            open();
        });
    });

    if (location.hash === '#terminal') open();
})();
