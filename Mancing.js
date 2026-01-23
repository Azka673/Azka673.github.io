const prefixes = ["Void", "Abyssal", "Neon", "Spectral", "Ancient", "Radiant", "Frozen", "Lunar", "Solar", "Aether", "Deepsea", "Shadow", "Mystic", "Cursed", "Nebula"];
const types = ["Leviathan", "Kraken", "Dragon", "Hydra", "Serpent", "Ray", "Tuna", "Shark", "Marlin", "Ghost", "Eel", "Salmon", "Bass", "Trout", "El Shaark Granmaja"];

const rarities = [
    { type: "Common", chance: 100, price: 15, css: "common" },
    { type: "Rare", chance: 35, price: 60, css: "rare" },
    { type: "Epic", chance: 12, price: 250, css: "epic" },
    { type: "Legendary", chance: 3, price: 1200, css: "legendary" },
    { type: "Mythic", chance: 0.8, price: 6000, css: "mythic" },
    { type: "Celestial", chance: 0.08, price: 30000, css: "celestial" },
    { type: "SECRET", chance: 0.005, price: 200000, css: "secret" }
];

const fishDatabase = [];
prefixes.forEach(p => types.forEach(t => fishDatabase.push({ name: `${p} ${t}` })));

const rods = {
    wood: { name: "Starter Rod", luck: 1.0, cost: 0 },
    carbon: { name: "Carbon Fiber", luck: 5.0, cost: 4000 },
    titanium: { name: "Titanium Elite", luck: 25.0, cost: 60000 },
    nebula: { name: "Nebula Weaver", luck: 200.0, cost: 1500000 }
};

let state = { money: 0, inventory: [], found: [], luckLv: 1, hookLv: 0, rod: 'wood', owned: ['wood'] };

// LOAD DATA
if(localStorage.getItem('ocean_rng_save_v5')) {
    state = JSON.parse(localStorage.getItem('ocean_rng_save_v5'));
}

let pos = 0; let dir = 1; let moving = true;

function formatMoney(n) {
    if (n < 1000) return n.toFixed(0);
    const s = ["", "K", "M", "B", "T"];
    const i = Math.floor(Math.log10(n) / 3);
    return (n / Math.pow(1000, i)).toFixed(1) + s[i];
}

// SAVE FUNCTION WITH NOTIFICATION
function save() { 
    localStorage.setItem('ocean_rng_save_v5', JSON.stringify(state)); 
    updateUI();
    const notif = document.getElementById('save-notif');
    notif.style.opacity = "1";
    setTimeout(() => { notif.style.opacity = "0"; }, 1500);
}

// AUTO-SAVE SYSTEM (Every 10 Seconds)
setInterval(() => {
    save();
    console.log("Game Auto-Saved");
}, 10000);

function updateUI() {
    document.getElementById('money-display').innerText = formatMoney(state.money);
    document.getElementById('luck-lv').innerText = state.luckLv;
    document.getElementById('hook-lv').innerText = state.hookLv;
    document.getElementById('luck-cost').innerText = formatMoney(state.luckLv * 250);
    document.getElementById('hook-cost').innerText = formatMoney((state.hookLv + 1) * 1200);
    
    // LUCK 10% PER LEVEL
    let totalLuck = (100 + (state.luckLv - 1) * 10) * rods[state.rod].luck;
    document.getElementById('luck-total-display').innerText = formatMoney(totalLuck);
    document.getElementById('current-rod-name').innerText = rods[state.rod].name;

    const gz = document.getElementById('green-zone');
    let w = 20 + (state.hookLv * 6);
    gz.style.width = w + "%";
    gz.style.left = (50 - (w/2)) + "%";
}

function loop() {
    if(moving) {
        pos += 4.5 * dir;
        if(pos >= 98 || pos <= 0) dir *= -1;
        document.getElementById('pointer').style.left = pos + "%";
    }
    requestAnimationFrame(loop);
}

document.getElementById('catch-btn').onclick = () => {
    if(!moving) return;
    moving = false;
    
    const w = 20 + (state.hookLv * 6);
    const start = 50 - (w/2);
    const end = 50 + (w/2);
    
    const status = document.getElementById('status-text');
    const display = document.getElementById('fish-display');

    if(pos >= start && pos <= end) {
        let luckMult = (1 + (state.luckLv - 1) * 0.1) * rods[state.rod].luck;
        let roll = Math.random() * 100;
        let res = [...rarities].sort((a,b)=>a.chance-b.chance).find(r => roll <= (r.chance * luckMult)) || rarities[0];
        
        let fName = fishDatabase[Math.floor(Math.random()*fishDatabase.length)].name;
        state.inventory.push({ name: fName, rarity: res.type, price: res.price, css: res.css });
        if(!state.found.includes(fName)) state.found.push(fName);

        status.innerText = "CAPTURED!";
        display.innerText = `${fName} [${res.type}]`;
        display.className = "fish-name " + res.css;
    } else {
        status.innerText = "MISSED!";
        display.innerText = "The fish escaped...";
        display.className = "fish-name common";
    }

    setTimeout(() => { moving = true; }, 700);
    save(); // Simpan setiap tarikan
};

// NAVIGASI & RENDER
function showSection(id) {
    document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
    document.getElementById(id + '-section').style.display = 'block';
    document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + id).classList.add('active');
    if(id === 'inventory') renderInv();
    if(id === 'index') renderIdx();
    if(id === 'shop') renderShop();
}

function renderInv() {
    let total = 0; state.inventory.forEach(f => total += f.price);
    document.getElementById('inv-count').innerText = state.inventory.length;
    document.getElementById('total-sell-value').innerText = formatMoney(total);
    document.getElementById('inventory-list').innerHTML = state.inventory.slice().reverse().map(f => `
        <div class="stat-card" style="display:flex; justify-content:space-between;">
            <span class="${f.css}">${f.name}</span>
            <span style="color:var(--secondary)">💰 ${formatMoney(f.price)}</span>
        </div>
    `).join('');
}

function renderIdx() {
    document.getElementById('index-grid').innerHTML = fishDatabase.map(f => {
        const has = state.found.includes(f.name);
        return `<div class="index-card ${has?'':'locked'}">${has?f.name:'???'}</div>`;
    }).join('');
}

function renderShop() {
    document.getElementById('shop-list').innerHTML = Object.keys(rods).map(k => {
        const r = rods[k]; const has = state.owned.includes(k);
        return `<div class="stat-card">
            <h3>${r.name} (x${r.luck} Luck)</h3><p>Price: 💰 ${formatMoney(r.cost)}</p>
            ${has ? `<button onclick="state.rod='${k}';save();renderShop();" class="sell-all-btn">${state.rod===k?'EQUIPPED':'EQUIP'}</button>` : `<button onclick="buyRod('${k}')" class="sell-all-btn">BUY ROD</button>`}
        </div>`;
    }).join('');
}

function buyRod(k) { if(state.money >= rods[k].cost) { state.money -= rods[k].cost; state.owned.push(k); save(); renderShop(); } }
function sellAllFish() { let e = 0; state.inventory.forEach(f => e += f.price); state.money += e; state.inventory = []; save(); renderInv(); }
function buyUpgrade(t) {
    if(t === 'luck' && state.money >= state.luckLv * 250) { state.money -= state.luckLv * 250; state.luckLv++; }
    if(t === 'hook' && state.hookLv < 5 && state.money >= (state.hookLv + 1) * 1200) { state.money -= (state.hookLv + 1) * 1200; state.hookLv++; }
    save();
}
function resetGame() { if(confirm("Reset everything?")) { localStorage.clear(); location.reload(); } }

updateUI();
loop();