// TWÓJ LINK DO BAZY FIREBASE:
const FIREBASE_URL = "https://nezziak-b8c63-default-rtdb.europe-west1.firebasedatabase.app/";

// STAŁE DANE GRACZA (ZAPISYWANE W PRZEGLĄDARCE, ŻEBY KOSTKA NIGDY SIĘ NIE ZABLOKOWAŁA)
let myId = localStorage.getItem("rsl_uid") || ("p_" + Math.floor(Math.random() * 900000 + 100000));
localStorage.setItem("rsl_uid", myId);

let myNick = localStorage.getItem("rsl_nick") || ("Hanys_" + Math.floor(Math.random() * 90 + 10));
let myColor = localStorage.getItem("rsl_color") || "#f59e0b";

// OSOBNY BALANS KASYNOWY (NIGDY NIE ŁĄCZY SIĘ Z MONOPOLY!)
let casinoBalance = parseInt(localStorage.getItem("rsl_casino_cash")) || 1000;

let currentRoom = "RSL1";
let roomState = null;
let pollTimer = null;

// =====================================================
// ORYGINALNA PLANSZA 40 PÓL (SIATKA 11x11 - JAK W RICHUP.IO)
// Państwa 1 i 8 mają po 2 pola, wszystkie pozostałe po 3 pola!
// Lotniska/Dworce symetrycznie na środku boków (indeksy 5, 15, 25, 35)
// =====================================================
const MAP_40 = [
    // DÓŁ (0 - 10)
    { name: "START", type: "start", icon: "🏁" },
    { name: "Orzegów", type: "prop", price: 60, rent: 20, house: 50, color: "#854d0e", group: 1 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Godula", type: "prop", price: 60, rent: 25, house: 50, color: "#854d0e", group: 1 },
    { name: "Podatek dochodowy", type: "tax", amount: 150, icon: "💸" },
    { name: "Dworzec Chebzie", type: "station", price: 200, rent: 75, color: "#38bdf8", group: 9, icon: "✈️" },
    { name: "Chebzie", type: "prop", price: 100, rent: 35, house: 50, color: "#0ea5e9", group: 2 },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    { name: "Ruda Południowa", type: "prop", price: 100, rent: 35, house: 50, color: "#0ea5e9", group: 2 },
    { name: "Ruda 1", type: "prop", price: 120, rent: 45, house: 50, color: "#0ea5e9", group: 2 },
    // LEWY DÓŁ NAROŻNIK (10)
    { name: "Więzienie (Izba)", type: "jail", icon: "⛓️" },
    // LEWA STRONA (11 - 19)
    { name: "Kuźnica", type: "prop", price: 140, rent: 50, house: 100, color: "#ec4899", group: 3 },
    { name: "Elektrownia RSL", type: "utility", price: 150, rent: 60, color: "#94a3b8", group: 10, icon: "⚡" },
    { name: "Czarny Las", type: "prop", price: 140, rent: 50, house: 100, color: "#ec4899", group: 3 },
    { name: "Bielszowice", type: "prop", price: 160, rent: 60, house: 100, color: "#ec4899", group: 3 },
    { name: "Lotnisko Muchowiec", type: "station", price: 200, rent: 75, color: "#38bdf8", group: 9, icon: "✈️" },
    { name: "Kokota", type: "prop", price: 180, rent: 70, house: 100, color: "#f97316", group: 4 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Bykowina Targ", type: "prop", price: 180, rent: 70, house: 100, color: "#f97316", group: 4 },
    { name: "Bykowina", type: "prop", price: 200, rent: 80, house: 100, color: "#f97316", group: 4 },
    // LEWA GÓRA NAROŻNIK (20)
    { name: "Wakacje (Burloch)", type: "parking", icon: "🏖️" },
    // GÓRA (21 - 29)
    { name: "Wirek", type: "prop", price: 220, rent: 90, house: 150, color: "#ef4444", group: 5 },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    { name: "Targowisko Wirek", type: "prop", price: 220, rent: 90, house: 150, color: "#ef4444", group: 5 },
    { name: "CH Plaza Ruda", type: "prop", price: 240, rent: 100, house: 150, color: "#ef4444", group: 5 },
    { name: "Węzeł DTŚ Ruda", type: "station", price: 200, rent: 75, color: "#38bdf8", group: 9, icon: "✈️" },
    { name: "Kochłowice Planty", type: "prop", price: 260, rent: 110, house: 150, color: "#eab308", group: 6 },
    { name: "Kochłowice Rynek", type: "prop", price: 260, rent: 110, house: 150, color: "#eab308", group: 6 },
    { name: "Wodociągi PWiK", type: "utility", price: 150, rent: 60, color: "#94a3b8", group: 10, icon: "💧" },
    { name: "Radoszowy", type: "prop", price: 280, rent: 120, house: 150, color: "#eab308", group: 6 },
    // PRAWA GÓRA NAROŻNIK (30)
    { name: "Idź do Więzienia!", type: "gotojail", icon: "🚔" },
    // PRAWA STRONA (31 - 39)
    { name: "Kłodnica", type: "prop", price: 300, rent: 130, house: 200, color: "#22c55e", group: 7 },
    { name: "Halemba Pętla", type: "prop", price: 300, rent: 130, house: 200, color: "#22c55e", group: 7 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Aquadrom Halemba", type: "prop", price: 320, rent: 145, house: 200, color: "#22c55e", group: 7 },
    { name: "Autostrada A4", type: "station", price: 200, rent: 75, color: "#38bdf8", group: 9, icon: "✈️" },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    { name: "Fryna (Nowy Bytom)", type: "prop", price: 350, rent: 170, house: 200, color: "#3b82f6", group: 8 },
    { name: "Podatek Luksusowy", type: "tax", amount: 100, icon: "💍" },
    { name: "Nowy Bytom Ratusz", type: "prop", price: 400, rent: 200, house: 200, color: "#3b82f6", group: 8 }
];

// GENEROWANIE MAPY 60 PÓL (+50% WIĘKSZA - SIATKA 16x16)
const MAP_60 = [];
for (let i = 0; i < 60; i++) {
    if (i === 0) MAP_60.push({ name: "START", type: "start", icon: "🏁" });
    else if (i === 15) MAP_60.push({ name: "Więzienie", type: "jail", icon: "⛓️" });
    else if (i === 30) MAP_60.push({ name: "Wakacje", type: "parking", icon: "🏖️" });
    else if (i === 45) MAP_60.push({ name: "Idź do Więzienia!", type: "gotojail", icon: "🚔" });
    else if (i % 15 === 7) MAP_60.push({ name: "Lotnisko RSL #" + Math.ceil(i/15), type: "station", price: 200, rent: 80, color: "#38bdf8", group: 9, icon: "✈️" });
    else {
        const base = MAP_40[i % MAP_40.length];
        if (base.type === "prop") {
            const grp = Math.floor(i / 5) + 1;
            const cols = ["#854d0e","#0ea5e9","#ec4899","#f97316","#ef4444","#eab308","#22c55e","#3b82f6","#a855f7","#14b8a6","#e11d48","#6366f1"];
            MAP_60.push({
                name: base.name + " " + (i > 39 ? "II" : ""),
                type: "prop",
                price: 60 + i * 6,
                rent: 20 + i * 3,
                house: 50 + Math.floor(i / 15) * 50,
                color: cols[grp % cols.length],
                group: grp
            });
        } else {
            MAP_60.push({ ...base });
        }
    }
}

window.onload = () => {
    document.getElementById("my-nick-input").value = myNick;
    document.getElementById("my-color-input").value = myColor;
    document.getElementById("casino-wallet-top").innerText = casinoBalance;

    joinRoomNow("RSL1");
    loadPublicRoomsList();
    initLudoLocal();
    liarInit();
    init8x8('checkers');
};

function switchMainView(viewId) {
    document.querySelectorAll('.main-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event?.target?.classList?.add('active');
}

async function updateMyProfile() {
    myNick = document.getElementById("my-nick-input").value.trim() || "Gracz";
    myColor = document.getElementById("my-color-input").value;
    localStorage.setItem("rsl_nick", myNick);
    localStorage.setItem("rsl_color", myColor);

    if (roomState && roomState.players && roomState.players[myId]) {
        roomState.players[myId].nick = myNick;
        roomState.players[myId].color = myColor;
        await pushState();
    }
}

// =====================================================
// POŁĄCZENIE Z POKOJEM FIREBASE I PUBLICZNE LOBBY
// =====================================================
async function changeRoom() {
    const code = document.getElementById("room-code-box").value.trim().toUpperCase() || "RSL1";
    await joinRoomNow(code);
}

function copyRoomCode() {
    navigator.clipboard.writeText(currentRoom);
    alert("Skopiowano kod pokoju: " + currentRoom);
}

async function joinRoomNow(roomCode) {
    currentRoom = roomCode;
    document.getElementById("room-code-box").value = currentRoom;
    document.getElementById("center-room-label").innerText = currentRoom;

    const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
    let data = await res.json();

    if (!data) {
        data = {
            status: "lobby", // 'lobby' lub 'playing'
            hostId: myId,
            visibility: "public",
            turnIdx: 0,
            rolledThisTurn: false,
            housesThisTurn: 0,
            pot: 0,
            dice: [5, 3],
            lastLog: "Pokój gotowy! Ustaw zasady po prawej i kliknij Rozpocznij Grę.",
            settings: readSettingsFromDOM(),
            players: {},
            props: {},
            chat: []
        };
    }

    if (!data.players) data.players = {};
    const startCash = data.settings?.startCash || 1500;

    if (!data.players[myId]) {
        data.players[myId] = {
            id: myId,
            nick: myNick,
            color: myColor,
            pos: 0,
            cash: startCash,
            inJail: 0,
            doubles: 0,
            bankrupt: false,
            isBot: false,
            joinedAt: Date.now()
        };
    } else {
        data.players[myId].nick = myNick;
        data.players[myId].color = myColor;
    }

    await pushState(data);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchRoomUpdate, 1100);
}

async function fetchRoomUpdate() {
    try {
        const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
        const data = await res.json();
        if (data) {
            roomState = data;
            renderRichupScreen();
        }
    } catch (e) {}
}

async function pushState(customData = null) {
    if (customData) roomState = customData;
    if (!roomState) return;
    await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
        method: "PUT",
        body: JSON.stringify(roomState)
    });
    renderRichupScreen();
}

async function loadPublicRoomsList() {
    setInterval(async () => {
        try {
            const res = await fetch(`${FIREBASE_URL}richup_rooms.json`);
            const all = await res.json();
            const box = document.getElementById("public-rooms-list");
            if (!all) { box.innerText = "Brak pokoi"; return; }
            const pubCodes = Object.keys(all).filter(code => all[code]?.visibility !== "private");
            box.innerHTML = pubCodes.map(c => `<span class="room-pill" onclick="joinRoomNow('${c}')">${c} (${Object.keys(all[c].players||{}).length})</span>`).join('');
        } catch(e) {}
    }, 4000);
}

// =====================================================
// CZAT TEKSTOWY NA ŻYWO
// =====================================================
async function sendChatMessage() {
    const inp = document.getElementById("chat-input");
    const txt = inp.value.trim();
    if (!txt || !roomState) return;
    inp.value = "";

    if (!roomState.chat) roomState.chat = [];
    roomState.chat.push({
        nick: myNick,
        color: myColor,
        text: txt
    });
    if (roomState.chat.length > 30) roomState.chat.shift();
    await pushState();
}

// =====================================================
// USTAWIENIA GRY PO PRAWEJ STRONIE
// =====================================================
function readSettingsFromDOM() {
    return {
        mapSize: document.getElementById("rule-map-size").value,
        houseMode: document.getElementById("rule-house-mode").value,
        startCash: parseInt(document.getElementById("rule-start-cash").value) || 1500,
        doubleRent: document.getElementById("rule-double-rent").checked,
        vacationCash: document.getElementById("rule-vacation-cash").checked,
        noPrisonRent: document.getElementById("rule-no-prison-rent").checked,
        mortgage: document.getElementById("rule-mortgage").checked,
        maxDoubles: parseInt(document.getElementById("rule-max-doubles").value) || 3,
        randomOrder: document.getElementById("rule-random-order").checked
    };
}

function applySettingsToDOM(s) {
    if (!s) return;
    document.getElementById("rule-map-size").value = s.mapSize || "40";
    document.getElementById("rule-house-mode").value = s.houseMode || "stand_monopoly_3_even";
    document.getElementById("rule-start-cash").value = s.startCash || 1500;
    document.getElementById("rule-double-rent").checked = !!s.doubleRent;
    document.getElementById("rule-vacation-cash").checked = !!s.vacationCash;
    document.getElementById("rule-no-prison-rent").checked = !!s.noPrisonRent;
    document.getElementById("rule-mortgage").checked = !!s.mortgage;
    document.getElementById("rule-max-doubles").value = s.maxDoubles || 3;
    document.getElementById("rule-random-order").checked = !!s.randomOrder;
}

async function updateSettingsFromUI() {
    if (!roomState || roomState.status === "playing") return;
    roomState.visibility = document.getElementById("room-visibility").value;
    roomState.settings = readSettingsFromDOM();
    Object.values(roomState.players || {}).forEach(p => {
        p.cash = roomState.settings.startCash;
    });
    await pushState();
}

// =====================================================
// DODAWANIE BOTA, START GRY I PEŁNY RESET DO USTAWIEŃ
// =====================================================
async function addBotPlayer() {
    if (!roomState) return;
    const pArr = Object.values(roomState.players || {});
    if (pArr.length >= 10) { alert("Max 10 graczy!"); return; }
    const bId = "bot_" + Math.floor(Math.random() * 9999);
    const colors = ["#ef4444", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#14b8a6"];
    roomState.players[bId] = {
        id: bId,
        nick: "Bot_" + (pArr.length + 1),
        color: colors[pArr.length % colors.length],
        pos: 0,
        cash: roomState.settings?.startCash || 1500,
        inJail: 0,
        doubles: 0,
        bankrupt: false,
        isBot: true,
        joinedAt: Date.now()
    };
    await pushState();
}

async function hostStartGame() {
    if (!roomState) return;
    const pArr = getOrderedPlayers();
    if (pArr.length < 2) {
        alert("Dodaj przynajmniej 1 znajomego albo kliknij '+ 🤖 Bot' po prawej stronie!");
        return;
    }

    roomState.status = "playing";
    roomState.turnIdx = 0;
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.pot = 0;
    roomState.props = {};

    pArr.forEach((p, idx) => {
        p.pos = 0;
        p.cash = roomState.settings.startCash;
        p.bankrupt = false;
        p.inJail = 0;
        p.doubles = 0;
        if (roomState.settings.randomOrder) {
            p.joinedAt = Math.random() * 100000;
        }
    });

    const firstP = getActivePlayers()[0];
    roomState.lastLog = `🚀 Gra rozpoczęta! Zaczyna ${firstP.nick} – kliknij Rzuć kostką!`;
    await pushState();
}

// PRAWDZIWY RESET DO LOBBY (ODBLOKOWUJE WSZYSTKIE USTAWIENIA I POZWALA ZACZĄĆ OD NOWA!)
async function resetToLobbySettings() {
    if (!roomState) return;
    const allP = getOrderedPlayers();
    const isHost = (roomState.hostId === myId) || (allP[0]?.id === myId);
    if (!isHost) {
        alert("Tylko Host 👑 pokoju może zresetować grę do ustawień!");
        return;
    }

    roomState.status = "lobby";
    roomState.turnIdx = 0;
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.pot = 0;
    roomState.props = {};
    allP.forEach(p => {
        p.pos = 0;
        p.cash = roomState.settings.startCash;
        p.bankrupt = false;
        p.inJail = 0;
        p.doubles = 0;
    });
    roomState.lastLog = "🔄 Zresetowano do Lobby! Możesz teraz zmienić ustawienia po prawej i kliknąć Rozpocznij Grę.";
    await pushState();
}

function getOrderedPlayers() {
    return Object.values(roomState?.players || {}).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
}

function getActivePlayers() {
    return getOrderedPlayers().filter(p => !p.bankrupt);
}

function getCurrentBoard() {
    return (roomState?.settings?.mapSize === "60") ? MAP_60 : MAP_40;
}

// =====================================================
// RYSOWANIE PLANSZY 40 PÓL (11x11) LUB 60 PÓL (16x16)
// =====================================================
function getPerimeterPos(index, gridN) {
    const max = gridN - 1;
    if (index <= max) return { r: max + 1, c: max + 1 - index, side: 'bottom' };
    if (index <= max * 2) return { r: max + 1 - (index - max), c: 1, side: 'left' };
    if (index <= max * 3) return { r: 1, c: 1 + (index - max * 2), side: 'top' };
    return { r: 1 + (index - max * 3), c: max + 1, side: 'right' };
}

function renderRichupScreen() {
    if (!roomState) return;

    const allPlayers = getOrderedPlayers();
    const activePlayers = getActivePlayers();
    if (!roomState.hostId || !roomState.players[roomState.hostId]) {
        roomState.hostId = allPlayers[0]?.id;
    }

    // Synchronizuj suwaki po prawej, jeśli jesteśmy w lobby
    if (roomState.status === "lobby") {
        applySettingsToDOM(roomState.settings);
    }

    // Zablokuj edycję suwaków w trakcie gry (odblokowane po kliknięciu Reset do Ustawień)
    const isPlaying = roomState.status === "playing";
    document.getElementById("settings-lock-info").classList.toggle("hidden", !isPlaying);
    document.querySelectorAll("#settings-panel-right select, #settings-panel-right input").forEach(el => {
        el.disabled = isPlaying;
    });

    // Pokaż/ukryj przycisk Startu vs przyciski Rzutu kostką
    document.getElementById("lobby-center-controls").classList.toggle("hidden", isPlaying);
    document.getElementById("playing-center-controls").classList.toggle("hidden", !isPlaying);

    // Rysowanie planszy
    const boardData = getCurrentBoard();
    const gridN = boardData.length === 60 ? 16 : 11;
    const sideLen = gridN - 1;
    const boardEl = document.getElementById("monopoly-board");

    boardEl.style.gridTemplateColumns = `repeat(${gridN}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${gridN}, 1fr)`;

    boardEl.querySelectorAll(".m-tile").forEach(t => t.remove());

    const innerCenter = boardEl.querySelector(".board-inner-center");
    innerCenter.style.gridColumn = `2 / ${gridN}`;
    innerCenter.style.gridRow = `2 / ${gridN}`;

    const props = roomState.props || {};

    boardData.forEach((tile, idx) => {
        const pos = getPerimeterPos(idx, gridN);
        const div = document.createElement("div");
        div.className = "m-tile";
        if (idx % sideLen === 0) div.classList.add("corner");
        if (tile.type === "station") div.classList.add("airport");

        div.style.gridRow = pos.r;
        div.style.gridColumn = pos.c;

        const pState = props[idx];
        const owner = pState ? roomState.players[pState.owner] : null;
        const houses = pState ? (pState.houses || 0) : 0;
        const houseStr = houses === 5 ? "🏨" : "🏠".repeat(houses);

        const pawnsHtml = activePlayers
            .filter(p => p.pos === idx)
            .map(p => `<div class="pawn-circle" style="background:${p.color}" title="${p.nick}">${p.nick.substring(0,2).toUpperCase()}</div>`)
            .join("");

        div.innerHTML = `
            ${tile.color ? `<div class="tile-bar" style="background:${tile.color}">${houseStr}</div>` : `<div></div>`}
            ${tile.icon ? `<div class="tile-icon">${tile.icon}</div>` : ``}
            <div class="tile-title">${tile.name}</div>
            ${tile.price ? `<div class="tile-price">${tile.price}$</div>` : `<div></div>`}
            <div class="tile-owner" style="background:${owner ? owner.color : 'transparent'}"></div>
            <div class="tile-pawns">${pawnsHtml}</div>
        `;
        boardEl.appendChild(div);
    });

    // Kostki i status tury
    const dieFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const d1 = roomState.dice ? roomState.dice[0] : 5;
    const d2 = roomState.dice ? roomState.dice[1] : 3;
    document.getElementById("die-box-1").innerText = dieFaces[d1] || d1;
    document.getElementById("die-box-2").innerText = dieFaces[d2] || d2;
    document.getElementById("vacation-pot-val").innerText = (roomState.pot || 0) + "$";
    document.getElementById("action-log-box").innerText = roomState.lastLog || "";

    const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;

    if (isPlaying && currP) {
        const isMe = currP.id === myId;
        document.getElementById("turn-status-text").innerText = `Tura gracza: ${currP.nick} ${isMe ? '(TWOJA KOLEJ!)' : ''}`;
        document.getElementById("turn-status-text").style.borderColor = currP.color;

        // Przycisk Rzutu kostką i Końca tury
        const tile = boardData[currP.pos];
        const pState = props[currP.pos];

        const canBuy = isMe && roomState.rolledThisTurn && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && !pState && currP.cash >= tile.price;
        document.getElementById("btn-buy-prop").classList.toggle("hidden", !canBuy);

        const canHouse = isMe && roomState.rolledThisTurn && canBuildHouseHere(myId, currP.pos, boardData);
        document.getElementById("btn-build-house").classList.toggle("hidden", !canHouse);

        // Jeśli tura Bota
        if (currP.isBot && allPlayers[0]?.id === myId) {
            setTimeout(() => runBotTurn(currP), 950);
        }
    } else {
        document.getElementById("turn-status-text").innerText = "W Lobby – skonfiguruj grę po prawej stronie";
    }

    // Lista graczy po prawej
    document.getElementById("players-count-label").innerText = allPlayers.length;
    document.getElementById("players-list-right").innerHTML = allPlayers.map(p => `
        <div class="p-row" style="opacity:${p.bankrupt ? 0.4 : 1}">
            <div class="p-left">
                <div class="p-dot" style="background:${p.color}"></div>
                <strong>${p.nick}</strong>
                ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                ${p.bankrupt ? `<span style="color:#ef4444;font-size:11px;">BANKRUT</span>` : ``}
            </div>
            <strong>$${p.cash}</strong>
        </div>
    `).join("");

    // Renderuj moje dzielnice
    renderMyOwnedProps(boardData, currP);

    // Renderuj czat
    const chatBox = document.getElementById("chat-messages");
    const chatArr = roomState.chat || [];
    if (chatArr.length > 0) {
        chatBox.innerHTML = chatArr.map(m => `
            <div class="chat-line"><strong style="color:${m.color}">${m.nick}:</strong> ${m.text}</div>
        `).join("");
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// =====================================================
// RZUT KOSTKĄ, KUPOWANIE POLA, DOMKI I KONIEC TURY
// =====================================================
async function rollDiceNow() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    // Jeśli jeszcze nie rzucono w tej turze – pozwól rzucić
    if (roomState.rolledThisTurn) {
        alert("Już rzuciłeś kostką w tej turze! Kup pole/domek lub kliknij 'Koniec tury'.");
        return;
    }

    // Jeśli grasz sam lub to Twoja kolej, wykonaj rzut
    if (currP.id !== myId && !currP.isBot) {
        alert(`Teraz rzuca ${currP.nick}!`);
        return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    roomState.dice = [d1, d2];
    roomState.rolledThisTurn = true;
    roomState.housesThisTurn = 0;

    const boardData = getCurrentBoard();

    // Sprawdź duble z rzędu -> Więzienie
    if (d1 === d2) {
        currP.doubles = (currP.doubles || 0) + 1;
        if (currP.doubles >= (roomState.settings.maxDoubles || 3)) {
            currP.pos = boardData.findIndex(t => t.type === "jail");
            currP.inJail = 1;
            currP.doubles = 0;
            roomState.lastLog = `🚔 ${currP.nick} wyrzuca ${d1}+${d2} (limit dubli) i trafia do Więzienia!`;
            await pushState();
            return;
        }
    } else {
        currP.doubles = 0;
    }

    const oldPos = currP.pos;
    currP.pos = (currP.pos + d1 + d2) % boardData.length;

    let msg = `🎲 ${currP.nick} wyrzuca ${d1} i ${d2} (ruch o ${d1 + d2}). `;
    if (currP.pos < oldPos) {
        currP.cash += 200;
        msg += `Przejście przez START (+200$)! `;
    }

    const tile = boardData[currP.pos];
    msg += processLanding(currP, tile, currP.pos, boardData);
    roomState.lastLog = msg;

    if (currP.cash < 0) {
        await declareBankrupt(currP.id);
        return;
    }

    await pushState();
}

function processLanding(player, tile, posIdx, boardData) {
    if (!roomState.props) roomState.props = {};
    const pState = roomState.props[posIdx];

    if (tile.type === "tax") {
        player.cash -= tile.amount;
        if (roomState.settings.vacationCash) roomState.pot = (roomState.pot || 0) + tile.amount;
        return `Płaci ${tile.name} (-${tile.amount}$).`;
    }
    if (tile.type === "parking") {
        if (roomState.settings.vacationCash && roomState.pot > 0) {
            const won = roomState.pot;
            player.cash += won;
            roomState.pot = 0;
            return `Zgarnia pulę z Wakacji na Burlochu: +${won}$! 🎉`;
        }
        return `Odpoczywa na Burloch Arenie.`;
    }
    if (tile.type === "gotojail") {
        player.pos = boardData.findIndex(t => t.type === "jail");
        player.inJail = 1;
        return `Jedzie prosto do Więzienia! 🚔`;
    }
    if (tile.type === "chance" || tile.type === "chest") {
        const diff = (Math.floor(Math.random() * 5) - 2) * 50;
        player.cash += diff;
        return `${tile.name}: ${diff >= 0 ? '+' + diff : diff}$!`;
    }
    if (tile.type === "prop" || tile.type === "station" || tile.type === "utility") {
        if (pState && pState.owner !== player.id) {
            const owner = roomState.players[pState.owner];
            if (owner && !owner.bankrupt) {
                if (roomState.settings.noPrisonRent && owner.inJail > 0) {
                    return `Właściciel (${owner.nick}) siedzi w więzieniu – brak czynszu!`;
                }
                let rent = tile.rent || 50;
                const grpIndices = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
                const hasFullSet = grpIndices.every(i => roomState.props[i]?.owner === owner.id);
                if (hasFullSet && roomState.settings.doubleRent && (pState.houses || 0) === 0) {
                    rent *= 2;
                }
                rent += (pState.houses || 0) * Math.floor(tile.rent * 0.9);
                player.cash -= rent;
                owner.cash += rent;
                return `Płaci ${rent}$ czynszu dla ${owner.nick}!`;
            }
        } else if (!pState) {
            return `Staje na wolnym polu ${tile.name} (${tile.price}$).`;
        }
    }
    return `Staje na ${tile.name}.`;
}

async function buyCurrentProperty() {
    if (!roomState) return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];
    if (currP.id !== myId) return;

    const boardData = getCurrentBoard();
    const tile = boardData[currP.pos];
    if (!roomState.props) roomState.props = {};
    if (roomState.props[currP.pos] || currP.cash < tile.price) return;

    currP.cash -= tile.price;
    roomState.props[currP.pos] = { owner: myId, houses: 0 };
    roomState.lastLog = `💰 ${currP.nick} kupuje ${tile.name} za ${tile.price}$!`;
    await pushState();
}

// SPRAWDZANIE ZASAD DOMKÓW (W TYM TWOJA ZASADA: CAŁE PAŃSTWO + STOISZ NA NIM + 3 DOMKI RÓWNO PO KOLEI)
function canBuildHouseHere(playerId, targetIdx, boardData) {
    const tile = boardData[targetIdx];
    const props = roomState.props || {};
    const pState = props[targetIdx];
    const player = roomState.players[playerId];

    if (!tile || tile.type !== "prop" || !pState || pState.owner !== playerId) return false;
    if ((pState.houses || 0) >= 5 || player.cash < (tile.house || 50)) return false;

    const mode = roomState.settings?.houseMode || "stand_monopoly_3_even";
    const builtThisTurn = roomState.housesThisTurn || 0;
    const currentTile = boardData[player.pos];

    const grpIndices = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
    const hasFullState = grpIndices.every(i => props[i]?.owner === playerId);
    const minHouses = Math.min(...grpIndices.map(i => props[i]?.houses || 0));

    if (mode === "stand_monopoly_3_even") {
        if (!hasFullState) return false;
        if (!currentTile || currentTile.group !== tile.group) return false;
        if (builtThisTurn >= 3) return false;
        return (pState.houses || 0) === minHouses; // Wymusza po kolei: po 1 na każde pole z państwa!
    }
    if (mode === "stand_single_no_set") {
        return player.pos === targetIdx && builtThisTurn < 1;
    }
    if (mode === "anywhere_anytime") {
        return true;
    }
    if (mode === "classic_even") {
        return hasFullState && (pState.houses || 0) === minHouses;
    }
    return false;
}

async function buildHouseModalOrCurrent() {
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];
    await buildHouseOnIndex(currP.pos);
}

async function buildHouseOnIndex(idx) {
    const boardData = getCurrentBoard();
    if (!canBuildHouseHere(myId, idx, boardData)) {
        alert("Zgodnie z wybraną zasadą musisz budować po kolei po 1 domku na każdym polu w państwie (max 3 na turę, stojąc na tym państwie)!");
        return;
    }
    const tile = boardData[idx];
    const me = roomState.players[myId];
    me.cash -= (tile.house || 50);
    roomState.props[idx].houses = (roomState.props[idx].houses || 0) + 1;
    roomState.housesThisTurn = (roomState.housesThisTurn || 0) + 1;
    roomState.lastLog = `🏠 ${me.nick} stawia domek na ${tile.name} (${roomState.housesThisTurn}/3 w tej turze)!`;
    await pushState();
}

async function sellPropertyToBank(idx) {
    if (!roomState.settings.mortgage) return;
    const boardData = getCurrentBoard();
    const tile = boardData[idx];
    const me = roomState.players[myId];
    const refund = Math.floor(tile.price / 2);
    me.cash += refund;
    delete roomState.props[idx];
    roomState.lastLog = `🏦 ${me.nick} odsprzedaje ${tile.name} do banku za ${refund}$.`;
    await pushState();
}

function renderMyOwnedProps(boardData, currP) {
    const box = document.getElementById("my-owned-list");
    const props = roomState.props || {};
    const myIndices = Object.keys(props).filter(i => props[i].owner === myId);
    if (myIndices.length === 0) {
        box.innerHTML = "Brak zakupionych pól.";
        return;
    }
    const isMyTurn = currP && currP.id === myId && roomState.rolledThisTurn;
    box.innerHTML = myIndices.map(i => {
        const idx = parseInt(i);
        const t = boardData[idx];
        const h = props[idx].houses || 0;
        const canB = isMyTurn && canBuildHouseHere(myId, idx, boardData);
        return `
            <div class="owned-item">
                <span><strong style="color:${t.color || '#38bdf8'}">■</strong> ${t.name} ${"🏠".repeat(h)}</span>
                <div>
                    ${canB ? `<button class="btn-dark-sm" style="background:#d97706" onclick="buildHouseOnIndex(${idx})">+🏠 (${t.house}$)</button>` : ``}
                    ${roomState.settings?.mortgage ? `<button class="btn-dark-sm" onclick="sellPropertyToBank(${idx})">Sprzedaj (+${Math.floor(t.price/2)}$)</button>` : ``}
                </div>
            </div>
        `;
    }).join("");
}

async function nextTurnNow() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    if (!roomState.rolledThisTurn) {
        alert("Najpierw rzuć kostką!");
        return;
    }
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;
    const nextP = activePlayers[roomState.turnIdx % activePlayers.length];
    roomState.lastLog = `⏭️ Koniec tury! Teraz rzuca ${nextP.nick}.`;
    await pushState();
}

async function surrenderNow() {
    if (!roomState || !roomState.players[myId]) return;
    if (!confirm("Na pewno chcesz ogłosić bankructwo i poddać grę?")) return;
    await declareBankrupt(myId);
}

async function declareBankrupt(pid) {
    const p = roomState.players[pid];
    if (!p) return;
    p.bankrupt = true;
    p.cash = 0;
    Object.keys(roomState.props || {}).forEach(k => {
        if (roomState.props[k].owner === pid) delete roomState.props[k];
    });
    const rem = getActivePlayers();
    if (rem.length === 1) {
        roomState.lastLog = `🏆 KONIEC GRY! Wygrywa ${rem[0].nick}! Kliknij Reset do Ustawień, aby zagrać ponownie.`;
    } else {
        roomState.rolledThisTurn = false;
        roomState.turnIdx = roomState.turnIdx % Math.max(1, rem.length);
        roomState.lastLog = `🏳️ ${p.nick} bankrutuje i odpada z gry!`;
    }
    await pushState();
}

async function runBotTurn(bot) {
    const boardData = getCurrentBoard();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    roomState.dice = [d1, d2];
    const old = bot.pos;
    bot.pos = (bot.pos + d1 + d2) % boardData.length;
    if (bot.pos < old) bot.cash += 200;

    const tile = boardData[bot.pos];
    let log = `🤖 ${bot.nick} rzuca ${d1}+${d2}. ` + processLanding(bot, tile, bot.pos, boardData);

    if (!roomState.props) roomState.props = {};
    if ((tile.type === "prop" || tile.type === "station") && !roomState.props[bot.pos] && bot.cash >= tile.price + 100) {
        bot.cash -= tile.price;
        roomState.props[bot.pos] = { owner: bot.id, houses: 0 };
        log += ` Kupuje ${tile.name}!`;
    }
    roomState.lastLog = log;
    roomState.rolledThisTurn = false;
    const activePlayers = getActivePlayers();
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;
    await pushState();
}

// =====================================================
// POZOSTAŁE GRY: CHIŃCZYK, LIAR'S TABLE, WARCABY/SZACHY, TETRIS, KASYNO
// =====================================================
const L_PATH = [[4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],[4,6],[4,7],[4,8],[4,9],[4,10],[5,10],[6,10],[6,9],[6,8],[6,7],[6,6],[7,6],[8,6],[9,6],[10,6],[10,5],[10,4],[9,4],[8,4],[7,4],[6,4],[6,3],[6,2],[6,1],[6,0],[5,0]];
const L_BASES = [[[0,0],[0,1],[1,0],[1,1]], [[0,9],[0,10],[1,9],[1,10]], [[9,9],[9,10],[10,9],[10,10]], [[9,0],[9,1],[10,0],[10,1]]];
const L_COLS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
let ludoState = { turn: 0, die: 6, pawns: [[-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1]] };

function initLudoLocal() { renderLudoLocal(); }
function ludoReset() { ludoState = { turn: 0, die: 6, pawns: [[-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1]] }; renderLudoLocal(); }
function ludoRoll() {
    ludoState.die = Math.floor(Math.random() * 6) + 1;
    document.getElementById("ludo-die-box").innerText = ludoState.die;
    document.getElementById("ludo-log-box").innerText = `Gracz ${ludoState.turn + 1} wyrzucił ${ludoState.die}! Kliknij swój pionek.`;
    renderLudoLocal();
}
function renderLudoLocal() {
    const g = document.getElementById("ludo-grid");
    if (!g) return;
    g.innerHTML = "";
    const map = {};
    for (let r=0; r<11; r++) for (let c=0; c<11; c++) {
        const d = document.createElement("div"); d.className = "ludo-c empty"; g.appendChild(d); map[`${r}_${c}`] = d;
    }
    L_PATH.forEach(([r,c]) => map[`${r}_${c}`].classList.remove("empty"));
    L_BASES.forEach((b, i) => b.forEach(([r,c]) => { map[`${r}_${c}`].classList.remove("empty"); map[`${r}_${c}`].style.border = `2px solid ${L_COLS[i]}`; }));
    ludoState.pawns.forEach((arr, pIdx) => {
        arr.forEach((st, pwIdx) => {
            const [r, c] = st === -1 ? L_BASES[pIdx][pwIdx] : L_PATH[(st + pIdx * 10) % 40];
            const p = document.createElement("div"); p.className = "pawn-circle"; p.style.background = L_COLS[pIdx]; p.style.cursor = "pointer";
            p.onclick = () => {
                if (st === -1 && (ludoState.die === 1 || ludoState.die === 6)) ludoState.pawns[pIdx][pwIdx] = 0;
                else if (st >= 0) ludoState.pawns[pIdx][pwIdx] = (st + ludoState.die) % 40;
                ludoState.turn = (ludoState.turn + 1) % 4;
                document.getElementById("ludo-turn-text").innerText = `Tura: Kolor #${ludoState.turn + 1}`;
                renderLudoLocal();
            };
            map[`${r}_${c}`].appendChild(p);
        });
    });
}

// LIAR'S TABLE
let liarDeckTarget = "A", liarHand = [], liarSelected = [], liarLastCards = [], liarPile = 0;
function liarInit() {
    const figs = ["A", "K", "Q"];
    liarDeckTarget = figs[Math.floor(Math.random() * 3)];
    liarHand = ["A", "K", "Q", "A", "JOKER"].sort(() => Math.random() - 0.5);
    liarSelected = []; liarPile = 0; liarLastCards = [];
    renderLiarUI("Nowe rozdanie! Wybierz karty i połóż na stół.");
}
function renderLiarUI(msg) {
    document.getElementById("liar-target").innerText = liarDeckTarget;
    document.getElementById("liar-pile").innerText = liarPile;
    if (msg) document.getElementById("liar-status").innerText = msg;
    const h = document.getElementById("liar-hand");
    h.innerHTML = "";
    liarHand.forEach((c, idx) => {
        const d = document.createElement("div");
        d.className = "card-box" + (liarSelected.includes(idx) ? " sel" : "");
        d.innerText = c;
        d.onclick = () => {
            if (liarSelected.includes(idx)) liarSelected = liarSelected.filter(i => i !== idx);
            else liarSelected.push(idx);
            renderLiarUI();
        };
        h.appendChild(d);
    });
}
function liarPlayCards() {
    if (liarSelected.length === 0) return;
    liarSelected.sort((a,b) => b-a);
    liarLastCards = liarSelected.map(i => liarHand.splice(i, 1)[0]);
    liarPile += liarLastCards.length;
    liarSelected = [];
    // Ruch Bota po Tobie
    const botCards = [["A"], ["K"], ["Q"]][Math.floor(Math.random()*3)];
    liarLastCards = botCards;
    liarPile += 1;
    renderLiarUI(`Położyłeś karty! Bot dokłada 1 zakrytą kartę jako ${liarDeckTarget} – sprawdzasz go?`);
}
function liarCallBluff() {
    if (liarLastCards.length === 0) return;
    const lied = liarLastCards.some(c => c !== liarDeckTarget && c !== "JOKER");
    const bang = Math.random() < 0.35;
    renderLiarUI(lied ? `🚨 KŁAMAŁ! Karta na stole to [${liarLastCards.join()}]. ${bang ? '💥 BANG! Przeciwnik odpada!' : '🔫 Pusty bębenek!'}` : `❌ MÓWIŁ PRAWDĘ! Karta to [${liarLastCards.join()}]. Ty pociągasz za spust!`);
    liarLastCards = [];
}

// WARCABY I SZACHY 8x8
let b8Mode = "checkers", b8Grid = [], b8Turn = "w", b8Sel = null;
const C_SYM = { wP:'♙',wR:'♖',wN:'♘',wB:'♗',wQ:'♕',wK:'♔', bP:'♟',bR:'♜',bN:'♞',bB:'♝',bQ:'♛',bK:'♚' };
function init8x8(m) {
    b8Mode = m; b8Turn = "w"; b8Sel = null;
    b8Grid = Array(8).fill(0).map(() => Array(8).fill(""));
    if (m === "checkers") {
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) if ((r+c)%2===1) { if (r<3) b8Grid[r][c]="b"; if (r>4) b8Grid[r][c]="w"; }
    } else {
        b8Grid[0]=['bR','bN','bB','bQ','bK','bB','bN','bR']; b8Grid[1]=Array(8).fill('bP');
        b8Grid[6]=Array(8).fill('wP'); b8Grid[7]=['wR','wN','wB','wQ','wK','wB','wN','wR'];
    }
    render8x8();
}
function render8x8() {
    const b = document.getElementById("chess-board"); if (!b) return;
    b.innerHTML = "";
    document.getElementById("b8-turn").innerText = `Tura: ${b8Turn === 'w' ? 'Białe' : 'Czarne'}`;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
        const d = document.createElement("div");
        d.className = "c-sq " + ((r+c)%2===0 ? "c-light" : "c-dark") + (b8Sel?.r===r && b8Sel?.c===c ? " sel" : "");
        const v = b8Grid[r][c];
        if (v) d.innerText = b8Mode === "checkers" ? (v==='w'?'⚪':'⚫') : C_SYM[v];
        d.onclick = () => {
            if (v && v.startsWith(b8Turn)) { b8Sel = {r,c}; render8x8(); }
            else if (b8Sel) {
                b8Grid[r][c] = b8Grid[b8Sel.r][b8Sel.c];
                b8Grid[b8Sel.r][b8Sel.c] = "";
                if (b8Mode === "checkers" && Math.abs(r - b8Sel.r) === 2) {
                    b8Grid[(r+b8Sel.r)/2][(c+b8Sel.c)/2] = "";
                }
                b8Sel = null; b8Turn = b8Turn === 'w' ? 'b' : 'w'; render8x8();
            }
        };
        b.appendChild(d);
    }
}

// TETRIS
let tTimer = null, tGrid = [], tCur = null, tScore = 0;
const T_SHAPES = [[[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,0,0],[1,1,1]], [[0,1,1],[1,1,0]]];
function startTetris() {
    tGrid = Array(20).fill(0).map(() => Array(10).fill(0));
    tScore = 0; document.getElementById("tetris-pts").innerText = 0;
    spawnT();
    if (tTimer) clearInterval(tTimer);
    tTimer = setInterval(stepT, 400);
}
function spawnT() {
    tCur = { s: T_SHAPES[Math.floor(Math.random()*T_SHAPES.length)], r: 0, c: 3 };
}
function colT(dr, dc, s) {
    for (let r=0;r<s.length;r++) for (let c=0;c<s[r].length;c++) if (s[r][c]) {
        const nr = tCur.r+r+dr, nc = tCur.c+c+dc;
        if (nr<0 || nr>=20 || nc<0 || nc>=10 || tGrid[nr][nc]) return true;
    }
    return false;
}
function stepT() {
    if (!colT(1,0,tCur.s)) tCur.r++;
    else {
        tCur.s.forEach((row,r) => row.forEach((v,c) => { if (v) tGrid[tCur.r+r][tCur.c+c] = "#a855f7"; }));
        for (let r=19;r>=0;r--) if (tGrid[r].every(x => x!==0)) { tGrid.splice(r,1); tGrid.unshift(Array(10).fill(0)); tScore += 100; r++; }
        document.getElementById("tetris-pts").innerText = tScore;
        spawnT();
        if (colT(0,0,tCur.s)) { clearInterval(tTimer); alert("Koniec gry! Punkty: " + tScore); }
    }
    drawT();
}
function drawT() {
    const cv = document.getElementById("tetris-canvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#0f172a"; ctx.fillRect(0,0,300,600);
    for (let r=0;r<20;r++) for (let c=0;c<10;c++) if (tGrid[r][c]) { ctx.fillStyle = tGrid[r][c]; ctx.fillRect(c*30,r*30,29,29); }
    if (tCur) { ctx.fillStyle = "#38bdf8"; tCur.s.forEach((row,r) => row.forEach((v,c) => { if (v) ctx.fillRect((tCur.c+c)*30,(tCur.r+r)*30,29,29); })); }
}
window.addEventListener("keydown", e => {
    if (!tCur || !document.getElementById("tetris-view").classList.contains("active")) return;
    if (e.key==="ArrowLeft" && !colT(0,-1,tCur.s)) tCur.c--;
    if (e.key==="ArrowRight" && !colT(0,1,tCur.s)) tCur.c++;
    if (e.key==="ArrowDown" && !colT(1,0,tCur.s)) tCur.r++;
    if (e.key==="ArrowUp") {
        const rot = tCur.s[0].map((_,i) => tCur.s.map(r => r[i]).reverse());
        if (!colT(0,0,rot)) tCur.s = rot;
    }
    drawT();
});

// KASYNO (OSOBNY PORTFEL)
function saveCasinoCash() {
    localStorage.setItem("rsl_casino_cash", casinoBalance);
    document.getElementById("casino-wallet-top").innerText = casinoBalance;
}
function casinoSpinSlots() {
    const bet = parseInt(document.getElementById("slot-bet-val").value) || 10;
    if (bet > casinoBalance || bet <= 0) { alert("Brak żetonów w Kasynie!"); return; }
    casinoBalance -= bet;
    const syms = ["🍒", "🍋", "🔔", "💎", "7️⃣"];
    const s1 = syms[Math.floor(Math.random()*5)], s2 = syms[Math.floor(Math.random()*5)], s3 = syms[Math.floor(Math.random()*5)];
    document.getElementById("slot-1").innerText = s1;
    document.getElementById("slot-2").innerText = s2;
    document.getElementById("slot-3").innerText = s3;
    if (s1===s2 && s2===s3) { casinoBalance += bet*10; document.getElementById("slot-result-msg").innerText = `🔥 JACKPOT! +${bet*10}$!`; }
    else if (s1===s2 || s2===s3 || s1===s3) { casinoBalance += bet*2; document.getElementById("slot-result-msg").innerText = `✨ Para! +${bet*2}$!`; }
    else document.getElementById("slot-result-msg").innerText = "Pudło!";
    saveCasinoCash();
}
function casinoRoulette(col) {
    const bet = parseInt(document.getElementById("roulette-bet-val").value) || 10;
    if (bet > casinoBalance || bet <= 0) { alert("Brak żetonów w Kasynie!"); return; }
    casinoBalance -= bet;
    const n = Math.floor(Math.random()*37);
    const res = n===0 ? 'green' : (n%2===0 ? 'black' : 'red');
    const el = document.getElementById("roulette-num");
    el.innerText = n;
    el.style.background = res==='green' ? '#16a34a' : (res==='red' ? '#dc2626' : '#1e293b');
    if (col === res) {
        const win = bet * (col==='green' ? 14 : 2);
        casinoBalance += win;
        document.getElementById("roulette-result-msg").innerText = `🎉 Trafiony (${n})! Wygrywasz +${win}$!`;
    } else {
        document.getElementById("roulette-result-msg").innerText = `❌ Wypadło ${n}. Przegrywasz ${bet}$.`;
    }
    saveCasinoCash();
}

// =====================================================
// AKTUALIZACJA ONLINE: CHIŃCZYK (LUDO) + LIAR'S TABLE W FIREBASE
// Wklej na sam dół pliku script.js!
// =====================================================

// Domki końcowe po przejściu całej mapy (4 kolorowe ścieżki do środka planszy!)
const LUDO_HOMES_COORDS = [
    [[5,1],[5,2],[5,3],[5,4]], // 0: Czerwony (wchodzi od lewej do środka)
    [[1,5],[2,5],[3,5],[4,5]], // 1: Niebieski (wchodzi od góry do środka)
    [[5,9],[5,8],[5,7],[5,6]], // 2: Żółty (wchodzi od prawej do środka)
    [[9,5],[8,5],[7,5],[6,5]]  // 3: Zielony (wchodzi od dołu do środka)
];
const LUDO_COLOR_NAMES = ["Czerwony 🔴", "Niebieski 🔵", "Żółty 🟡", "Zielony 🟢"];

// Rozszerzamy odświeżanie pokoju, żeby automatycznie rysowało też Chińczyka i Liar's Table Online!
const origRenderRichup = renderRichupScreen;
renderRichupScreen = function() {
    origRenderRichup();
    if (!roomState) return;
    renderLudoOnline();
    renderLiarOnline();
};

function isMeRoomHost() {
    if (!roomState) return false;
    const allP = getOrderedPlayers();
    return (roomState.hostId === myId) || (allP[0]?.id === myId);
}

// =====================================================
// CHIŃCZYK (LUDO) - 100% ONLINE Z FIREBASE
// =====================================================
function ensureLudoState() {
    const players4 = getOrderedPlayers().slice(0, 4);
    if (!roomState.ludoOnline) {
        const pawnsObj = {};
        players4.forEach(p => { pawnsObj[p.id] = [-1, -1, -1, -1]; });
        roomState.ludoOnline = {
            turnIdx: 0,
            die: 6,
            rolled: false,
            pawns: pawnsObj,
            log: "Gra gotowa! Rzuć kostką (6 lub 1 wyprowadza pionka z bazy)."
        };
    } else {
        if (!roomState.ludoOnline.pawns) roomState.ludoOnline.pawns = {};
        players4.forEach(p => {
            if (!roomState.ludoOnline.pawns[p.id]) {
                roomState.ludoOnline.pawns[p.id] = [-1, -1, -1, -1];
            }
        });
    }
}

async function hostResetLudoOnline() {
    if (!isMeRoomHost()) {
        alert("Tylko Host 👑 pokoju może zresetować grę w Chińczyka!");
        return;
    }
    const players4 = getOrderedPlayers().slice(0, 4);
    const pawnsObj = {};
    players4.forEach(p => { pawnsObj[p.id] = [-1, -1, -1, -1]; });

    roomState.ludoOnline = {
        turnIdx: 0,
        die: 6,
        rolled: false,
        pawns: pawnsObj,
        log: `🔄 Host (${myNick}) zresetował Chińczyka! Zaczyna ${players4[0]?.nick || 'Gracz 1'}.`
    };
    await pushState();
}

function canLudoPawnMove(step, die, currentPawnsArr, pawnIdx) {
    if (step === -1) {
        // Z bazy wychodzimy na 6 lub 1
        return die === 6 || die === 1;
    }
    const targetStep = step + die;
    if (targetStep > 43) return false; // Nie można wyskoczyć poza 4. pole domku końcowego (40, 41, 42, 43)
    // Nie można wejść na to samo pole w domku końcowym, na którym stoi już nasz własny pionek
    if (targetStep >= 40 && currentPawnsArr.some((s, i) => i !== pawnIdx && s === targetStep)) {
        return false;
    }
    return true;
}

async function ludoRollOnline() {
    if (!roomState) return;
    ensureLudoState();
    const ludo = roomState.ludoOnline;
    const players4 = getOrderedPlayers().slice(0, 4);
    if (players4.length === 0) return;

    const currP = players4[ludo.turnIdx % players4.length];
    if (currP.id !== myId && !currP.isBot) {
        alert(`Teraz kolej gracza ${currP.nick}!`);
        return;
    }
    if (ludo.rolled) {
        alert("Już rzuciłeś kostką! Kliknij na podświetlony na złoto pionek.");
        return;
    }

    const die = Math.floor(Math.random() * 6) + 1;
    ludo.die = die;
    ludo.rolled = true;

    const myPawns = ludo.pawns[currP.id] || [-1, -1, -1, -1];
    const anyMovable = myPawns.some((st, idx) => canLudoPawnMove(st, die, myPawns, idx));

    if (!anyMovable) {
        ludo.log = `🎲 ${currP.nick} wyrzuca ${die} – brak możliwego ruchu! Kolej przechodzi dalej.`;
        ludo.rolled = false;
        ludo.turnIdx = (ludo.turnIdx + 1) % players4.length;
    } else {
        ludo.log = `🎲 ${currP.nick} wyrzuca ${die}! Kliknij na PULSUJĄCY PIONEK, aby się ruszyć!`;
    }

    await pushState();
}

async function ludoClickPawnOnline(playerIdx, pawnIdx) {
    if (!roomState || !roomState.ludoOnline) return;
    const ludo = roomState.ludoOnline;
    const players4 = getOrderedPlayers().slice(0, 4);
    const activeIdx = ludo.turnIdx % players4.length;
    const currP = players4[activeIdx];

    if (currP.id !== myId || activeIdx !== playerIdx || !ludo.rolled) return;

    const myPawns = ludo.pawns[currP.id];
    const step = myPawns[pawnIdx];
    const die = ludo.die;

    if (!canLudoPawnMove(step, die, myPawns, pawnIdx)) return;

    if (step === -1) {
        myPawns[pawnIdx] = 0; // Wyjście z bazy na swoje kolorowe pole startowe
        ludo.log = `🚀 ${currP.nick} wyprowadza pionka z bazy na pole startowe!`;
    } else {
        myPawns[pawnIdx] += die;
        if (myPawns[pawnIdx] >= 40) {
            ludo.log = `🏠 ${currP.nick} wchodzi pionkiem do swojego kolorowego domku mety!`;
        } else {
            ludo.log = `🏃 ${currP.nick} przesuwa pionek o ${die} pól.`;
        }
    }

    // Sprawdź bicie pionków przeciwnika (tylko na głównej ścieżce 0..39)
    const newStep = myPawns[pawnIdx];
    if (newStep >= 0 && newStep < 40) {
        const myGlobalPos = (newStep + playerIdx * 10) % 40;
        players4.forEach((otherP, oIdx) => {
            if (otherP.id !== currP.id) {
                const oPawns = ludo.pawns[otherP.id] || [-1,-1,-1,-1];
                oPawns.forEach((oStep, oPwIdx) => {
                    if (oStep >= 0 && oStep < 40) {
                        const oGlobalPos = (oStep + oIdx * 10) % 40;
                        if (oGlobalPos === myGlobalPos) {
                            oPawns[oPwIdx] = -1; // Zbity wraca do bazy!
                            ludo.log += ` 💥 ZBITO pionek gracza ${otherP.nick} do bazy!`;
                        }
                    }
                });
            }
        });
    }

    // Sprawdź czy gracz wprowadził wszystkie 4 pionki na kolorowe pola mety (>= 40)
    if (myPawns.every(s => s >= 40)) {
        ludo.log = `🏆 KONIEC GRY! ${currP.nick} wprowadził wszystkie 4 pionki do domku i WYGRYWA! 🎉`;
        ludo.rolled = false;
        await pushState();
        return;
    }

    ludo.rolled = false;
    // Wyrzucenie 6 daje dodatkowy rzut kostką!
    if (die === 6) {
        ludo.log += ` (Wyrzucono 6 ➡️ DODATKOWY RZUT!)`;
    } else {
        ludo.turnIdx = (ludo.turnIdx + 1) % players4.length;
    }

    await pushState();
}

function renderLudoOnline() {
    const gridEl = document.getElementById("ludo-grid");
    if (!gridEl || !roomState) return;
    ensureLudoState();

    const ludo = roomState.ludoOnline;
    const players4 = getOrderedPlayers().slice(0, 4);
    const activeIdx = players4.length > 0 ? (ludo.turnIdx % players4.length) : 0;
    const currP = players4[activeIdx];

    document.getElementById("ludo-room-code").innerText = currentRoom;

    // Przycisk Resetu widoczny tylko dla Hosta
    const resetBtn = document.getElementById("btn-ludo-reset-host");
    if (resetBtn) resetBtn.classList.toggle("hidden", !isMeRoomHost());

    // Lista graczy w Lobby Chińczyka (lewy panel)
    const pListEl = document.getElementById("ludo-players-online");
    if (pListEl) {
        pListEl.innerHTML = players4.map((p, idx) => {
            const pPawns = ludo.pawns[p.id] || [-1,-1,-1,-1];
            const inHome = pPawns.filter(s => s >= 40).length;
            return `
                <div class="p-row" style="border-left: 5px solid ${L_COLS[idx]}">
                    <div class="p-left">
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                        ${idx === activeIdx ? `<span style="color:#fde047;font-size:11px;">🎲 TURA</span>` : ``}
                    </div>
                    <span style="font-size:12px;">W domku: <strong>${inHome}/4</strong></span>
                </div>
            `;
        }).join("");
    }

    // Status tury i kostka
    const dieFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    document.getElementById("ludo-die-box").innerText = dieFaces[ludo.die] || ludo.die;
    document.getElementById("ludo-log-box").innerText = ludo.log || "";

    if (currP) {
        const isMe = currP.id === myId;
        document.getElementById("ludo-turn-text").innerText = `Tura: ${currP.nick} (${LUDO_COLOR_NAMES[activeIdx]}) ${isMe ? '- TY!' : ''}`;
        document.getElementById("ludo-turn-text").style.borderColor = L_COLS[activeIdx];
    }

    // Rysowanie siatki 11x11
    gridEl.innerHTML = "";
    const cellMap = {};
    for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
            const d = document.createElement("div");
            d.className = "ludo-c empty";
            gridEl.appendChild(d);
            cellMap[`${r}_${c}`] = d;
        }
    }

    // Ścieżka główna 40 pól + pola startowe kolorów
    L_PATH.forEach(([r, c], idx) => {
        const cell = cellMap[`${r}_${c}`];
        cell.classList.remove("empty");
        if (idx === 0) { cell.classList.add("ludo-start-0"); cell.innerText = "START"; }
        if (idx === 10) { cell.classList.add("ludo-start-1"); cell.innerText = "START"; }
        if (idx === 20) { cell.classList.add("ludo-start-2"); cell.innerText = "START"; }
        if (idx === 30) { cell.classList.add("ludo-start-3"); cell.innerText = "START"; }
    });

    // 4 Bazy w narożnikach i 4 KOLOROWE ŚCIEŻKI METY (Czerwona, Niebieska, Żółta, Zielona)
    for (let i = 0; i < 4; i++) {
        L_BASES[i].forEach(([r, c]) => {
            const cell = cellMap[`${r}_${c}`];
            cell.classList.remove("empty");
            cell.style.background = L_COLS[i] + "28";
            cell.style.border = `2px solid ${L_COLS[i]}`;
        });
        LUDO_HOMES_COORDS[i].forEach(([r, c], hIdx) => {
            const cell = cellMap[`${r}_${c}`];
            cell.classList.remove("empty");
            cell.classList.add(`ludo-home-${i}`);
            cell.innerText = hIdx === 3 ? "🏠" : "★";
        });
    }

    // Środek planszy
    cellMap["5_5"].classList.remove("empty");
    cellMap["5_5"].style.background = "#2e2942";
    cellMap["5_5"].innerText = "🏆";

    // Rysowanie pionków graczy (z podświetlaniem tych, które mogą wyjść z bazy lub ruszyć się!)
    players4.forEach((p, pIdx) => {
        const pPawns = ludo.pawns[p.id] || [-1, -1, -1, -1];
        const col = L_COLS[pIdx];

        pPawns.forEach((step, pwIdx) => {
            let r, c;
            if (step === -1) {
                [r, c] = L_BASES[pIdx][pwIdx];
            } else if (step >= 40) {
                const hIdx = Math.min(step - 40, 3);
                [r, c] = LUDO_HOMES_COORDS[pIdx][hIdx];
            } else {
                const globalPos = (step + pIdx * 10) % 40;
                [r, c] = L_PATH[globalPos];
            }

            const pawn = document.createElement("div");
            pawn.className = "pawn-circle";
            pawn.style.background = col;
            pawn.style.pointerEvents = "auto";
            pawn.title = `${p.nick} (Pionek #${pwIdx + 1})`;
            pawn.innerText = pwIdx + 1;

            // Czy ten pionek należy do mnie i może wykonać ruch po rzucie?
            const isMyTurnAndRolled = currP && currP.id === myId && p.id === myId && ludo.rolled;
            if (isMyTurnAndRolled && canLudoPawnMove(step, ludo.die, pPawns, pwIdx)) {
                pawn.classList.add("pawn-movable");
                pawn.onclick = (e) => {
                    e.stopPropagation();
                    ludoClickPawnOnline(pIdx, pwIdx);
                };
            }

            cellMap[`${r}_${c}`].appendChild(pawn);
        });
    });

    // Automatyczny ruch Bota w Chińczyku
    if (currP && currP.isBot && isMeRoomHost() && document.getElementById("ludo-view").classList.contains("active")) {
        setTimeout(() => runLudoBotOnline(currP, activeIdx, players4), 950);
    }
}

async function runLudoBotOnline(bot, botIdx, players4) {
    const ludo = roomState.ludoOnline;
    const die = Math.floor(Math.random() * 6) + 1;
    ludo.die = die;
    const bPawns = ludo.pawns[bot.id] || [-1,-1,-1,-1];

    // Priorytet: wyjście z bazy na 6 lub 1, potem ruch najdalszym pionkiem
    let chosenIdx = bPawns.findIndex((st, idx) => st === -1 && canLudoPawnMove(st, die, bPawns, idx));
    if (chosenIdx === -1) {
        chosenIdx = bPawns.findIndex((st, idx) => canLudoPawnMove(st, die, bPawns, idx));
    }

    if (chosenIdx !== -1) {
        if (bPawns[chosenIdx] === -1) bPawns[chosenIdx] = 0;
        else bPawns[chosenIdx] += die;
        ludo.log = `🤖 ${bot.nick} wyrzuca ${die} i przesuwa pionek #${chosenIdx + 1}.`;
    } else {
        ludo.log = `🤖 ${bot.nick} wyrzuca ${die} – brak ruchu.`;
    }

    ludo.rolled = false;
    if (die !== 6 || chosenIdx === -1) {
        ludo.turnIdx = (ludo.turnIdx + 1) % players4.length;
    }
    await pushState();
}

// =====================================================
// LIAR'S TABLE (BLEF KARCIANY) - 100% ONLINE Z FIREBASE
// =====================================================
let mySelectedLiarCards = [];

function createFreshLiarRound(alivePlayers, existingShots = {}) {
    const targets = ["A", "K", "Q"];
    const target = targets[Math.floor(Math.random() * targets.length)];

    // Talia 20 kart: 6x As, 6x Król, 6x Dama, 2x Joker
    const deck = ["A","A","A","A","A","A", "K","K","K","K","K","K", "Q","Q","Q","Q","Q","Q", "JOKER","JOKER"];
    deck.sort(() => Math.random() - 0.5);

    const hands = {};
    const shots = { ...existingShots };
    alivePlayers.forEach(p => {
        hands[p.id] = deck.splice(0, 5);
        if (shots[p.id] === undefined) shots[p.id] = 0;
    });

    return {
        target: target,
        turnIdx: 0,
        pileCount: 0,
        lastPlay: null, // { pid, nick, cards: [...] }
        hands: hands,
        shots: shots,
        dead: roomState.liarOnline?.dead || {},
        log: `🃏 Nowe rozdanie! Wymaganą figurą przy stole jest ${target}.`
    };
}

async function hostResetLiarOnline() {
    if (!isMeRoomHost()) {
        alert("Tylko Host 👑 pokoju może zresetować stół w Liar's Table!");
        return;
    }
    const allP = getOrderedPlayers();
    if (allP.length < 2) {
        alert("Dodaj przynajmniej 1 znajomego lub Bota przyciskiem '+ 🤖 Dodaj Bota'!");
        return;
    }
    if (roomState.liarOnline) roomState.liarOnline.dead = {};
    roomState.liarOnline = createFreshLiarRound(allP, {});
    roomState.liarOnline.dead = {};
    mySelectedLiarCards = [];
    await pushState();
}

function getAliveLiarPlayers() {
    const deadMap = roomState?.liarOnline?.dead || {};
    return getOrderedPlayers().filter(p => !deadMap[p.id]);
}

function renderLiarOnline() {
    const handEl = document.getElementById("liar-hand");
    if (!handEl || !roomState) return;

    document.getElementById("liar-room-code").innerText = currentRoom;
    const resetBtn = document.getElementById("btn-liar-reset-host");
    if (resetBtn) resetBtn.classList.toggle("hidden", !isMeRoomHost());

    if (!roomState.liarOnline) {
        const allP = getOrderedPlayers();
        roomState.liarOnline = createFreshLiarRound(allP, {});
    }

    const liar = roomState.liarOnline;
    const allP = getOrderedPlayers();
    const aliveP = getAliveLiarPlayers();
    const currP = aliveP.length > 0 ? aliveP[liar.turnIdx % aliveP.length] : null;

    // Lista graczy przy stole (lewa kolumna)
    const pBox = document.getElementById("liar-players-online");
    if (pBox) {
        pBox.innerHTML = allP.map(p => {
            const isDead = liar.dead && liar.dead[p.id];
            const cardCnt = (liar.hands && liar.hands[p.id]) ? liar.hands[p.id].length : 0;
            const shotCnt = (liar.shots && liar.shots[p.id]) ? liar.shots[p.id] : 0;
            const isTurn = currP && currP.id === p.id && !isDead;
            return `
                <div class="p-row" style="opacity:${isDead ? 0.4 : 1}; border-left: 4px solid ${p.color}">
                    <div class="p-left">
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑</span>` : ``}
                        ${isTurn ? `<span style="color:#fde047;font-size:11px;">🃏 TURA</span>` : ``}
                        ${isDead ? `<span style="color:#ef4444;font-size:11px;">💀 ODPADŁ</span>` : ``}
                    </div>
                    <span style="font-size:12px;">🃏 ${cardCnt} | 🔫 ${shotCnt}/6</span>
                </div>
            `;
        }).join("");
    }

    document.getElementById("liar-target").innerText = liar.target;
    document.getElementById("liar-pile").innerText = liar.pileCount || 0;
    document.getElementById("liar-status").innerText = liar.log || "";

    if (currP) {
        const isMe = currP.id === myId;
        document.getElementById("liar-turn-banner").innerText = `Tura gracza: ${currP.nick} ${isMe ? '(TWOJA KOLEJ!)' : ''}`;
        document.getElementById("liar-turn-banner").style.borderColor = currP.color;
    }

    if (liar.lastPlay) {
        document.getElementById("liar-last-play-info").innerText =
            `👉 ${liar.lastPlay.nick} położył(a) ${liar.lastPlay.cards.length} zakrytą kartę/karty jako ${liar.target}!`;
    } else {
        document.getElementById("liar-last-play-info").innerText =
            `Stół jest pusty – wyłóż od 1 do 3 kart jako ${liar.target}.`;
    }

    // Rysowanie moich prywatnych kart
    const myCards = (liar.hands && liar.hands[myId]) ? liar.hands[myId] : [];
    handEl.innerHTML = "";
    myCards.forEach((c, idx) => {
        const d = document.createElement("div");
        d.className = "card-box" + (mySelectedLiarCards.includes(idx) ? " sel" : "");
        d.style.color = (c === "A" || c === "Q") ? "#dc2626" : "#0f172a";
        d.innerText = c;
        d.onclick = () => {
            if (mySelectedLiarCards.includes(idx)) {
                mySelectedLiarCards = mySelectedLiarCards.filter(i => i !== idx);
            } else if (mySelectedLiarCards.length < 3) {
                mySelectedLiarCards.push(idx);
            }
            renderLiarOnline();
        };
        handEl.appendChild(d);
    });

    // Ruch Bota w Liar's Table
    if (currP && currP.isBot && isMeRoomHost() && document.getElementById("liar-view").classList.contains("active")) {
        setTimeout(() => runLiarBotOnline(currP, aliveP), 1100);
    }
}

async function liarPlayCardsOnline() {
    if (!roomState || !roomState.liarOnline) return;
    const liar = roomState.liarOnline;
    const aliveP = getAliveLiarPlayers();
    const currP = aliveP[liar.turnIdx % aliveP.length];

    if (!currP || currP.id !== myId) {
        alert("Poczekaj na swoją turę!");
        return;
    }
    if (mySelectedLiarCards.length === 0) {
        alert("Kliknij na 1 do 3 kart ze swojej ręki, aby położyć je na stół!");
        return;
    }

    if (!liar.hands) liar.hands = {};
    const myHand = liar.hands[myId] || [];
    mySelectedLiarCards.sort((a, b) => b - a);

    const played = [];
    mySelectedLiarCards.forEach(idx => {
        if (myHand[idx] !== undefined) played.push(myHand.splice(idx, 1)[0]);
    });
    mySelectedLiarCards = [];

    liar.pileCount = (liar.pileCount || 0) + played.length;
    liar.lastPlay = {
        pid: myId,
        nick: myNick,
        cards: played
    };
    liar.log = `🃏 ${myNick} kładzie ${played.length} zakrytą kartę/karty deklarując: ${liar.target}!`;
    liar.turnIdx = (liar.turnIdx + 1) % aliveP.length;

    await pushState();
}

async function liarCallBluffOnline() {
    if (!roomState || !roomState.liarOnline) return;
    const liar = roomState.liarOnline;
    const aliveP = getAliveLiarPlayers();
    const caller = aliveP[liar.turnIdx % aliveP.length];

    if (!caller || (caller.id !== myId && !caller.isBot)) {
        alert("Sprawdzić kłamcę możesz tylko w swojej turze!");
        return;
    }
    if (!liar.lastPlay) {
        alert("Nikt jeszcze nie położył kart na stół!");
        return;
    }

    const accusedId = liar.lastPlay.pid;
    const accusedNick = liar.lastPlay.nick;
    const revealed = liar.lastPlay.cards || [];

    // Kłamstwo, jeśli którakolwiek z położonych kart nie jest wymaganą figurą ani JOKEREM
    const wasLying = revealed.some(c => c !== liar.target && c !== "JOKER");
    const loserId = wasLying ? accusedId : caller.id;
    const loserNick = wasLying ? accusedNick : caller.nick;

    if (!liar.shots) liar.shots = {};
    liar.shots[loserId] = (liar.shots[loserId] || 0) + 1;
    const currentChamber = liar.shots[loserId];
    const isBang = Math.random() < (currentChamber / 6);

    let resultMsg = `🚨 ${caller.nick} SPRAWDZA! Odkryte karty to: [${revealed.join(", ")}]. `;
    resultMsg += wasLying ? `${accusedNick} BLEFOWAŁ! ` : `${accusedNick} MÓWIŁ PRAWDĘ! `;

    if (!liar.dead) liar.dead = {};
    if (isBang) {
        liar.dead[loserId] = true;
        resultMsg += `💥 BANG! (${currentChamber}/6) – ${loserNick} odpada ze stołu!`;
    } else {
        resultMsg += `🔫 KLIK! Pusty bębenek (${currentChamber}/6) – ${loserNick} przeżył i gra dalej!`;
    }

    const remainingAlive = getAliveLiarPlayers();
    if (remainingAlive.length <= 1) {
        liar.log = resultMsg + ` 🏆 KONIEC GRY! Przy stole przetrwał ${remainingAlive[0]?.nick || caller.nick}!`;
        liar.lastPlay = null;
    } else {
        const nextRound = createFreshLiarRound(remainingAlive, liar.shots);
        nextRound.dead = liar.dead;
        nextRound.log = resultMsg + ` ➡️ Nowe rozdanie! Teraz karta stołu to: ${nextRound.target}.`;
        roomState.liarOnline = nextRound;
    }

    mySelectedLiarCards = [];
    await pushState();
}

async function runLiarBotOnline(bot, aliveP) {
    const liar = roomState.liarOnline;
    const botHand = (liar.hands && liar.hands[bot.id]) ? liar.hands[bot.id] : [];

    if (liar.lastPlay && (botHand.length === 0 || Math.random() < 0.35)) {
        await liarCallBluffOnline();
        return;
    }
    if (botHand.length === 0) {
        const refreshed = createFreshLiarRound(aliveP, liar.shots);
        refreshed.dead = liar.dead || {};
        roomState.liarOnline = refreshed;
        await pushState();
        return;
    }

    const card = botHand.pop();
    liar.pileCount = (liar.pileCount || 0) + 1;
    liar.lastPlay = { pid: bot.id, nick: bot.nick, cards: [card] };
    liar.log = `🤖 ${bot.nick} kładzie 1 zakrytą kartę jako ${liar.target}.`;
    liar.turnIdx = (liar.turnIdx + 1) % aliveP.length;
    await pushState();
}

// =====================================================
// SYSTEM WYRZUCANIA GRACZY I BOTÓW (KICK - TYLKO DLA HOSTA 👑)
// Wklej na sam dół pliku script.js!
// =====================================================

async function hostKickPlayer(targetId) {
    if (!roomState || !isMeRoomHost()) {
        alert("Tylko Host 👑 może wyrzucać graczy!");
        return;
    }
    if (targetId === myId) return; // Host nie może wyrzucić samego siebie

    const target = roomState.players ? roomState.players[targetId] : null;
    if (!target) return;

    if (!confirm(`Czy na pewno chcesz wyrzucić "${target.nick}" z pokoju i ze wszystkich gier?`)) return;

    const kickedNick = target.nick;

    // 1. Zwolnij wszystkie dzielnice tego gracza w Monopoly z powrotem do banku
    if (roomState.props) {
        Object.keys(roomState.props).forEach(posKey => {
            if (roomState.props[posKey].owner === targetId) {
                delete roomState.props[posKey];
            }
        });
    }

    // 2. Usuń pionki z Chińczyka Online
    if (roomState.ludoOnline && roomState.ludoOnline.pawns) {
        delete roomState.ludoOnline.pawns[targetId];
    }

    // 3. Usuń karty i status z Liar's Table Online
    if (roomState.liarOnline) {
        if (roomState.liarOnline.hands) delete roomState.liarOnline.hands[targetId];
        if (roomState.liarOnline.shots) delete roomState.liarOnline.shots[targetId];
        if (roomState.liarOnline.dead) delete roomState.liarOnline.dead[targetId];
        if (roomState.liarOnline.lastPlay && roomState.liarOnline.lastPlay.pid === targetId) {
            roomState.liarOnline.lastPlay = null;
        }
    }

    // 4. Usuń gracza/bota z głównej listy pokoju
    delete roomState.players[targetId];

    // 5. Napraw indeksy tur we wszystkich grach, żeby nic się nie zablokowało
    const remActiveMonopoly = getActivePlayers();
    if (remActiveMonopoly.length > 0) {
        roomState.turnIdx = roomState.turnIdx % remActiveMonopoly.length;
        roomState.rolledThisTurn = false;
    } else {
        roomState.status = "lobby";
    }

    const remLudo = getOrderedPlayers().slice(0, 4);
    if (roomState.ludoOnline && remLudo.length > 0) {
        roomState.ludoOnline.turnIdx = roomState.ludoOnline.turnIdx % remLudo.length;
        roomState.ludoOnline.rolled = false;
        roomState.ludoOnline.log = `🥾 Host wyrzucił gracza ${kickedNick} z gry!`;
    }

    const remLiar = getAliveLiarPlayers();
    if (roomState.liarOnline && remLiar.length > 0) {
        roomState.liarOnline.turnIdx = roomState.liarOnline.turnIdx % remLiar.length;
        roomState.liarOnline.log = `🥾 Host wyrzucił gracza ${kickedNick} od stołu!`;
    }

    roomState.lastLog = `🥾 Host (${myNick}) wyrzucił gracza ${kickedNick} z pokoju!`;
    await pushState();
}

// Sprawdź podczas odświeżania, czy Host mnie nie wyrzucił
const origFetchUpdate = fetchRoomUpdate;
fetchRoomUpdate = async function() {
    try {
        const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
        const data = await res.json();
        if (data) {
            // Jeśli wcześniej byłem w pokoju, a teraz mnie na liście nie ma -> zostałem wyrzucony!
            if (roomState && roomState.players && roomState.players[myId] && (!data.players || !data.players[myId])) {
                clearInterval(pollTimer);
                roomState = null;
                alert("🥾 Zostałeś wyrzucony z pokoju przez Hosta!");
                // Przenosimy wyrzuconego gracza do nowego pustego pokoju
                const randomRoom = "RSL" + Math.floor(Math.random() * 900 + 100);
                await joinRoomNow(randomRoom);
                return;
            }
            roomState = data;
            renderRichupScreen();
        }
    } catch (e) {}
};

// Automatyczne doklejanie przycisku 🥾 Kick dla Hosta we wszystkich 3 grach (Monopoly, Chińczyk, Liar's Table)
const prevRenderAllScreens = renderRichupScreen;
renderRichupScreen = function() {
    prevRenderAllScreens();
    if (!roomState) return;

    const amIHost = isMeRoomHost();
    const allP = getOrderedPlayers();

    // 1. Lista graczy w Monopoly (prawy panel)
    const monoList = document.getElementById("players-list-right");
    if (monoList) {
        monoList.innerHTML = allP.map(p => `
            <div class="p-row" style="opacity:${p.bankrupt ? 0.4 : 1}">
                <div class="p-left">
                    <div class="p-dot" style="background:${p.color}"></div>
                    <strong>${p.nick}</strong>
                    ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                    ${p.bankrupt ? `<span style="color:#ef4444;font-size:11px;">BANKRUT</span>` : ``}
                </div>
                <div style="display:flex; align-items:center;">
                    <strong>$${p.cash}</strong>
                    ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć z gry">🥾</button>` : ``}
                </div>
            </div>
        `).join("");
    }

    // 2. Lista graczy w Chińczyku (lewy panel)
    const ludoList = document.getElementById("ludo-players-online");
    if (ludoList && roomState.ludoOnline) {
        const players4 = allP.slice(0, 4);
        const ludo = roomState.ludoOnline;
        const activeIdx = players4.length > 0 ? (ludo.turnIdx % players4.length) : 0;

        ludoList.innerHTML = players4.map((p, idx) => {
            const pPawns = (ludo.pawns && ludo.pawns[p.id]) ? ludo.pawns[p.id] : [-1,-1,-1,-1];
            const inHome = pPawns.filter(s => s >= 40).length;
            return `
                <div class="p-row" style="border-left: 5px solid ${L_COLS[idx]}">
                    <div class="p-left">
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑</span>` : ``}
                        ${idx === activeIdx ? `<span style="color:#fde047;font-size:11px;">🎲 TURA</span>` : ``}
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span style="font-size:12px;">🏠 <strong>${inHome}/4</strong></span>
                        ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć z gry">🥾</button>` : ``}
                    </div>
                </div>
            `;
        }).join("");
    }

    // 3. Lista graczy w Liar's Table (lewy panel)
    const liarList = document.getElementById("liar-players-online");
    if (liarList && roomState.liarOnline) {
        const liar = roomState.liarOnline;
        const aliveP = getAliveLiarPlayers();
        const currP = aliveP.length > 0 ? aliveP[liar.turnIdx % aliveP.length] : null;

        liarList.innerHTML = allP.map(p => {
            const isDead = liar.dead && liar.dead[p.id];
            const cardCnt = (liar.hands && liar.hands[p.id]) ? liar.hands[p.id].length : 0;
            const shotCnt = (liar.shots && liar.shots[p.id]) ? liar.shots[p.id] : 0;
            const isTurn = currP && currP.id === p.id && !isDead;
            return `
                <div class="p-row" style="opacity:${isDead ? 0.4 : 1}; border-left: 4px solid ${p.color}">
                    <div class="p-left">
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑</span>` : ``}
                        ${isTurn ? `<span style="color:#fde047;font-size:11px;">🃏 TURA</span>` : ``}
                        ${isDead ? `<span style="color:#ef4444;font-size:11px;">💀</span>` : ``}
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span style="font-size:12px;">🃏 ${cardCnt} | 🔫 ${shotCnt}/6</span>
                        ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć ze stołu">🥾</button>` : ``}
                    </div>
                </div>
            `;
        }).join("");
    }
};

// =====================================================
// ANIMACJA KROK PO KROKU DLA PIONKÓW MONOPOLY (ZERO TELEPORTACJI!)
// Wklej na sam dół pliku script.js!
// =====================================================

let visualPositions = {};   // Aktualnie wyświetlana pozycja pionka na ekranie
let animTimers = {};        // Timery skakania dla poszczególnych graczy
let isHoppingMap = {};      // Czy dany pionek jest teraz w trakcie skoku

const prevRenderBeforeAnim = renderRichupScreen;

renderRichupScreen = function() {
    if (!roomState) return;

    const boardData = getCurrentBoard();
    const totalTiles = boardData.length;
    const activePlayers = getActivePlayers();

    // 1. Sprawdź, czy któryś gracz zmienił pozycję w bazie danych
    activePlayers.forEach(p => {
        const realTargetPos = p.pos || 0;

        // Przy pierwszym załadowaniu ustawiamy pozycję od razu
        if (visualPositions[p.id] === undefined) {
            visualPositions[p.id] = realTargetPos;
        } 
        // Jeśli gra zresetowana do STARTU (0) w lobby -> od razu ustaw na 0
        else if (roomState.status === "lobby" && realTargetPos === 0) {
            visualPositions[p.id] = 0;
            isHoppingMap[p.id] = false;
            if (animTimers[p.id]) {
                clearInterval(animTimers[p.id]);
                delete animTimers[p.id];
            }
        }
        // Jeśli pozycja docelowa różni się od wyświetlanej -> uruchom skakanie pole po polu!
        else if (visualPositions[p.id] !== realTargetPos && !animTimers[p.id]) {
            isHoppingMap[p.id] = true;
            animTimers[p.id] = setInterval(() => {
                if (!roomState || !roomState.players || !roomState.players[p.id]) {
                    clearInterval(animTimers[p.id]);
                    delete animTimers[p.id];
                    isHoppingMap[p.id] = false;
                    return;
                }

                const currentTarget = roomState.players[p.id].pos || 0;
                if (visualPositions[p.id] === currentTarget) {
                    // Pionek dotarł na docelowe pole -> zatrzymaj animację
                    clearInterval(animTimers[p.id]);
                    delete animTimers[p.id];
                    isHoppingMap[p.id] = false;
                    renderRichupScreen();
                } else {
                    // Przesuń pionek o 1 kafelek do przodu zgodnie z ruchem wskazówek zegara
                    visualPositions[p.id] = (visualPositions[p.id] + 1) % totalTiles;
                    renderPawnsOnTilesOnly(boardData, activePlayers);
                }
            }, 135); // Prędkość skoku: 135 ms na każde pole
        }
    });

    // 2. Wywołaj standardowe rysowanie ekranu i planszy
    prevRenderBeforeAnim();

    // 3. Nadpisz pionki na kafelkach ich płynną (animowaną) pozycją
    renderPawnsOnTilesOnly(boardData, activePlayers);
};

// Szybka funkcja odświeżająca same pionki podczas skoku z pola na pole
function renderPawnsOnTilesOnly(boardData, activePlayers) {
    const boardEl = document.getElementById("monopoly-board");
    if (!boardEl) return;

    const tiles = boardEl.querySelectorAll(".m-tile");
    if (tiles.length === 0) return;

    tiles.forEach((tileEl, idx) => {
        const pawnsContainer = tileEl.querySelector(".tile-pawns");
        if (!pawnsContainer) return;

        const playersHere = activePlayers.filter(p => {
            const shownPos = (visualPositions[p.id] !== undefined) ? visualPositions[p.id] : p.pos;
            return shownPos === idx;
        });

        pawnsContainer.innerHTML = playersHere.map(p => {
            const hopClass = isHoppingMap[p.id] ? "pawn-hopping" : "";
            return `<div class="pawn-circle ${hopClass}" style="background:${p.color}" title="${p.nick}">
                        ${p.nick.substring(0, 2).toUpperCase()}
                    </div>`;
        }).join("");
    });
}

// =====================================================
// FIX KOLEJEK I BOTÓW (1 RZUT = 1 TURA) + ANIMACJA KOSTEK + TABELKA HISTORII
// Wklej na sam dół pliku script.js!
// =====================================================

let botTurnInProgress = false; // Twarda blokada, żeby Bot nigdy nie rzucił 2 razy w jednej turze!
let lastSeenDiceRollId = 0;

// Funkcja dodająca wpis do Tabelki Historii na środku planszy
function addHistoryEntry(text, playerColor = "#8b5cf6") {
    if (!roomState) return;
    if (!roomState.historyLogs) roomState.historyLogs = [];

    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);

    roomState.historyLogs.unshift({
        time: timeStr,
        text: text,
        color: playerColor
    });

    // Trzymamy ostatnie 25 ruchów w tabelce
    if (roomState.historyLogs.length > 25) {
        roomState.historyLogs.pop();
    }
    roomState.lastLog = text;
}

// Efekt obracania kostek 3D na ekranie
function triggerDiceSpinAnimation(finalD1, finalD2) {
    const box1 = document.getElementById("die-box-1");
    const box2 = document.getElementById("die-box-2");
    if (!box1 || !box2) return;

    const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    box1.classList.remove("die-rolling");
    box2.classList.remove("die-rolling");
    void box1.offsetWidth; // Reset animacji CSS
    box1.classList.add("die-rolling");
    box2.classList.add("die-rolling");

    // Szybkie przeskakiwanie oczek w trakcie obrotu kostki
    let ticks = 0;
    const spinInterval = setInterval(() => {
        ticks++;
        box1.innerText = faces[Math.floor(Math.random() * 6) + 1];
        box2.innerText = faces[Math.floor(Math.random() * 6) + 1];
        if (ticks >= 5) {
            clearInterval(spinInterval);
            box1.innerText = faces[finalD1] || finalD1;
            box2.innerText = faces[finalD2] || finalD2;
        }
    }, 85);
}

// Stałe i przewidywalne sortowanie graczy (eliminuje przeskakiwanie kolejek!)
getOrderedPlayers = function() {
    if (!roomState || !roomState.players) return [];
    return Object.values(roomState.players).sort((a, b) => {
        if ((a.orderNum || 0) !== (b.orderNum || 0)) {
            return (a.orderNum || 0) - (b.orderNum || 0);
        }
        return a.id.localeCompare(b.id);
    });
};

// Start Gry z ustaleniem sztywnej kolejki (Gracz 1 -> Gracz 2 -> Bot 1 -> Bot 2...)
hostStartGame = async function() {
    if (!roomState) return;
    let pArr = Object.values(roomState.players || {});
    if (pArr.length < 2) {
        alert("Dodaj przynajmniej 1 znajomego albo kliknij '+ 🤖 Bot' po prawej stronie!");
        return;
    }

    if (roomState.settings && roomState.settings.randomOrder) {
        pArr.sort(() => Math.random() - 0.5);
    }

    roomState.status = "playing";
    roomState.turnIdx = 0;
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.pot = 0;
    roomState.props = {};
    roomState.historyLogs = [];

    pArr.forEach((p, index) => {
        p.orderNum = index + 1; // Sztywny numer w kolejce!
        p.pos = 0;
        p.cash = roomState.settings.startCash;
        p.bankrupt = false;
        p.inJail = 0;
        p.doubles = 0;
    });

    const firstP = getActivePlayers()[0];
    addHistoryEntry(`🚀 Rozgrywka wystartowała! Jako pierwszy rzuca ${firstP.nick}.`, firstP.color);
    botTurnInProgress = false;
    await pushState();
};

// Reset do Lobby czyści też tabelkę historii
const origResetLobby = resetToLobbySettings;
resetToLobbySettings = async function() {
    botTurnInProgress = false;
    if (roomState) roomState.historyLogs = [];
    await origResetLobby();
};

// 1 RZUT KOSTKĄ GRACZA
rollDiceNow = async function() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) return;

    const currIdx = roomState.turnIdx % activePlayers.length;
    const currP = activePlayers[currIdx];

    if (currP.id !== myId) {
        alert(`Teraz jest kolej gracza: ${currP.nick}!`);
        return;
    }
    if (roomState.rolledThisTurn) {
        alert("W tej turze już rzuciłeś kostką! Kup pole/domek lub kliknij '⏭️ Koniec tury'.");
        return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    roomState.rolledThisTurn = true;
    roomState.housesThisTurn = 0;

    triggerDiceSpinAnimation(d1, d2);

    const boardData = getCurrentBoard();
    const oldPos = currP.pos || 0;
    currP.pos = (oldPos + sum) % boardData.length;

    let passMsg = "";
    if (currP.pos < oldPos) {
        currP.cash += 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[currP.pos];
    const landResult = processLanding(currP, tile, currP.pos, boardData);

    addHistoryEntry(
        `🎲 <strong>${currP.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ staje na <strong>${tile.name}</strong>. ${landResult}`,
        currP.color
    );

    if (currP.cash < 0) {
        await declareBankrupt(currP.id);
        return;
    }

    await pushState();
};

// Kupowanie ulicy z wpisem do Tabelki Historii
buyCurrentProperty = async function() {
    if (!roomState) return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];
    if (!currP || currP.id !== myId) return;

    const boardData = getCurrentBoard();
    const tile = boardData[currP.pos];
    if (!roomState.props) roomState.props = {};
    if (roomState.props[currP.pos] || currP.cash < tile.price) return;

    currP.cash -= tile.price;
    roomState.props[currP.pos] = { owner: myId, houses: 0 };

    addHistoryEntry(
        `💰 <strong>${currP.nick}</strong> kupuje dzielnicę <strong>${tile.name}</strong> za <strong>${tile.price}$</strong>!`,
        currP.color
    );
    await pushState();
};

// Budowanie domku z wpisem do Tabelki Historii
buildHouseOnIndex = async function(idx) {
    const boardData = getCurrentBoard();
    if (!canBuildHouseHere(myId, idx, boardData)) {
        alert("Możesz postawić domek tylko zgodnie z wybranymi zasadami (równo po 1 na każde pole państwa, max 3 na turę)!");
        return;
    }
    const tile = boardData[idx];
    const me = roomState.players[myId];
    const cost = tile.house || 50;

    me.cash -= cost;
    roomState.props[idx].houses = (roomState.props[idx].houses || 0) + 1;
    roomState.housesThisTurn = (roomState.housesThisTurn || 0) + 1;

    addHistoryEntry(
        `🏠 <strong>${me.nick}</strong> buduje domek #${roomState.props[idx].houses} na <strong>${tile.name}</strong> (-${cost}$)!`,
        me.color
    );
    await pushState();
};

// Koniec tury -> przekazuje kolejkę dokładnie o 1 osobę dalej
nextTurnNow = async function() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    if (currP.id !== myId) return;
    if (!roomState.rolledThisTurn) {
        alert("Najpierw rzuć kostką!");
        return;
    }

    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;

    const nextP = activePlayers[roomState.turnIdx % activePlayers.length];
    addHistoryEntry(`⏭️ <strong>${currP.nick}</strong> kończy turę. Teraz kolej na: <strong>${nextP.nick}</strong>.`, nextP.color);
    botTurnInProgress = false;
    await pushState();
};

// NAPRAWIONY RUCH BOTA: DOKŁADNIE 1 RZUT KOSTKĄ -> EWENTUALNY ZAKUP -> KONIEC TURY BOTA!
runBotTurn = async function(bot) {
    if (botTurnInProgress || !roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    // Upewnij się, że to naprawdę tura tego Bota
    if (!currP || currP.id !== bot.id || !currP.isBot) return;

    botTurnInProgress = true; // Zablokuj kolejne wywołania!

    const boardData = getCurrentBoard();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    triggerDiceSpinAnimation(d1, d2);

    const oldPos = bot.pos || 0;
    bot.pos = (oldPos + sum) % boardData.length;

    let passMsg = "";
    if (bot.pos < oldPos) {
        bot.cash += 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[bot.pos];
    let actionDesc = processLanding(bot, tile, bot.pos, boardData);

    // Jeśli pole jest wolne i Bot ma kasę -> kupuje miasto
    if (!roomState.props) roomState.props = {};
    if ((tile.type === "prop" || tile.type === "station" || tile.type === "utility") && !roomState.props[bot.pos] && bot.cash >= tile.price + 80) {
        bot.cash -= tile.price;
        roomState.props[bot.pos] = { owner: bot.id, houses: 0 };
        actionDesc += ` 💰 Kupuje miasto <strong>${tile.name}</strong> za ${tile.price}$!`;
    } 
    // Jeśli stoi na swoim polu i może postawić 1 domek
    else if (tile.type === "prop" && roomState.props[bot.pos]?.owner === bot.id && (roomState.props[bot.pos].houses || 0) < 5 && bot.cash >= (tile.house || 50) + 100) {
        bot.cash -= (tile.house || 50);
        roomState.props[bot.pos].houses = (roomState.props[bot.pos].houses || 0) + 1;
        actionDesc += ` 🏠 Stawia domek na <strong>${tile.name}</strong>!`;
    }

    // Przekaż turę następnemu graczowi w kolejce
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;
    const nextPlayer = activePlayers[roomState.turnIdx % activePlayers.length];

    addHistoryEntry(
        `🤖 <strong>${bot.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ <strong>${tile.name}</strong>. ${actionDesc} (Teraz: ${nextPlayer.nick})`,
        bot.color
    );

    await pushState();

    // Odczekaj 2.2 sekundy (aż pionek Bota doskoczy na pole), zanim pozwolisz na ruch kolejnego Bota
    setTimeout(() => {
        botTurnInProgress = false;
        renderRichupScreen();
    }, 2200);
};

// Renderowanie Tabelki Historii i bezpieczne wyzwalanie Bota
const prevRenderBeforeHistory = renderRichupScreen;
renderRichupScreen = function() {
    prevRenderBeforeHistory();
    if (!roomState) return;

    // 1. Odtwórz animację obrotu kostek u innych graczy, jeśli pojawił się nowy rzut
    if (roomState.diceRollId && roomState.diceRollId !== lastSeenDiceRollId) {
        lastSeenDiceRollId = roomState.diceRollId;
        const d1 = roomState.dice ? roomState.dice[0] : 1;
        const d2 = roomState.dice ? roomState.dice[1] : 1;
        triggerDiceSpinAnimation(d1, d2);
    }

    // 2. Wyświetl Tabelkę Historii na środku planszy
    const logContainer = document.getElementById("action-log-box");
    if (logContainer) {
        const logs = roomState.historyLogs || [];
        if (logs.length === 0) {
            logContainer.innerHTML = `<div class="history-row">${roomState.lastLog || 'Oczekiwanie na pierwszy ruch...'}</div>`;
        } else {
            logContainer.innerHTML = logs.map(item => `
                <div class="history-row" style="border-left-color: ${item.color || '#8b5cf6'}">
                    <span>${item.text}</span>
                    <span class="history-time">${item.time || ''}</span>
                </div>
            `).join("");
        }
    }

    // 3. Ukryj przycisk "Rzuć kostką", gdy gracz już rzucił w tej turze (zostaje Kup / Domek / Koniec tury)
    const activePlayers = getActivePlayers();
    const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
    const rollBtn = document.getElementById("btn-roll-dice");
    const endBtn = document.getElementById("btn-finish-turn");

    if (rollBtn && endBtn && currP) {
        const isMyTurn = currP.id === myId;
        rollBtn.classList.toggle("hidden", !(isMyTurn && !roomState.rolledThisTurn));
        endBtn.classList.toggle("hidden", !(isMyTurn && roomState.rolledThisTurn));
    }

    // 4. Jeśli teraz jest kolej Bota i nie trwa już rzut -> odpal 1 ruch Bota po 1.4 sekundy
    if (roomState.status === "playing" && currP && currP.isBot && isMeRoomHost() && !botTurnInProgress) {
        setTimeout(() => {
            if (!botTurnInProgress && roomState?.status === "playing") {
                const checkCurr = getActivePlayers()[roomState.turnIdx % getActivePlayers().length];
                if (checkCurr && checkCurr.id === currP.id) {
                    runBotTurn(currP);
                }
            }
        }, 1400);
    }
};

// =====================================================
// NAPRAWA MRUGANIA HISTORIE/ŚRODKA ORAZ PŁYNNEGO RUCHU BOTÓW
// Wklej na sam dół pliku script.js!
// =====================================================

// Poprawione renderowanie, które NIE niszczy środka planszy i historii (brak mrugania!)
const oldRichupRender = renderRichupScreen;
renderRichupScreen = function() {
    if (!roomState) return;

    const boardData = getCurrentBoard();
    const totalTiles = boardData.length;
    const activePlayers = getActivePlayers();

    // Synchronizacja pozycji dla botów, żeby nie zacinały się w miejscu
    activePlayers.forEach(p => {
        const realTargetPos = p.pos || 0;
        if (visualPositions[p.id] === undefined) {
            visualPositions[p.id] = realTargetPos;
        } else if (p.isBot && visualPositions[p.id] !== realTargetPos && !animTimers[p.id]) {
            visualPositions[p.id] = realTargetPos; // Natychmiastowa synchronizacja pozycji Bota
        }
    });

    // Wywołaj bazowe rysowanie planszy i pionków
    oldRichupRender();

    // Płynne aktualizowanie wartości w tabelce historii i kostek BEZ mrugania DOM
    const isPlaying = roomState.status === "playing";
    const lobbyCtrl = document.getElementById("lobby-center-controls");
    const playCtrl = document.getElementById("playing-center-controls");
    if (lobbyCtrl) lobbyCtrl.classList.toggle("hidden", isPlaying);
    if (playCtrl) playCtrl.classList.toggle("hidden", !isPlaying);

    const vacEl = document.getElementById("vacation-pot-val");
    if (vacEl) vacEl.innerText = (roomState.pot || 0) + "$";

    const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
    const statusPill = document.getElementById("turn-status-text");
    if (statusPill && currP) {
        const isMe = currP.id === myId;
        statusPill.innerText = isPlaying ? `Tura gracza: ${currP.nick} ${isMe ? '(TWOJA KOLEJ!)' : ''}` : "W Lobby – skonfiguruj grę po prawej stronie";
        statusPill.style.borderColor = currP.color || "#3f375c";
    }

    // Bezpieczne doklejenie historii, jeśli kontener istnieje
    const logContainer = document.getElementById("action-log-box");
    if (logContainer && roomState.historyLogs) {
        const logs = roomState.historyLogs;
        // Aktualizuj zawartość tylko jeśli liczba wpisów się zmieniła (zapobiega miganiu)
        if (logContainer.dataset.lastLen !== String(logs.length)) {
            logContainer.dataset.lastLen = logs.length;
            logContainer.innerHTML = logs.map(item => `
                <div class="history-row" style="border-left-color: ${item.color || '#8b5cf6'}">
                    <span>${item.text}</span>
                    <span class="history-time">${item.time || ''}</span>
                </div>
            `).join("");
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }
};

// =====================================================
// OSTATECZNA NAPRAWA: ZERO MIGANIA HISTORII + WIDOCZNY RUCH BOTÓW
// Wklej na sam dół pliku script.js!
// =====================================================

let lastRenderedHistorySignature = "";
let isSavingNow = false;

// 1. Blokujemy odświeżanie z bazy w ułamku sekundy, gdy sami wysyłamy ruch (żeby Firebase nie cofał Bota na Start!)
pushState = async function(customData = null) {
    if (customData) roomState = customData;
    if (!roomState) return;
    isSavingNow = true;
    try {
        await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
            method: "PUT",
            body: JSON.stringify(roomState)
        });
    } catch (e) {}
    isSavingNow = false;
    renderCleanScreen();
};

fetchRoomUpdate = async function() {
    if (isSavingNow) return; // Nie nadpisuj stanu starymi danymi w trakcie zapisu!
    try {
        const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
        const data = await res.json();
        if (data) {
            if (roomState && roomState.players && roomState.players[myId] && (!data.players || !data.players[myId])) {
                clearInterval(pollTimer);
                roomState = null;
                alert("🥾 Zostałeś wyrzucony z pokoju przez Hosta!");
                await joinRoomNow("RSL" + Math.floor(Math.random() * 900 + 100));
                return;
            }
            roomState = data;
            renderCleanScreen();
        }
    } catch (e) {}
};

// 2. Naprawiony ruch Bota – zapisuje pozycję bezpośrednio w głównym obiekcie gracza w bazie!
runBotTurn = async function(botObj) {
    if (botTurnInProgress || !roomState || roomState.status !== "playing") return;

    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) return;
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    if (!currP || currP.id !== botObj.id || !currP.isBot) return;

    // Pobieramy bezpośrednią referencję do Bota w roomState.players!
    const bot = roomState.players[currP.id];
    if (!bot) return;

    botTurnInProgress = true;

    const boardData = getCurrentBoard();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    triggerDiceSpinAnimation(d1, d2);

    const oldPos = Number(bot.pos) || 0;
    const newPos = (oldPos + sum) % boardData.length;
    bot.pos = newPos; // Twardy zapis nowej pozycji Bota!

    let passMsg = "";
    if (newPos < oldPos) {
        bot.cash = (Number(bot.cash) || 0) + 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[newPos];
    let actionDesc = processLanding(bot, tile, newPos, boardData);

    if (!roomState.props) roomState.props = {};
    if ((tile.type === "prop" || tile.type === "station" || tile.type === "utility") && !roomState.props[newPos] && bot.cash >= tile.price + 80) {
        bot.cash -= tile.price;
        roomState.props[newPos] = { owner: bot.id, houses: 0 };
        actionDesc += ` 💰 Kupuje <strong>${tile.name}</strong> (${tile.price}$)!`;
    } else if (tile.type === "prop" && roomState.props[newPos]?.owner === bot.id && (roomState.props[newPos].houses || 0) < 5 && bot.cash >= (tile.house || 50) + 100) {
        bot.cash -= (tile.house || 50);
        roomState.props[newPos].houses = (roomState.props[newPos].houses || 0) + 1;
        actionDesc += ` 🏠 Stawia domek na <strong>${tile.name}</strong>!`;
    }

    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;
    const nextPlayer = activePlayers[roomState.turnIdx % activePlayers.length];

    addHistoryEntry(
        `🤖 <strong>${bot.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ idzie na <strong>${tile.name}</strong>. ${actionDesc}`,
        bot.color
    );

    await pushState();

    // Czekamy aż pionek Bota doskoczy na swoje pole zanim odblokujemy kolejnego Bota
    setTimeout(() => {
        botTurnInProgress = false;
        renderCleanScreen();
    }, 2400);
};

// 3. Czysta funkcja rysująca ekran (Zero migania historii, zero zjeżdżania w dół i płynny ruch Botów)
function renderCleanScreen() {
    if (!roomState) return;

    const allPlayers = getOrderedPlayers();
    const activePlayers = getActivePlayers();
    const boardData = getCurrentBoard();
    const totalTiles = boardData.length;

    if (!roomState.hostId || !roomState.players[roomState.hostId]) {
        roomState.hostId = allPlayers[0]?.id;
    }

    // --- ANIMACJA RUCHU PIONKÓW (GRACZY ORAZ BOTÓW!) ---
    activePlayers.forEach(p => {
        const targetPos = Number(p.pos) || 0;

        if (visualPositions[p.id] === undefined) {
            visualPositions[p.id] = targetPos;
        } else if (roomState.status === "lobby" && targetPos === 0) {
            visualPositions[p.id] = 0;
            isHoppingMap[p.id] = false;
            if (animTimers[p.id]) {
                clearInterval(animTimers[p.id]);
                delete animTimers[p.id];
            }
        } else if (visualPositions[p.id] !== targetPos && !animTimers[p.id]) {
            isHoppingMap[p.id] = true;
            animTimers[p.id] = setInterval(() => {
                const livePlayer = roomState?.players?.[p.id];
                if (!livePlayer) {
                    clearInterval(animTimers[p.id]);
                    delete animTimers[p.id];
                    isHoppingMap[p.id] = false;
                    return;
                }
                const liveTarget = Number(livePlayer.pos) || 0;
                if (visualPositions[p.id] === liveTarget) {
                    clearInterval(animTimers[p.id]);
                    delete animTimers[p.id];
                    isHoppingMap[p.id] = false;
                    renderPawnsOnTilesOnly(boardData, getActivePlayers());
                } else {
                    visualPositions[p.id] = (visualPositions[p.id] + 1) % totalTiles;
                    renderPawnsOnTilesOnly(boardData, getActivePlayers());
                }
            }, 130);
        }
    });

    // --- SYNCHRONIZACJA USTAWIEŃ I PRZYCISKÓW ---
    const isPlaying = roomState.status === "playing";
    if (!isPlaying) applySettingsToDOM(roomState.settings);

    document.getElementById("settings-lock-info")?.classList.toggle("hidden", !isPlaying);
    document.querySelectorAll("#settings-panel-right select, #settings-panel-right input").forEach(el => {
        el.disabled = isPlaying;
    });

    document.getElementById("lobby-center-controls")?.classList.toggle("hidden", isPlaying);
    document.getElementById("playing-center-controls")?.classList.toggle("hidden", !isPlaying);

    // --- RYSOWANIE KAFELKÓW PLANSZY ---
    const gridN = boardData.length === 60 ? 16 : 11;
    const sideLen = gridN - 1;
    const boardEl = document.getElementById("monopoly-board");

    if (boardEl) {
        boardEl.style.gridTemplateColumns = `repeat(${gridN}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${gridN}, 1fr)`;

        const innerCenter = boardEl.querySelector(".board-inner-center");
        if (innerCenter) {
            innerCenter.style.gridColumn = `2 / ${gridN}`;
            innerCenter.style.gridRow = `2 / ${gridN}`;
        }

        // Usuwamy tylko kafelki obwodu, NIGDY nie ruszamy środka planszy!
        boardEl.querySelectorAll(".m-tile").forEach(t => t.remove());

        const props = roomState.props || {};
        boardData.forEach((tile, idx) => {
            const pos = getPerimeterPos(idx, gridN);
            const div = document.createElement("div");
            div.className = "m-tile";
            if (idx % sideLen === 0) div.classList.add("corner");
            if (tile.type === "station") div.classList.add("airport");

            div.style.gridRow = pos.r;
            div.style.gridColumn = pos.c;

            const pState = props[idx];
            const owner = pState ? roomState.players[pState.owner] : null;
            const houses = pState ? (pState.houses || 0) : 0;
            const houseStr = houses === 5 ? "🏨" : "🏠".repeat(houses);

            div.innerHTML = `
                ${tile.color ? `<div class="tile-bar" style="background:${tile.color}">${houseStr}</div>` : `<div></div>`}
                ${tile.icon ? `<div class="tile-icon">${tile.icon}</div>` : ``}
                <div class="tile-title">${tile.name}</div>
                ${tile.price ? `<div class="tile-price">${tile.price}$</div>` : `<div></div>`}
                <div class="tile-owner" style="background:${owner ? owner.color : 'transparent'}"></div>
                <div class="tile-pawns"></div>
            `;
            boardEl.appendChild(div);
        });

        // Wstaw pionki według ich aktualnej (skaczącej) pozycji!
        renderPawnsOnTilesOnly(boardData, activePlayers);
    }

    // --- KOSTKI I PULA ---
    const dieFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const d1 = roomState.dice ? roomState.dice[0] : 5;
    const d2 = roomState.dice ? roomState.dice[1] : 3;

    if (roomState.diceRollId && roomState.diceRollId !== lastSeenDiceRollId) {
        lastSeenDiceRollId = roomState.diceRollId;
        triggerDiceSpinAnimation(d1, d2);
    } else {
        document.getElementById("die-box-1").innerText = dieFaces[d1] || d1;
        document.getElementById("die-box-2").innerText = dieFaces[d2] || d2;
    }

    document.getElementById("vacation-pot-val").innerText = (roomState.pot || 0) + "$";

    // --- TABELKA HISTORII (BEZ MIGANIA I BEZ ZJEŻDŻANIA W DÓŁ!) ---
    const logContainer = document.getElementById("action-log-box");
    if (logContainer) {
        const logs = roomState.historyLogs || [];
        const signature = logs.length > 0 ? (logs.length + "_" + logs[0].time + "_" + logs[0].text) : ("empty_" + (roomState.lastLog || ""));

        // Podmień HTML TYLKO wtedy, gdy faktycznie doszedł nowy wpis!
        if (signature !== lastRenderedHistorySignature) {
            lastRenderedHistorySignature = signature;
            if (logs.length === 0) {
                logContainer.innerHTML = `<div class="history-row">${roomState.lastLog || 'Ustaw zasady po prawej i kliknij Rozpocznij Grę!'}</div>`;
            } else {
                logContainer.innerHTML = logs.map(item => `
                    <div class="history-row" style="border-left-color: ${item.color || '#8b5cf6'}">
                        <span>${item.text}</span>
                        <span class="history-time">${item.time || ''}</span>
                    </div>
                `).join("");
                // Najnowsze wpisy są na samej górze (unshift), więc suwak trzymamy na górze (0)!
                logContainer.scrollTop = 0;
            }
        }
    }

    // --- PRZYCISKI TURY I WYZWALANIE BOTA ---
    const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
    const props = roomState.props || {};

    if (isPlaying && currP) {
        const isMe = currP.id === myId;
        const stText = document.getElementById("turn-status-text");
        stText.innerText = `Tura gracza: ${currP.nick} ${isMe ? '(TWOJA KOLEJ!)' : ''}`;
        stText.style.borderColor = currP.color;

        const tile = boardData[currP.pos || 0];
        const pState = props[currP.pos || 0];

        document.getElementById("btn-roll-dice")?.classList.toggle("hidden", !(isMe && !roomState.rolledThisTurn));
        document.getElementById("btn-finish-turn")?.classList.toggle("hidden", !(isMe && roomState.rolledThisTurn));

        const canBuy = isMe && roomState.rolledThisTurn && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && !pState && currP.cash >= tile.price;
        document.getElementById("btn-buy-prop")?.classList.toggle("hidden", !canBuy);

        const canHouse = isMe && roomState.rolledThisTurn && canBuildHouseHere(myId, currP.pos || 0, boardData);
        document.getElementById("btn-build-house")?.classList.toggle("hidden", !canHouse);

        // Jeśli tura Bota -> odpal ruch Bota
        if (currP.isBot && isMeRoomHost() && !botTurnInProgress) {
            setTimeout(() => {
                if (!botTurnInProgress && roomState?.status === "playing") {
                    const checkAct = getActivePlayers();
                    const checkCurr = checkAct[roomState.turnIdx % checkAct.length];
                    if (checkCurr && checkCurr.id === currP.id) {
                        runBotTurn(checkCurr);
                    }
                }
            }, 1300);
        }
    } else {
        document.getElementById("turn-status-text").innerText = "W Lobby – skonfiguruj grę po prawej stronie";
    }

    // --- LISTA GRACZY Z PRZYCISKIEM KICK ---
    const amIHost = isMeRoomHost();
    document.getElementById("players-count-label").innerText = allPlayers.length;
    const monoList = document.getElementById("players-list-right");
    if (monoList) {
        monoList.innerHTML = allPlayers.map(p => `
            <div class="p-row" style="opacity:${p.bankrupt ? 0.4 : 1}">
                <div class="p-left">
                    <div class="p-dot" style="background:${p.color}"></div>
                    <strong>${p.nick}</strong>
                    ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                    ${p.bankrupt ? `<span style="color:#ef4444;font-size:11px;">BANKRUT</span>` : ``}
                </div>
                <div style="display:flex; align-items:center;">
                    <strong>$${p.cash}</strong>
                    ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć z gry">🥾</button>` : ``}
                </div>
            </div>
        `).join("");
    }

    renderMyOwnedProps(boardData, currP);

    // --- CZAT ---
    const chatBox = document.getElementById("chat-messages");
    const chatArr = roomState.chat || [];
    if (chatBox && chatArr.length > 0) {
        const chatSig = chatArr.length + "_" + chatArr[chatArr.length - 1].text;
        if (chatBox.dataset.sig !== chatSig) {
            chatBox.dataset.sig = chatSig;
            chatBox.innerHTML = chatArr.map(m => `<div class="chat-line"><strong style="color:${m.color}">${m.nick}:</strong> ${m.text}</div>`).join("");
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // Odśwież pozostałe gry online
    if (typeof renderLudoOnline === "function") renderLudoOnline();
    if (typeof renderLiarOnline === "function") renderLiarOnline();
}

// Podmieniamy globalną funkcję na nową, czystą wersję
renderRichupScreen = renderCleanScreen;

// =====================================================
// PODŚWIETLANIE KUPIONYCH PÓL KOLOREM GRACZA (OBRAMÓWKA + POŚWIATA + NICK)
// Wklej na sam dół pliku script.js!
// =====================================================

const prevRenderBeforeOwnedGlow = renderCleanScreen;

renderCleanScreen = function() {
    prevRenderBeforeOwnedGlow();
    if (!roomState) return;

    const boardEl = document.getElementById("monopoly-board");
    if (!boardEl) return;

    const props = roomState.props || {};
    const tiles = boardEl.querySelectorAll(".m-tile");

    tiles.forEach((tileEl, idx) => {
        const pState = props[idx];
        const owner = pState && roomState.players ? roomState.players[pState.owner] : null;

        if (owner && !owner.bankrupt) {
            tileEl.classList.add("owned-tile");
            // Gruba obramówka w kolorze właściciela + świecąca poświata wokół pola + lekki odcień tła
            tileEl.style.borderColor = owner.color;
            tileEl.style.boxShadow = `0 0 12px ${owner.color}99, inset 0 0 18px ${owner.color}44`;
            tileEl.style.background = `linear-gradient(180deg, #221e33 45%, ${owner.color}38 100%)`;

            // Podmień dolny pasek na wyraźną plakietkę z nickiem właściciela
            const oldBar = tileEl.querySelector(".tile-owner");
            if (oldBar) {
                oldBar.className = "tile-owner-badge";
                oldBar.style.background = owner.color;
                oldBar.innerText = `👑 ${owner.nick.substring(0, 8)}`;
            }
        }
    });
};

renderRichupScreen = renderCleanScreen;

// =====================================================
// SYSTEM: "STWÓRZ WŁASNE LOBBY" ORAZ "DOŁĄCZ DO ZNAJOMEGO PO KODZIE"
// Wklej na sam dół pliku script.js!
// =====================================================

let isInLobbyRoom = false;

// Na starcie strony NIE wrzucaj gracza automatycznie do pokoju – pokaż wybór!
window.addEventListener("load", () => {
    setTimeout(() => {
        leaveCurrentLobby(true);
    }, 150);
});

// Pokaż/ukryj pole do wpisywania kodu znajomego
function toggleJoinInputBox() {
    const box = document.getElementById("join-friend-box");
    if (box) {
        box.classList.toggle("hidden");
        const inp = document.getElementById("friend-code-input");
        if (inp && !box.classList.contains("hidden")) inp.focus();
    }
}

// 1. OPCJA A: STWÓRZ WŁASNE NOWE LOBBY (Generuje unikalny kod i robi Cię Hostem 👑)
async function createNewLobbyRoom() {
    updateMyProfile();
    const randomCode = "RSL" + Math.floor(Math.random() * 900 + 100);
    currentRoom = randomCode;

    const startCash = parseInt(document.getElementById("rule-start-cash")?.value) || 1500;

    const freshLobbyData = {
        status: "lobby",
        hostId: myId,
        visibility: document.getElementById("room-visibility")?.value || "public",
        turnIdx: 0,
        rolledThisTurn: false,
        housesThisTurn: 0,
        pot: 0,
        dice: [5, 3],
        lastLog: `✨ Utworzono nowe Lobby (${randomCode})! Podaj ten kod znajomym lub dodaj Boty po prawej stronie.`,
        historyLogs: [{
            time: new Date().toTimeString().substring(0, 8),
            text: `👑 <strong>${myNick}</strong> stworzył(a) nowe lobby o kodzie <strong>${randomCode}</strong>! Teraz możesz zapraszać znajomych i dodawać boty.`,
            color: myColor
        }],
        settings: readSettingsFromDOM(),
        players: {
            [myId]: {
                id: myId,
                nick: myNick,
                color: myColor,
                pos: 0,
                cash: startCash,
                inJail: 0,
                doubles: 0,
                bankrupt: false,
                isBot: false,
                orderNum: 1,
                joinedAt: Date.now()
            }
        },
        props: {},
        chat: [{
            nick: "SYSTEM",
            color: "#fde047",
            text: `Lobby ${randomCode} zostało utworzone! Wyślij kod znajomym.`
        }]
    };

    isInLobbyRoom = true;
    setLobbyUIState(true, randomCode);
    await pushState(freshLobbyData);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchRoomUpdate, 1100);
}

// 2. OPCJA B: DOŁĄCZ DO ZNAJOMEGO PO WPISANIU KODU
async function joinFriendLobbyByCode() {
    updateMyProfile();
    const inp = document.getElementById("friend-code-input");
    const code = inp ? inp.value.trim().toUpperCase() : "";

    if (!code) {
        alert("Wpisz najpierw kod lobby od swojego znajomego!");
        return;
    }

    // Sprawdź w Firebase czy takie lobby w ogóle istnieje!
    const res = await fetch(`${FIREBASE_URL}richup_rooms/${code}.json`);
    const existingRoom = await res.json();

    if (!existingRoom || !existingRoom.players) {
        alert(`❌ Nie znaleziono lobby o kodzie "${code}"! Upewnij się, że znajomy najpierw kliknął "Stwórz własne Lobby".`);
        return;
    }

    const pCount = Object.keys(existingRoom.players).length;
    if (!existingRoom.players[myId] && pCount >= 10) {
        alert("❌ To lobby jest już pełne (10/10 graczy)!");
        return;
    }

    isInLobbyRoom = true;
    setLobbyUIState(true, code);
    await joinRoomNow(code);
}

// Kliknięcie na otwarty pokój z listy publicznej
const origJoinRoomNow = joinRoomNow;
joinRoomNow = async function(roomCode) {
    isInLobbyRoom = true;
    setLobbyUIState(true, roomCode);
    await origJoinRoomNow(roomCode);

    // Dodaj powiadomienie w historii o dołączeniu gracza
    if (roomState && roomState.players && Object.keys(roomState.players).length > 1) {
        addHistoryEntry(`👋 <strong>${myNick}</strong> dołączył(a) do lobby!`, myColor);
        await pushState();
    }
};

// 3. WYJŚCIE Z OBECNEGO LOBBY (Powrót do menu "Stwórz / Dołącz")
async function leaveCurrentLobby(silent = false) {
    if (!silent && roomState && roomState.players && roomState.players[myId]) {
        delete roomState.players[myId];
        await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
            method: "PUT",
            body: JSON.stringify(roomState)
        });
    }

    if (pollTimer) clearInterval(pollTimer);
    isInLobbyRoom = false;
    roomState = null;
    currentRoom = "";
    setLobbyUIState(false, "");

    // Wyczyść widok listy graczy i zablokuj start dopóki gracz nie stworzy/dołączy do lobby
    const monoList = document.getElementById("players-list-right");
    if (monoList) {
        monoList.innerHTML = `<div class="small-label" style="text-align:center; padding:12px;">Najpierw <strong>Stwórz Lobby</strong> lub <strong>Dołącz do znajomego</strong> w panelu po lewej stronie!</div>`;
    }
    document.getElementById("players-count-label").innerText = "0";
    document.getElementById("turn-status-text").innerText = "Brak aktywnego Lobby – wybierz opcję po lewej stronie";
    document.getElementById("center-room-label").innerText = "BRAK (Stwórz lub Dołącz po lewej)";

    const logBox = document.getElementById("action-log-box");
    if (logBox) {
        logBox.innerHTML = `<div class="history-row">👈 Kliknij po lewej stronie <strong>"➕ Stwórz własne Lobby"</strong> albo <strong>"🔑 Dołącz do znajomego"</strong>, aby rozpocząć!</div>`;
    }
}

// Przełączanie widoku w lewym panelu (Menu wyboru vs Aktywne Lobby)
function setLobbyUIState(inRoom, code) {
    const choiceBox = document.getElementById("lobby-menu-choice");
    const activeBox = document.getElementById("active-lobby-info");
    const codeDisp = document.getElementById("active-room-code-display");
    const hiddenInput = document.getElementById("room-code-box");
    const centerLabel = document.getElementById("center-room-label");

    if (choiceBox) choiceBox.classList.toggle("hidden", inRoom);
    if (activeBox) activeBox.classList.toggle("hidden", !inRoom);
    if (codeDisp) codeDisp.innerText = code || "---";
    if (hiddenInput) hiddenInput.value = code || "";
    if (centerLabel) centerLabel.innerText = code || "BRAK";
}

// Zabezpieczenie: Nie pozwól dodać Bota ani wystartować gry, jeśli nie stworzono jeszcze Lobby!
const origAddBot = addBotPlayer;
addBotPlayer = async function() {
    if (!isInLobbyRoom || !roomState) {
        alert("Najpierw kliknij '➕ Stwórz własne Lobby' po lewej stronie, żeby móc dodawać Boty i znajomych!");
        return;
    }
    await origAddBot();
};

const origHostStart = hostStartGame;
hostStartGame = async function() {
    if (!isInLobbyRoom || !roomState) {
        alert("Najpierw kliknij '➕ Stwórz własne Lobby' lub '🔑 Dołącz do znajomego' po lewej stronie!");
        return;
    }
    await origHostStart();
};
// =====================================================
// HOVER TOOLTIP (CENY, CZYNSZE, DOMKI/HOTEL) + SUWAK MAKS. DOMKÓW
// Wklej na sam dół pliku script.js!
// =====================================================

// Odczyt suwaka maksymalnej liczby domków z DOM
const origReadSettings = readSettingsFromDOM;
readSettingsFromDOM = function() {
    const s = origReadSettings();
    s.maxHousesBeforeHotel = parseInt(document.getElementById("rule-max-houses")?.value) || 4;
    return s;
};

const origApplySettings = applySettingsToDOM;
applySettingsToDOM = function(s) {
    origApplySettings(s);
    if (s && s.maxHousesBeforeHotel) {
        const sel = document.getElementById("rule-max-houses");
        if (sel) sel.value = s.maxHousesBeforeHotel;
    }
};

// Generowanie HTML dla dymku informacyjnego po najechaniu na pole
function getTileTooltipHTML(tile, propState) {
    if (tile.type !== "prop" && tile.type !== "station" && tile.type !== "utility") {
        return `<div class="tooltip-title">${tile.name}</div><div>Pole specjalne</div>`;
    }

    const price = tile.price || 100;
    const baseRent = tile.rent || 20;
    const houseCost = tile.house || 50;
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    let html = `<div class="tooltip-title">${tile.name}</div>`;
    html += `<div class="tooltip-row"><span>Cena zakupu:</span><strong>${price}$</strong></div>`;
    html += `<div class="tooltip-row"><span>Cena domku:</span><strong>${houseCost}$</strong></div>`;
    html += `<div class="tooltip-row" style="border-top:1px solid #3b3354; margin-top:3px; padding-top:3px;"><span>Czynsz bazowy:</span><strong>${baseRent}$</strong></div>`;

    // Cennik czynszu za domki
    for (let h = 1; h <= maxH; h++) {
        const r = baseRent * Math.pow(2.2, h);
        html += `<div class="tooltip-row"><span>${h} ${h === 1 ? 'domek' : 'domki'}:</span><strong>${Math.floor(r)}$</strong></div>`;
    }
    // Czynsz za hotel
    const hotelRent = baseRent * Math.pow(2.2, maxH + 1.5);
    html += `<div class="tooltip-row" style="color:#fde047;"><span>Hotel (👑):</span><strong>${Math.floor(hotelRent)}$</strong></div>`;

    if (propState) {
        const owner = roomState.players[propState.owner];
        const hCnt = propState.houses || 0;
        const statusStr = hCnt > maxH ? "Hotel 🏨" : (hCnt === 0 ? "Brak zabudowy" : `${hCnt} domki 🏠`);
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:${owner?.color || '#fff'}">Właściciel: ${owner?.nick || 'Bank'} (${statusStr})</div>`;
    }

    return html;
}

// Nadpisujemy rysowanie kafelków, żeby dodać tooltip oraz wyraźne domki/hotele na mapie
const prevRenderForTooltip = renderCleanScreen;
renderCleanScreen = function() {
    prevRenderForTooltip();
    if (!roomState) return;

    const boardEl = document.getElementById("monopoly-board");
    if (!boardEl) return;

    const props = roomState.props || {};
    const boardData = getCurrentBoard();
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
    const tiles = boardEl.querySelectorAll(".m-tile");

    tiles.forEach((tileEl, idx) => {
        const tile = boardData[idx];
        const pState = props[idx];
        const houses = pState ? (pState.houses || 0) : 0;

        // Renderowanie domków lub hotelu na pasku koloru kafelka
        const barEl = tileEl.querySelector(".tile-bar");
        if (barEl && tile.color) {
            if (houses > maxH) {
                barEl.innerText = "🏨 HOTEL";
                barEl.style.background = "#dc2626";
            } else if (houses > 0) {
                barEl.innerText = "🏠".repeat(houses);
            } else {
                barEl.innerText = "";
            }
        }

        // Dodanie dymku tooltipa, jeśli go jeszcze nie ma
        let tooltipEl = tileEl.querySelector(".tile-tooltip");
        if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.className = "tile-tooltip";
            tileEl.appendChild(tooltipEl);
        }
        tooltipEl.innerHTML = getTileTooltipHTML(tile, pState);
    });
};

renderRichupScreen = renderCleanScreen;

// Zwiększenie limitu domków w logice budowania do wartości z suwaka
const oldCanBuild = canBuildHouseHere;
canBuildHouseHere = function(playerId, targetIdx, boardData) {
    const pState = roomState.props[targetIdx];
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
    if (pState && (pState.houses || 0) > maxH) return false; // Nie można budować powyżej hotelu
    return oldCanBuild(playerId, targetIdx, boardData);
};

// Zbalansowany tooltip po najechaniu myszką (wyświetla realne, oryginalne stawki)
getTileTooltipHTML = function(tile, propState) {
    if (tile.type !== "prop" && tile.type !== "station" && tile.type !== "utility") {
        return `<div class="tooltip-title">${tile.name}</div><div>Pole specjalne</div>`;
    }

    const price = tile.price || 100;
    const baseRent = tile.rent || 10;
    const houseCost = tile.house || 50;
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    let html = `<div class="tooltip-title">${tile.name}</div>`;
    html += `<div class="tooltip-row"><span>Cena zakupu:</span><strong>${price}$</strong></div>`;
    html += `<div class="tooltip-row"><span>Cena domku:</span><strong>${houseCost}$</strong></div>`;
    html += `<div class="tooltip-row" style="border-top:1px solid #3b3354; margin-top:3px; padding-top:3px;"><span>Czynsz bazowy:</span><strong>${baseRent}$</strong></div>`;

    for (let h = 1; h <= maxH; h++) {
        const r = baseRent * RENT_MULTIPLIERS[h];
        html += `<div class="tooltip-row"><span>${h} ${h === 1 ? 'domek' : 'domki'}:</span><strong>${r}$</strong></div>`;
    }
    const hotelRent = baseRent * RENT_MULTIPLIERS[maxH + 1];
    html += `<div class="tooltip-row" style="color:#fde047;"><span>Hotel (👑):</span><strong>${hotelRent}$</strong></div>`;

    if (propState) {
        const owner = roomState.players[propState.owner];
        const hCnt = propState.houses || 0;
        const statusStr = hCnt > maxH ? "Hotel 🏨" : (hCnt === 0 ? "Brak zabudowy" : `${hCnt} domki 🏠`);
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:${owner?.color || '#fff'}">Właściciel: ${owner?.nick || ' Bank'} (${statusStr})</div>`;
    }

    return html;
};

// =====================================================
// DOKŁADNY BALANS ZGODNY Z WYTYCZNYMI + ORYGINALNE NAZWY RSL
// Wklej na sam dół pliku script.js!
// =====================================================

const EXACT_BALANCED_MAP_40 = [
    { name: "START", type: "start", icon: "🏁" },
    // Brązowe / Fioletowe (2 pola)
    { name: "Orzegów", type: "prop", price: 60, rentSet: [2, 10, 30, 90, 160, 250], house: 50, color: "#854d0e", group: 1 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Godula", type: "prop", price: 60, rentSet: [4, 20, 60, 180, 320, 450], house: 50, color: "#854d0e", group: 1 },
    { name: "Podatek dochodowy", type: "tax", amount: 200, icon: "💸" },
    // Stacja 1
    { name: "Dworzec Chebzie", type: "station", price: 200, color: "#38bdf8", group: 9, icon: "✈️" },
    // Jasnoniebieskie (3 pola)
    { name: "Chebzie", type: "prop", price: 100, rentSet: [6, 30, 90, 270, 400, 550], house: 50, color: "#0ea5e9", group: 2 },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    { name: "Ruda Południowa", type: "prop", price: 100, rentSet: [6, 30, 90, 270, 400, 550], house: 50, color: "#0ea5e9", group: 2 },
    { name: "Ruda 1", type: "prop", price: 120, rentSet: [8, 40, 100, 300, 450, 600], house: 50, color: "#0ea5e9", group: 2 },
    
    { name: "Więzienie (Izba)", type: "jail", icon: "⛓️" },
    // Różowe (3 pola)
    { name: "Kuźnica", type: "prop", price: 140, rentSet: [10, 50, 150, 450, 625, 750], house: 100, color: "#ec4899", group: 3 },
    { name: "Elektrownia RSL", type: "utility", price: 150, color: "#94a3b8", group: 10, icon: "⚡" },
    { name: "Czarny Las", type: "prop", price: 140, rentSet: [10, 50, 150, 450, 625, 750], house: 100, color: "#ec4899", group: 3 },
    { name: "Bielszowice", type: "prop", price: 160, rentSet: [12, 60, 180, 500, 700, 900], house: 100, color: "#ec4899", group: 3 },
    // Stacja 2
    { name: "Lotnisko Muchowiec", type: "station", price: 200, color: "#38bdf8", group: 9, icon: "✈️" },
    // Pomarańczowe (3 pola)
    { name: "Kokota", type: "prop", price: 180, rentSet: [14, 70, 200, 550, 750, 950], house: 100, color: "#f97316", group: 4 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Bykowina Targ", type: "prop", price: 180, rentSet: [14, 70, 200, 550, 750, 950], house: 100, color: "#f97316", group: 4 },
    { name: "Bykowina", type: "prop", price: 200, rent: [16, 80, 220, 600, 800, 1000], house: 100, color: "#f97316", group: 4 },
    
    { name: "Wakacje (Burloch)", type: "parking", icon: "🏖️" },
    // Czerwone (3 pola)
    { name: "Wirek", type: "prop", price: 220, rentSet: [18, 90, 250, 700, 875, 1050], house: 150, color: "#ef4444", group: 5 },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    { name: "Targowisko Wirek", type: "prop", price: 220, rentSet: [18, 90, 250, 700, 875, 1050], house: 150, color: "#ef4444", group: 5 },
    { name: "CH Plaza Ruda", type: "prop", price: 240, rentSet: [20, 100, 300, 750, 925, 1100], house: 150, color: "#ef4444", group: 5 },
    // Stacja 3
    { name: "Węzeł DTŚ Ruda", type: "station", price: 200, color: "#38bdf8", group: 9, icon: "✈️" },
    // Żółte (3 pola)
    { name: "Kochłowice Planty", type: "prop", price: 260, rentSet: [22, 110, 330, 800, 975, 1150], house: 150, color: "#eab308", group: 6 },
    { name: "Kochłowice Rynek", type: "prop", price: 260, rentSet: [22, 110, 330, 800, 975, 1150], house: 150, color: "#eab308", group: 6 },
    { name: "Wodociągi PWiK", type: "utility", price: 150, color: "#94a3b8", group: 10, icon: "💧" },
    { name: "Radoszowy", type: "prop", price: 280, rentSet: [24, 120, 360, 850, 1025, 1200], house: 150, color: "#eab308", group: 6 },
    
    { name: "Idź do Więzienia!", type: "gotojail", icon: "🚔" },
    // Zielone (3 pola)
    { name: "Kłodnica", type: "prop", price: 300, rentSet: [26, 130, 390, 900, 1100, 1275], house: 200, color: "#22c55e", group: 7 },
    { name: "Halemba Pętla", type: "prop", price: 300, rentSet: [26, 130, 390, 900, 1100, 1275], house: 200, color: "#22c55e", group: 7 },
    { name: "Skarb Śląski", type: "chest", icon: "📦" },
    { name: "Aquadrom Halemba", type: "prop", price: 320, rentSet: [28, 150, 450, 1000, 1200, 1400], house: 200, color: "#22c55e", group: 7 },
    // Stacja 4
    { name: "Autostrada A4", type: "station", price: 200, color: "#38bdf8", group: 9, icon: "✈️" },
    { name: "Niespodzianka", type: "chance", icon: "❓" },
    // Granatowe / Niebieskie (2 pola)
    { name: "Fryna (Nowy Bytom)", type: "prop", price: 350, rentSet: [35, 175, 500, 1100, 1300, 1500], house: 200, color: "#3b82f6", group: 8 },
    { name: "Podatek Luksusowy", type: "tax", amount: 100, icon: "💍" },
    { name: "Nowy Bytom Ratusz", type: "prop", price: 400, rentSet: [50, 200, 600, 1400, 1700, 2000], house: 200, color: "#3b82f6", group: 8 }
];

MAP_40.length = 0;
EXACT_BALANCED_MAP_40.forEach(t => MAP_40.push(t));

// Obsługa obliczania czynszu dla stacji (samolotów), mediów (elektrownia/wodociągi) oraz domków/hoteli
processLanding = function(player, tile, posIdx, boardData) {
    if (!roomState.props) roomState.props = {};
    const pState = roomState.props[posIdx];

    if (pState && pState.owner !== player.id) {
        const owner = roomState.players[pState.owner];
        if (owner && !owner.bankrupt) {
            if (roomState.settings.noPrisonRent && owner.inJail > 0) {
                return `Właściciel w więzieniu – brak czynszu!`;
            }

            let finalRent = 0;

            // 1. Stacje / Samoloty (4 stacje: 50, 150, 250, 400)
            if (tile.type === "station") {
                const stationIndices = boardData.map((t, i) => t.type === "station" ? i : -1).filter(i => i !== -1);
                const ownerStationsCount = stationIndices.filter(i => roomState.props[i]?.owner === owner.id).length;
                const stationTable = [0, 50, 150, 250, 400];
                finalRent = stationTable[Math.min(ownerStationsCount, 4)] || 50;
            } 
            // 2. Media: Elektrownia / Wodociągi (1 sztuka = rzut x5, 2 sztuki = rzut x10)
            else if (tile.type === "utility") {
                const utilityIndices = boardData.map((t, i) => t.type === "utility" ? i : -1).filter(i => i !== -1);
                const ownerUtilityCount = utilityIndices.filter(i => roomState.props[i]?.owner === owner.id).length;
                const diceSum = (roomState.dice ? roomState.dice[0] + roomState.dice[1] : 7);
                const multiplier = (ownerUtilityCount >= 2) ? 10 : 5;
                finalRent = diceSum * multiplier;
            } 
            // 3. Zwykłe ulice i miasta (zależnie od domków / hotelu)
            else if (tile.type === "prop" && tile.rentSet) {
                const houses = pState.houses || 0;
                const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

                if (houses === 0) {
                    finalRent = tile.rentSet[0];
                    const grpIndices = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
                    const hasFullSet = grpIndices.every(i => roomState.props[i]?.owner === owner.id);
                    if (hasFullSet && roomState.settings.doubleRent) {
                        finalRent *= 2;
                    }
                } else {
                    // Indeks w tabeli: 1 domek = index 1, ..., 4 domki = index 4, Hotel = index 5
                    const tableIdx = houses > maxH ? 5 : Math.min(houses, 4);
                    finalRent = tile.rentSet[tableIdx] || tile.rentSet[1];
                }
            }

            player.cash -= finalRent;
            owner.cash += finalRent;
            return `Płaci ${finalRent}$ czynszu dla ${owner.nick}!`;
        }
    }
    return origProcessLanding(player, tile, posIdx, boardData);
};

// Tooltip po najechaniu myszką pokazujący dokładny cennik z tabeli
getTileTooltipHTML = function(tile, propState) {
    if (tile.type === "station") {
        return `<div class="tooltip-title">${tile.name} (Stacja)</div><div class="tooltip-row"><span>1 stacja:</span><strong>50$</strong></div><div class="tooltip-row"><span>2 stacje:</span><strong>150$</strong></div><div class="tooltip-row"><span>3 stacje:</span><strong>250$</strong></div><div class="tooltip-row"><span>4 stacje:</span><strong>400$</strong></div>`;
    }
    if (tile.type === "utility") {
        return `<div class="tooltip-title">${tile.name} (Media)</div><div style="font-size:10.5px; color:#94a3b8; margin-top:3px;">Czynsz = Rzut kośćmi $\times 5$ (lub $\times 10$ przy dwóch mediach).</div>`;
    }
    if (tile.type !== "prop") {
        return `<div class="tooltip-title">${tile.name}</div><div>Pole specjalne</div>`;
    }

    const price = tile.price || 100;
    const houseCost = tile.house || 50;
    const r = tile.rentSet || [10, 50, 150, 450, 625, 750];

    let html = `<div class="tooltip-title">${tile.name}</div>`;
    html += `<div class="tooltip-row"><span>Cena zakupu:</span><strong>${price}$</strong></div>`;
    html += `<div class="tooltip-row"><span>Cena domku:</span><strong>${houseCost}$</strong></div>`;
    html += `<div class="tooltip-row" style="border-top:1px solid #3b3354; margin-top:3px; padding-top:3px;"><span>Czynsz bazowy:</span><strong>${r[0]}$</strong></div>`;
    html += `<div class="tooltip-row"><span>1 domek:</span><strong>${r[1]}$</strong></div>`;
    html += `<div class="tooltip-row"><span>2 domki:</span><strong>${r[2]}$</strong></div>`;
    html += `<div class="tooltip-row"><span>3 domki:</span><strong>${r[3]}$</strong></div>`;
    html += `<div class="tooltip-row"><span>4 domki:</span><strong>${r[4]}$</strong></div>`;
    html += `<div class="tooltip-row" style="color:#fde047;"><span>Hotel (👑):</span><strong>${r[5]}$</strong></div>`;

    if (propState) {
        const owner = roomState.players[propState.owner];
        const hCnt = propState.houses || 0;
        const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
        const statusStr = hCnt > maxH ? "Hotel 🏨" : (hCnt === 0 ? "Brak zabudowy" : `${hCnt} domki 🏠`);
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:${owner?.color || '#fff'}">Właściciel: ${owner?.nick || 'Bank'} (${statusStr})</div>`;
    }

    return html;
};
