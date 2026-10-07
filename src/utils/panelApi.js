// Wrapper Pterodactyl Application API, Cloudflare DNS, dan SSH runner.
const fs = require('fs');
const path = require('path');
const pcfg = require('./panelConfig');

// ======================= [ Pterodactyl ] =======================
async function api(method, endpoint, body) {
    const c = pcfg.get();
    const res = await fetch(`${c.domain}/api/application${endpoint}`, {
        method,
        headers: {
            Accept: 'application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${c.apikey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 204) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const detail = json?.errors?.map((e) => e.detail).filter(Boolean).join('; ');
        throw new Error(detail || `HTTP ${res.status}`);
    }
    return json;
}

// ambil semua halaman (per_page=100)
async function getAll(endpoint) {
    const out = [];
    let page = 1;
    for (;;) {
        const sep = endpoint.includes('?') ? '&' : '?';
        const json = await api('GET', `${endpoint}${sep}per_page=100&page=${page}`);
        out.push(...(json?.data || []));
        const pg = json?.meta?.pagination;
        if (!pg || pg.current_page >= pg.total_pages) break;
        page++;
    }
    return out;
}

let eggCache = null;
async function getEgg() {
    const c = pcfg.get();
    if (eggCache && eggCache.key === `${c.nest}:${c.egg}`) return eggCache.data;
    const json = await api('GET', `/nests/${c.nest}/eggs/${c.egg}?include=variables`);
    const a = json.attributes;
    const environment = {};
    for (const v of a.relationships?.variables?.data || []) {
        environment[v.attributes.env_variable] = v.attributes.default_value;
    }
    const data = { startup: a.startup, image: a.docker_image, environment };
    eggCache = { key: `${c.nest}:${c.egg}`, data };
    return data;
}

async function createUser({ username, password, admin = false }) {
    const c = pcfg.get();
    const json = await api('POST', '/users', {
        email: `${username}@${c.emailDomain}`,
        username,
        first_name: username,
        last_name: admin ? 'Admin' : 'User',
        language: 'en',
        password,
        root_admin: admin,
    });
    return json.attributes;
}

// buat user + server. Kalau server gagal, user dibersihkan lagi.
async function createPanel({ username, password, limits }) {
    const c = pcfg.get();
    const egg = await getEgg();
    const user = await createUser({ username, password });

    try {
        const json = await api('POST', '/servers', {
            name: username,
            description: 'Panel by bot',
            user: user.id,
            egg: c.egg,
            docker_image: egg.image,
            startup: egg.startup,
            environment: egg.environment,
            limits: { memory: limits.ram, swap: 0, disk: limits.disk, io: 500, cpu: limits.cpu },
            feature_limits: { databases: 5, backups: 5, allocations: 5 },
            deploy: { locations: [c.loc], dedicated_ip: false, port_range: [] },
        });
        return { user, server: json.attributes };
    } catch (err) {
        try { await api('DELETE', `/users/${user.id}`); } catch { /* abaikan */ }
        throw err;
    }
}

// hapus server; user ikut dihapus kalau tidak punya server lain dan bukan admin
async function deletePanel(serverId) {
    const s = await api('GET', `/servers/${serverId}`);
    const userId = s.attributes.user;
    const name = s.attributes.name;
    await api('DELETE', `/servers/${serverId}`);

    let userDeleted = false;
    try {
        const others = (await getAll('/servers')).filter((x) => x.attributes.user === userId);
        if (!others.length) {
            const u = await api('GET', `/users/${userId}`);
            if (!u.attributes.root_admin) {
                await api('DELETE', `/users/${userId}`);
                userDeleted = true;
            }
        }
    } catch { /* user dibiarkan kalau gagal */ }
    return { name, userId, userDeleted };
}

// ======================= [ Cloudflare ] =======================
async function createDnsRecord(domain, host, ip) {
    const z = pcfg.get().subdomain[domain];
    if (!z) throw new Error('Domain tidak terdaftar di config');
    const name = `${host}.${domain}`;
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${z.zone}/dns_records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${z.apitoken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: ip.includes(':') ? 'AAAA' : 'A', name, content: ip, ttl: 1, proxied: false }),
        signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => null);
    if (!json?.success) {
        throw new Error(json?.errors?.map((e) => e.message).join(', ') || `HTTP ${res.status}`);
    }
    return { name, ip };
}

// ======================= [ SSH ] =======================
// Jalankan script bash di VPS (root) lewat `bash -s`.
function sshRun({ host, password, script, timeoutMs = 25 * 60 * 1000 }) {
    const { Client } = require('ssh2');
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let output = '';
        let done = false;
        const finish = (fn, val) => { if (done) return; done = true; clearTimeout(timer); try { conn.end(); } catch { /* */ } fn(val); };
        const timer = setTimeout(() => finish(reject, new Error('Timeout menjalankan script di VPS')), timeoutMs);

        conn.on('ready', () => {
            conn.exec('bash -s', (err, stream) => {
                if (err) return finish(reject, err);
                stream.on('data', (d) => { output += d.toString(); });
                stream.stderr.on('data', (d) => { output += d.toString(); });
                stream.on('close', (code) => finish(resolve, { code, output }));
                stream.end(script);
            });
        });
        conn.on('error', (e) => finish(reject, e));
        conn.connect({ host, port: 22, username: 'root', password, readyTimeout: 20000 });
    });
}

// baca template .sh dan ganti token {{KEY}}
function loadScript(name, vars = {}) {
    let s = fs.readFileSync(path.join(__dirname, 'scripts', name), 'utf8');
    for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v));
    return s;
}

async function getNodeConfig(nodeId) {
    return api('GET', `/nodes/${nodeId}/configuration`);
}

module.exports = {
    api, getAll, createUser, createPanel, deletePanel,
    createDnsRecord, sshRun, loadScript, getNodeConfig,
};
