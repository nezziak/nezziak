// TWÓJ LINK DO BAZY FIREBASE:
const FIREBASE_URL = "https://nezziak-b8c63-default-rtdb.europe-west1.firebasedatabase.app/";

// STAŁE DANE GRACZA (ZAPISYWANE W PRZEGLĄDARCE)
let myId = localStorage.getItem("rsl_uid") || ("p_" + Math.floor(Math.random() * 900000 + 100000));
localStorage.setItem("rsl_uid", myId);

let myNick = localStorage.getItem("rsl_nick") || ("Hanys_" + Math.floor(Math.random() * 90 + 10));
let myColor = localStorage.getItem("rsl_color") || "#f59e0b";

// OSOBNY BALANS KASYNOWY
let casinoBalance = parseInt(localStorage.getItem("rsl_casino_cash")) || 1000;

let currentRoom = "";
let roomState = null;
let pollTimer = null;
let isInLobbyRoom = false;
let isSavingNow = false;
let botTurnInProgress = false;
let lastSeenDiceRollId = 0;
let lastRenderedHistorySignature = "";

// Zmienne animacji skakania pionków
let visualPositions = {};
let animTimers = {};
let isHoppingMap = {};

// =====================================================
// ZBALANSOWANA PLANSZA 40 PÓL (RUDA ŚLĄSKA - KLASYCZNY BALANS MONOPOLY)
// =====================================================
const MAP_40 = [
    { name: "START", type: "start", icon: "🏁" },
    // Brązowe (2 pola)
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
    { name: "Bykowina", type: "prop", price: 200, rentSet: [16, 80, 220, 600, 800, 1000], house: 100, color: "#f97316", group: 4 },

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
    // Granatowe (2 pola)
    { name: "Fryna (Nowy Bytom)", type: "prop", price: 350, rentSet: [35, 175, 500, 1100, 1300, 1500], house: 200, color: "#3b82f6", group: 8 },
    { name: "Podatek Luksusowy", type: "tax", amount: 100, icon: "💍" },
    { name: "Nowy Bytom Ratusz", type: "prop", price: 400, rentSet: [50, 200, 600, 1400, 1700, 2000], house: 200, color: "#3b82f6", group: 8 }
];

// GENEROWANIE MAPY 60 PÓL (+50% WIĘKSZA - SIATKA 16x16)
const MAP_60 = [];
for (let i = 0; i < 60; i++) {
    if (i === 0) MAP_60.push({ name: "START", type: "start", icon: "🏁" });
    else if (i === 15) MAP_60.push({ name: "Więzienie", type: "jail", icon: "⛓️" });
    else if (i === 30) MAP_60.push({ name: "Wakacje", type: "parking", icon: "🏖️" });
    else if (i === 45) MAP_60.push({ name: "Idź do Więzienia!", type: "gotojail", icon: "🚔" });
    else if (i % 15 === 7) MAP_60.push({ name: "Lotnisko RSL #" + Math.ceil(i/15), type: "station", price: 200, color: "#38bdf8", group: 9, icon: "✈️" });
    else {
        const base = MAP_40[i % MAP_40.length];
        if (base.type === "prop") {
            const grp = Math.floor(i / 5) + 1;
            const cols = ["#854d0e","#0ea5e9","#ec4899","#f97316","#ef4444","#eab308","#22c55e","#3b82f6","#a855f7","#14b8a6","#e11d48","#6366f1"];
            MAP_60.push({
                name: base.name + (i > 39 ? " II" : ""),
                type: "prop",
                price: base.price || (60 + i * 5),
                rentSet: base.rentSet || [10, 50, 150, 450, 625, 750],
                house: base.house || 100,
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

    drawStaticPreviewBoard();
    leaveCurrentLobby(true);
    loadPublicRoomsList();
    initLudoLocal();
    liarInit();
    init8x8('checkers');
};

function drawStaticPreviewBoard() {
    const boardEl = document.getElementById("monopoly-board");
    if (!boardEl) return;
    const gridN = 11;
    const sideLen = 10;
    boardEl.style.gridTemplateColumns = `repeat(${gridN}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${gridN}, 1fr)`;
    const innerCenter = boardEl.querySelector(".board-inner-center");
    if (innerCenter) {
        innerCenter.style.gridColumn = `2 / ${gridN}`;
        innerCenter.style.gridRow = `2 / ${gridN}`;
    }
    boardEl.querySelectorAll(".m-tile").forEach(t => t.remove());
    MAP_40.forEach((tile, idx) => {
        const pos = getPerimeterPos(idx, gridN);
        const div = document.createElement("div");
        div.className = "m-tile";
        if (idx % sideLen === 0) div.classList.add("corner");
        if (tile.type === "station") div.classList.add("airport");
        div.style.gridRow = pos.r;
        div.style.gridColumn = pos.c;
        div.innerHTML = `
            ${tile.color ? `<div class="tile-bar" style="background:${tile.color}"></div>` : `<div></div>`}
            ${tile.icon ? `<div class="tile-icon">${tile.icon}</div>` : ``}
            <div class="tile-title">${tile.name}</div>
            ${tile.price ? `<div class="tile-price">${tile.price}$</div>` : `<div></div>`}
            <div class="tile-owner"></div>
            <div class="tile-pawns"></div>
            <div class="tile-tooltip">${getTileTooltipHTML(tile, null, idx, MAP_40)}</div>
        `;
        boardEl.appendChild(div);
    });
}

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
// SYSTEM LOBBY (STWÓRZ / DOŁĄCZ / WYJDŹ) I SYNCHRONIZACJA FIREBASE
// =====================================================
function toggleJoinInputBox() {
    const box = document.getElementById("join-friend-box");
    if (box) {
        box.classList.toggle("hidden");
        const inp = document.getElementById("friend-code-input");
        if (inp && !box.classList.contains("hidden")) inp.focus();
    }
}

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

function copyRoomCode() {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom);
    alert("Skopiowano kod pokoju: " + currentRoom);
}

async function createNewLobbyRoom() {
    updateMyProfile();
    const randomCode = "RSL" + Math.floor(Math.random() * 900 + 100);
    currentRoom = randomCode;

    const startCash = parseInt(document.getElementById("rule-start-cash")?.value) || 1500;
    visualPositions = {};
    isHoppingMap = {};

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

async function joinFriendLobbyByCode() {
    updateMyProfile();
    const inp = document.getElementById("friend-code-input");
    const code = inp ? inp.value.trim().toUpperCase() : "";

    if (!code) {
        alert("Wpisz najpierw kod lobby od swojego znajomego!");
        return;
    }

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

    await joinRoomNow(code);
}

async function joinRoomNow(roomCode) {
    currentRoom = roomCode;
    isInLobbyRoom = true;
    setLobbyUIState(true, currentRoom);
    visualPositions = {};
    isHoppingMap = {};

    const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
    let data = await res.json();

    if (!data) {
        data = {
            status: "lobby",
            hostId: myId,
            visibility: "public",
            turnIdx: 0,
            rolledThisTurn: false,
            housesThisTurn: 0,
            pot: 0,
            dice: [5, 3],
            lastLog: "Pokój gotowy! Ustaw zasady po prawej i kliknij Rozpocznij Grę.",
            historyLogs: [],
            settings: readSettingsFromDOM(),
            players: {},
            props: {},
            chat: []
        };
    }

    if (!data.players) data.players = {};
    const startCash = data.settings?.startCash || 1500;
    const isNewJoin = !data.players[myId];

    if (isNewJoin) {
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
            orderNum: Object.keys(data.players).length + 1,
            joinedAt: Date.now()
        };
    } else {
        data.players[myId].nick = myNick;
        data.players[myId].color = myColor;
    }

    roomState = data;
    if (isNewJoin && Object.keys(data.players).length > 1) {
        addHistoryEntry(`👋 <strong>${myNick}</strong> dołączył(a) do lobby!`, myColor);
    }

    await pushState(roomState);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchRoomUpdate, 1100);
}

async function leaveCurrentLobby(silent = false) {
    if (!silent && roomState && roomState.players && roomState.players[myId] && currentRoom) {
        delete roomState.players[myId];
        await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
            method: "PUT",
            body: JSON.stringify(roomState)
        });
    }

    if (pollTimer) clearInterval(pollTimer);
    Object.values(animTimers).forEach(t => clearInterval(t));
    animTimers = {};
    visualPositions = {};
    isHoppingMap = {};

    isInLobbyRoom = false;
    roomState = null;
    currentRoom = "";
    setLobbyUIState(false, "");

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

async function fetchRoomUpdate() {
    if (isSavingNow || !currentRoom) return;
    try {
        const res = await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`);
        const data = await res.json();
        if (data) {
            if (roomState && roomState.players && roomState.players[myId] && (!data.players || !data.players[myId])) {
                clearInterval(pollTimer);
                roomState = null;
                alert("🥾 Zostałeś wyrzucony z pokoju przez Hosta!");
                await leaveCurrentLobby(true);
                return;
            }
            roomState = data;
            renderRichupScreen();
        }
    } catch (e) {}
}

async function pushState(customData = null) {
    if (customData) roomState = customData;
    if (!roomState || !currentRoom) return;
    isSavingNow = true;
    try {
        await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
            method: "PUT",
            body: JSON.stringify(roomState)
        });
    } catch (e) {
        console.error("Błąd zapisu Firebase:", e);
    }
    isSavingNow = false;
    renderRichupScreen();
}

async function loadPublicRoomsList() {
    setInterval(async () => {
        try {
            const res = await fetch(`${FIREBASE_URL}richup_rooms.json`);
            const all = await res.json();
            const box = document.getElementById("public-rooms-list");
            if (!box) return;
            if (!all) { box.innerText = "Brak otwartych pokoi"; return; }
            const pubCodes = Object.keys(all).filter(code => all[code]?.visibility !== "private" && all[code]?.players);
            box.innerHTML = pubCodes.length > 0
                ? pubCodes.map(c => `<span class="room-pill" onclick="joinRoomNow('${c}')">${c} (${Object.keys(all[c].players||{}).length})</span>`).join('')
                : "Brak otwartych pokoi";
        } catch(e) {}
    }, 3500);
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
        mapSize: document.getElementById("rule-map-size")?.value || "40",
        houseMode: document.getElementById("rule-house-mode")?.value || "stand_monopoly_3_even",
        maxHousesBeforeHotel: parseInt(document.getElementById("rule-max-houses")?.value) || 4,
        startCash: parseInt(document.getElementById("rule-start-cash")?.value) || 1500,
        doubleRent: document.getElementById("rule-double-rent")?.checked ?? true,
        vacationCash: document.getElementById("rule-vacation-cash")?.checked ?? true,
        noPrisonRent: document.getElementById("rule-no-prison-rent")?.checked ?? false,
        mortgage: document.getElementById("rule-mortgage")?.checked ?? true,
        maxDoubles: parseInt(document.getElementById("rule-max-doubles")?.value) || 3,
        randomOrder: document.getElementById("rule-random-order")?.checked ?? true
    };
}

function applySettingsToDOM(s) {
    if (!s) return;
    if (document.getElementById("rule-map-size")) document.getElementById("rule-map-size").value = s.mapSize || "40";
    if (document.getElementById("rule-house-mode")) document.getElementById("rule-house-mode").value = s.houseMode || "stand_monopoly_3_even";
    if (document.getElementById("rule-max-houses")) document.getElementById("rule-max-houses").value = s.maxHousesBeforeHotel || 4;
    if (document.getElementById("rule-start-cash")) document.getElementById("rule-start-cash").value = s.startCash || 1500;
    if (document.getElementById("rule-double-rent")) document.getElementById("rule-double-rent").checked = !!s.doubleRent;
    if (document.getElementById("rule-vacation-cash")) document.getElementById("rule-vacation-cash").checked = !!s.vacationCash;
    if (document.getElementById("rule-no-prison-rent")) document.getElementById("rule-no-prison-rent").checked = !!s.noPrisonRent;
    if (document.getElementById("rule-mortgage")) document.getElementById("rule-mortgage").checked = !!s.mortgage;
    if (document.getElementById("rule-max-doubles")) document.getElementById("rule-max-doubles").value = s.maxDoubles || 3;
    if (document.getElementById("rule-random-order")) document.getElementById("rule-random-order").checked = !!s.randomOrder;
}

async function updateSettingsFromUI() {
    if (!roomState || roomState.status === "playing") return;
    roomState.visibility = document.getElementById("room-visibility")?.value || "public";
    roomState.settings = readSettingsFromDOM();
    Object.values(roomState.players || {}).forEach(p => {
        p.cash = roomState.settings.startCash;
    });
    await pushState();
}

// =====================================================
// FUNKCJE POMOCNICZE GRACZY, HISTORII I ANIMACJI KOSTEK
// =====================================================
function getOrderedPlayers() {
    if (!roomState || !roomState.players) return [];
    return Object.values(roomState.players).sort((a, b) => {
        if ((a.orderNum || 0) !== (b.orderNum || 0)) {
            return (a.orderNum || 0) - (b.orderNum || 0);
        }
        if ((a.joinedAt || 0) !== (b.joinedAt || 0)) {
            return (a.joinedAt || 0) - (b.joinedAt || 0);
        }
        return a.id.localeCompare(b.id);
    });
}

function getActivePlayers() {
    return getOrderedPlayers().filter(p => !p.bankrupt);
}

function getCurrentBoard() {
    return (roomState?.settings?.mapSize === "60") ? MAP_60 : MAP_40;
}

function isMeRoomHost() {
    if (!roomState) return false;
    const allP = getOrderedPlayers();
    return (roomState.hostId === myId) || (allP[0]?.id === myId);
}

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

    if (roomState.historyLogs.length > 25) {
        roomState.historyLogs.pop();
    }
    roomState.lastLog = text;
}

function triggerDiceSpinAnimation(finalD1, finalD2) {
    const box1 = document.getElementById("die-box-1");
    const box2 = document.getElementById("die-box-2");
    if (!box1 || !box2) return;

    const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    box1.classList.remove("die-rolling");
    box2.classList.remove("die-rolling");
    void box1.offsetWidth;
    box1.classList.add("die-rolling");
    box2.classList.add("die-rolling");

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

// =====================================================
// DODAWANIE BOTA, START GRY, RESET I WYRZUCANIE (KICK)
// =====================================================
async function addBotPlayer() {
    if (!isInLobbyRoom || !roomState) {
        alert("Najpierw kliknij '➕ Stwórz własne Lobby' po lewej stronie, żeby móc dodawać Boty i znajomych!");
        return;
    }
    const pArr = Object.values(roomState.players || {});
    if (pArr.length >= 10) { alert("Max 10 graczy!"); return; }
    const bId = "bot_" + Math.floor(Math.random() * 9999);
    const colors = ["#ef4444", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#14b8a6"];
    const botNick = "Bot_" + (pArr.length + 1);
    const botColor = colors[pArr.length % colors.length];

    roomState.players[bId] = {
        id: bId,
        nick: botNick,
        color: botColor,
        pos: 0,
        cash: roomState.settings?.startCash || 1500,
        inJail: 0,
        doubles: 0,
        bankrupt: false,
        isBot: true,
        orderNum: pArr.length + 1,
        joinedAt: Date.now()
    };
    addHistoryEntry(`🤖 Dodano gracza komputerowego: <strong>${botNick}</strong>.`, botColor);
    await pushState();
}

async function hostStartGame() {
    if (!isInLobbyRoom || !roomState) {
        alert("Najpierw kliknij '➕ Stwórz własne Lobby' lub '🔑 Dołącz do znajomego' po lewej stronie!");
        return;
    }
    let pArr = Object.values(roomState.players || {});
    if (pArr.length < 2) {
        alert("Dodaj przynajmniej 1 znajomego albo kliknij '+ 🤖 Bot' po prawej stronie!");
        return;
    }

    if (roomState.settings && roomState.settings.randomOrder) {
        pArr.sort(() => Math.random() - 0.5);
    }

    Object.values(animTimers).forEach(t => clearInterval(t));
    animTimers = {};
    visualPositions = {};
    isHoppingMap = {};

    roomState.status = "playing";
    roomState.turnIdx = 0;
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.pot = 0;
    roomState.props = {};
    roomState.historyLogs = [];

    pArr.forEach((p, index) => {
        p.orderNum = index + 1;
        p.pos = 0;
        p.cash = roomState.settings.startCash;
        p.bankrupt = false;
        p.inJail = 0;
        p.doubles = 0;
    });

    const firstP = getActivePlayers()[0];
    addHistoryEntry(`🚀 Rozgrywka wystartowała! Jako pierwszy rzuca <strong>${firstP.nick}</strong>.`, firstP.color);
    botTurnInProgress = false;
    await pushState();
}

async function resetToLobbySettings() {
    if (!roomState) return;
    if (!isMeRoomHost()) {
        alert("Tylko Host 👑 pokoju może zresetować grę do ustawień!");
        return;
    }

    botTurnInProgress = false;
    Object.values(animTimers).forEach(t => clearInterval(t));
    animTimers = {};
    visualPositions = {};
    isHoppingMap = {};

    roomState.status = "lobby";
    roomState.turnIdx = 0;
    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.pot = 0;
    roomState.props = {};
    roomState.historyLogs = [];

    getOrderedPlayers().forEach(p => {
        p.pos = 0;
        p.cash = roomState.settings.startCash;
        p.bankrupt = false;
        p.inJail = 0;
        p.doubles = 0;
    });

    roomState.lastLog = "🔄 Zresetowano do Lobby! Możesz teraz zmienić ustawienia po prawej i kliknąć Rozpocznij Grę.";
    await pushState();
}

async function hostKickPlayer(targetId) {
    if (!roomState || !isMeRoomHost()) {
        alert("Tylko Host 👑 może wyrzucać graczy!");
        return;
    }
    if (targetId === myId) return;

    const target = roomState.players ? roomState.players[targetId] : null;
    if (!target) return;

    if (!confirm(`Czy na pewno chcesz wyrzucić "${target.nick}" z pokoju i ze wszystkich gier?`)) return;

    const kickedNick = target.nick;

    if (roomState.props) {
        Object.keys(roomState.props).forEach(posKey => {
            if (roomState.props[posKey].owner === targetId) {
                delete roomState.props[posKey];
            }
        });
    }

    if (roomState.ludoOnline && roomState.ludoOnline.pawns) {
        delete roomState.ludoOnline.pawns[targetId];
    }

    if (roomState.liarOnline) {
        if (roomState.liarOnline.hands) delete roomState.liarOnline.hands[targetId];
        if (roomState.liarOnline.shots) delete roomState.liarOnline.shots[targetId];
        if (roomState.liarOnline.dead) delete roomState.liarOnline.dead[targetId];
        if (roomState.liarOnline.lastPlay && roomState.liarOnline.lastPlay.pid === targetId) {
            roomState.liarOnline.lastPlay = null;
        }
    }

    delete roomState.players[targetId];

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

    addHistoryEntry(`🥾 Host (${myNick}) wyrzucił gracza <strong>${kickedNick}</strong> z pokoju!`, "#ef4444");
    await pushState();
}

// =====================================================
// MECHANIKA MONOPOLY: RZUT KOSTKĄ, RUCH, ZAKUP Z POLA, DOMKI, CZYNSZE
// =====================================================
async function rollDiceNow() {
    if (!roomState || roomState.status !== "playing") {
        alert("Najpierw kliknij '▶️ Rozpocznij Grę' na środku planszy (wymaganych min. 2 graczy/boty)!");
        return;
    }
    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) return;

    const currIdx = roomState.turnIdx % activePlayers.length;
    const currP = activePlayers[currIdx];

    if (!currP || currP.id !== myId) {
        alert(`Teraz jest kolej gracza: ${currP?.nick || 'Inny gracz'}!`);
        return;
    }
    if (roomState.rolledThisTurn) {
        alert("W tej turze już rzuciłeś kostką! Najedź na pole na planszy, aby kupić działkę/domek lub kliknij '⏭️ Koniec tury'.");
        return;
    }

    const playerObj = roomState.players[currP.id];
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    lastSeenDiceRollId = roomState.diceRollId;
    roomState.rolledThisTurn = true;
    roomState.housesThisTurn = 0;

    triggerDiceSpinAnimation(d1, d2);

    const boardData = getCurrentBoard();

    if (d1 === d2) {
        playerObj.doubles = (playerObj.doubles || 0) + 1;
        if (playerObj.doubles >= (roomState.settings?.maxDoubles || 3)) {
            const jailIdx = boardData.findIndex(t => t.type === "jail");
            playerObj.pos = jailIdx >= 0 ? jailIdx : 10;
            playerObj.inJail = 1;
            playerObj.doubles = 0;
            addHistoryEntry(`🚔 <strong>${playerObj.nick}</strong> wyrzuca ${d1}+${d2} (limit dubli) i trafia do Więzienia!`, playerObj.color);
            await pushState();
            return;
        }
    } else {
        playerObj.doubles = 0;
    }

    const oldPos = Number(playerObj.pos) || 0;
    const newPos = (oldPos + sum) % boardData.length;
    playerObj.pos = newPos;

    let passMsg = "";
    if (newPos < oldPos) {
        playerObj.cash = (Number(playerObj.cash) || 0) + 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[newPos];
    const landResult = processLanding(playerObj, tile, newPos, boardData);

    addHistoryEntry(
        `🎲 <strong>${playerObj.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ staje na <strong>${tile.name}</strong>. ${landResult}`,
        playerObj.color
    );

    if (playerObj.cash < 0) {
        await declareBankrupt(playerObj.id);
        return;
    }

    await pushState();
}

function processLanding(player, tile, posIdx, boardData) {
    if (!roomState.props) roomState.props = {};
    const pState = roomState.props[posIdx];

    if (tile.type === "tax") {
        player.cash -= tile.amount;
        if (roomState.settings?.vacationCash) roomState.pot = (roomState.pot || 0) + tile.amount;
        return `Płaci ${tile.name} (-${tile.amount}$).`;
    }
    if (tile.type === "parking") {
        if (roomState.settings?.vacationCash && roomState.pot > 0) {
            const won = roomState.pot;
            player.cash += won;
            roomState.pot = 0;
            return `Zgarnia pulę z Wakacji na Burlochu: +${won}$! 🎉`;
        }
        return `Odpoczywa na Burloch Arenie.`;
    }
    if (tile.type === "gotojail") {
        const jailIdx = boardData.findIndex(t => t.type === "jail");
        player.pos = jailIdx >= 0 ? jailIdx : 10;
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
                if (roomState.settings?.noPrisonRent && owner.inJail > 0) {
                    return `Właściciel (${owner.nick}) siedzi w więzieniu – brak czynszu!`;
                }

                let finalRent = 0;

                if (tile.type === "station") {
                    const stationIndices = boardData.map((t, i) => t.type === "station" ? i : -1).filter(i => i !== -1);
                    const ownerStationsCount = stationIndices.filter(i => roomState.props[i]?.owner === owner.id).length;
                    const stationTable = [0, 50, 150, 250, 400];
                    finalRent = stationTable[Math.min(ownerStationsCount, 4)] || 50;
                } else if (tile.type === "utility") {
                    const utilityIndices = boardData.map((t, i) => t.type === "utility" ? i : -1).filter(i => i !== -1);
                    const ownerUtilityCount = utilityIndices.filter(i => roomState.props[i]?.owner === owner.id).length;
                    const diceSum = (roomState.dice ? roomState.dice[0] + roomState.dice[1] : 7);
                    const multiplier = (ownerUtilityCount >= 2) ? 10 : 5;
                    finalRent = diceSum * multiplier;
                } else if (tile.type === "prop") {
                    const rSet = tile.rentSet || [10, 50, 150, 450, 625, 750];
                    const houses = pState.houses || 0;
                    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

                    if (houses === 0) {
                        finalRent = rSet[0];
                        const grpIndices = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
                        const hasFullSet = grpIndices.every(i => roomState.props[i]?.owner === owner.id);
                        if (hasFullSet && roomState.settings?.doubleRent) {
                            finalRent *= 2;
                        }
                    } else {
                        const tableIdx = houses > maxH ? 5 : Math.min(houses, 4);
                        finalRent = rSet[tableIdx] || rSet[1];
                    }
                }

                player.cash -= finalRent;
                owner.cash += finalRent;
                return `Płaci <strong>${finalRent}$</strong> czynszu dla ${owner.nick}!`;
            }
        } else if (!pState) {
            return `Wolne pole (${tile.price}$) – najedź na pole na mapie, aby je kupić!`;
        }
    }

    return `Staje na polu ${tile.name}.`;
}

// KUPOWANIE POLA POPRZEZ KLIKNIĘCIE / NAJECHANIE NA KAFELEK PLANSZY
async function buyPropertyOnTile(targetIdx) {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];
    if (!currP || currP.id !== myId) {
        alert("Teraz nie jest Twoja tura!");
        return;
    }
    if (!roomState.rolledThisTurn) {
        alert("Najpierw rzuć kostką!");
        return;
    }

    const playerObj = roomState.players[myId];
    const currentPos = Number(playerObj.pos) || 0;
    if (currentPos !== targetIdx) {
        alert("Możesz kupić tylko to pole, na którym aktualnie stoi Twój pionek!");
        return;
    }

    const boardData = getCurrentBoard();
    const tile = boardData[targetIdx];
    if (!tile || (tile.type !== "prop" && tile.type !== "station" && tile.type !== "utility")) return;

    if (!roomState.props) roomState.props = {};
    if (roomState.props[targetIdx]) {
        alert("To pole ma już właściciela!");
        return;
    }
    if (playerObj.cash < tile.price) {
        alert("Nie masz wystarczająco gotówki na zakup tego pola!");
        return;
    }

    playerObj.cash -= tile.price;
    roomState.props[targetIdx] = { owner: myId, houses: 0 };

    addHistoryEntry(
        `💰 <strong>${playerObj.nick}</strong> kupuje dzielnicę <strong>${tile.name}</strong> za <strong>${tile.price}$</strong>!`,
        playerObj.color
    );
    await pushState();
}

async function buyCurrentProperty() {
    if (!roomState || !roomState.players?.[myId]) return;
    const pos = Number(roomState.players[myId].pos) || 0;
    await buyPropertyOnTile(pos);
}

function canBuildHouseHere(playerId, targetIdx, boardData) {
    const tile = boardData[targetIdx];
    const props = roomState.props || {};
    const pState = props[targetIdx];
    const player = roomState.players[playerId];
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    if (!tile || tile.type !== "prop" || !pState || pState.owner !== playerId || !player) return false;
    if ((pState.houses || 0) >= maxH + 1 || player.cash < (tile.house || 50)) return false;

    const mode = roomState.settings?.houseMode || "stand_monopoly_3_even";
    const builtThisTurn = roomState.housesThisTurn || 0;
    const currentTile = boardData[player.pos || 0];

    const grpIndices = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
    const hasFullState = grpIndices.every(i => props[i]?.owner === playerId);
    const minHouses = Math.min(...grpIndices.map(i => props[i]?.houses || 0));

    if (mode === "stand_monopoly_3_even") {
        if (!hasFullState) return false;
        if (!currentTile || currentTile.group !== tile.group) return false;
        if (builtThisTurn >= 3) return false;
        return (pState.houses || 0) === minHouses;
    }
    if (mode === "stand_single_no_set") {
        return (player.pos || 0) === targetIdx && builtThisTurn < 1;
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
    if (!currP) return;
    await buildHouseOnIndex(currP.pos || 0);
}

async function buildHouseOnIndex(idx) {
    const boardData = getCurrentBoard();
    if (!canBuildHouseHere(myId, idx, boardData)) {
        alert("Możesz postawić domek tylko zgodnie z wybranymi zasadami (np. całe państwo i równa rozbudowa)!");
        return;
    }
    const tile = boardData[idx];
    const me = roomState.players[myId];
    const cost = tile.house || 50;
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    me.cash -= cost;
    roomState.props[idx].houses = (roomState.props[idx].houses || 0) + 1;
    roomState.housesThisTurn = (roomState.housesThisTurn || 0) + 1;

    const hNow = roomState.props[idx].houses;
    const buildLabel = hNow > maxH ? "🏨 HOTEL" : `domek #${hNow} (🏠)`;

    addHistoryEntry(
        `🏠 <strong>${me.nick}</strong> stawia <strong>${buildLabel}</strong> na <strong>${tile.name}</strong> (-${cost}$)!`,
        me.color
    );
    await pushState();
}

// Bezpośrednie kliknięcie w kafelek na mapie (szybki zakup działki lub domku)
async function handleTileDirectClick(idx) {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];
    if (!currP || currP.id !== myId || !roomState.rolledThisTurn) return;

    const boardData = getCurrentBoard();
    const tile = boardData[idx];
    const pState = roomState.props?.[idx];
    const myPos = Number(currP.pos) || 0;

    // 1. Jeśli gracz stoi na tym wolnym polu i ma kasę -> kupuje pole
    if (!pState && myPos === idx && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && currP.cash >= tile.price) {
        await buyPropertyOnTile(idx);
        return;
    }
    // 2. Jeśli gracz może wybudować tu domek / hotel -> buduje domek
    if (canBuildHouseHere(myId, idx, boardData)) {
        await buildHouseOnIndex(idx);
    }
}

async function sellPropertyToBank(idx) {
    if (!roomState.settings?.mortgage) return;
    const boardData = getCurrentBoard();
    const tile = boardData[idx];
    const me = roomState.players[myId];
    const refund = Math.floor(tile.price / 2);
    me.cash += refund;
    delete roomState.props[idx];
    addHistoryEntry(`🏦 <strong>${me.nick}</strong> odsprzedaje ${tile.name} do banku za ${refund}$.`, me.color);
    await pushState();
}

async function nextTurnNow() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    if (!currP || currP.id !== myId) return;
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
        addHistoryEntry(`🏆 KONIEC GRY! Wygrywa <strong>${rem[0].nick}</strong>! Kliknij Reset do Ustawień, aby zagrać ponownie.`, rem[0].color);
    } else {
        roomState.rolledThisTurn = false;
        roomState.turnIdx = roomState.turnIdx % Math.max(1, rem.length);
        addHistoryEntry(`🏳️ <strong>${p.nick}</strong> bankrutuje i odpada z gry!`, "#ef4444");
    }
    await pushState();
}

async function runBotTurn(botObj) {
    if (botTurnInProgress || !roomState || roomState.status !== "playing") return;

    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) return;
    const currP = activePlayers[roomState.turnIdx % activePlayers.length];

    if (!currP || currP.id !== botObj.id || !currP.isBot) return;

    const bot = roomState.players[currP.id];
    if (!bot) return;

    botTurnInProgress = true;

    const boardData = getCurrentBoard();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    lastSeenDiceRollId = roomState.diceRollId;
    triggerDiceSpinAnimation(d1, d2);

    const oldPos = Number(bot.pos) || 0;
    const newPos = (oldPos + sum) % boardData.length;
    bot.pos = newPos;

    let passMsg = "";
    if (newPos < oldPos) {
        bot.cash = (Number(bot.cash) || 0) + 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[newPos];
    let actionDesc = processLanding(bot, tile, newPos, boardData);

    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
    if (!roomState.props) roomState.props = {};
    if ((tile.type === "prop" || tile.type === "station" || tile.type === "utility") && !roomState.props[newPos] && bot.cash >= tile.price + 80) {
        bot.cash -= tile.price;
        roomState.props[newPos] = { owner: bot.id, houses: 0 };
        actionDesc += ` 💰 Kupuje <strong>${tile.name}</strong> (${tile.price}$)!`;
    } else if (tile.type === "prop" && roomState.props[newPos]?.owner === bot.id && (roomState.props[newPos].houses || 0) <= maxH && bot.cash >= (tile.house || 50) + 100) {
        bot.cash -= (tile.house || 50);
        roomState.props[newPos].houses = (roomState.props[newPos].houses || 0) + 1;
        actionDesc += ` 🏠 Rozbudowuje <strong>${tile.name}</strong>!`;
    }

    if (bot.cash < 0) {
        await declareBankrupt(bot.id);
        botTurnInProgress = false;
        return;
    }

    roomState.rolledThisTurn = false;
    roomState.housesThisTurn = 0;
    roomState.turnIdx = (roomState.turnIdx + 1) % activePlayers.length;

    addHistoryEntry(
        `🤖 <strong>${bot.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ staje na <strong>${tile.name}</strong>. ${actionDesc}`,
        bot.color
    );

    await pushState();

    setTimeout(() => {
        botTurnInProgress = false;
        renderRichupScreen();
    }, 1800);
}

// =====================================================
// RYSOWANIE PLANSZY, TOOLTIPÓW Z PRZYCISKAMI ZAKUPU I EMOTEK DOMKÓW
// =====================================================
function getPerimeterPos(index, gridN) {
    const max = gridN - 1;
    if (index <= max) return { r: max + 1, c: max + 1 - index, side: 'bottom' };
    if (index <= max * 2) return { r: max + 1 - (index - max), c: 1, side: 'left' };
    if (index <= max * 3) return { r: 1, c: 1 + (index - max * 2), side: 'top' };
    return { r: 1 + (index - max * 3), c: max + 1, side: 'right' };
}

function getTileTooltipHTML(tile, propState, idx = -1, boardData = MAP_40) {
    let html = "";

    if (tile.type === "station") {
        html = `<div class="tooltip-title">${tile.name} (Stacja)</div>
                <div class="tooltip-row"><span>Cena zakupu:</span><strong>${tile.price || 200}$</strong></div>
                <div class="tooltip-row"><span>1 stacja:</span><strong>50$</strong></div>
                <div class="tooltip-row"><span>2 stacje:</span><strong>150$</strong></div>
                <div class="tooltip-row"><span>3 stacje:</span><strong>250$</strong></div>
                <div class="tooltip-row"><span>4 stacje:</span><strong>400$</strong></div>`;
    } else if (tile.type === "utility") {
        html = `<div class="tooltip-title">${tile.name} (Media)</div>
                <div class="tooltip-row"><span>Cena zakupu:</span><strong>${tile.price || 150}$</strong></div>
                <div style="font-size:10.5px; color:#94a3b8; margin-top:3px;">1 obiekt: Rzut kośćmi x 5<br>2 obiekty: Rzut kośćmi x 10</div>`;
    } else if (tile.type === "prop") {
        const price = tile.price || 100;
        const houseCost = tile.house || 50;
        const r = tile.rentSet || [10, 50, 150, 450, 625, 750];

        html = `<div class="tooltip-title">${tile.name}</div>`;
        html += `<div class="tooltip-row"><span>Cena zakupu:</span><strong>${price}$</strong></div>`;
        html += `<div class="tooltip-row"><span>Cena domku:</span><strong>${houseCost}$</strong></div>`;
        html += `<div class="tooltip-row" style="border-top:1px solid #3b3354; margin-top:3px; padding-top:3px;"><span>Czynsz bazowy:</span><strong>${r[0]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠 1 domek:</span><strong>${r[1]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠 2 domki:</span><strong>${r[2]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠🏠 3 domki:</span><strong>${r[3]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠🏠🏠 4 domki:</span><strong>${r[4]}$</strong></div>`;
        html += `<div class="tooltip-row" style="color:#fde047;"><span>🏨 Hotel:</span><strong>${r[5]}$</strong></div>`;
    } else {
        return `<div class="tooltip-title">${tile.name}</div><div>Pole specjalne</div>`;
    }

    if (propState && roomState?.players) {
        const owner = roomState.players[propState.owner];
        const hCnt = propState.houses || 0;
        const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
        const statusStr = hCnt > maxH ? "🏨 Hotel" : (hCnt === 0 ? "Brak zabudowy" : "🏠".repeat(hCnt));
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:${owner?.color || '#fff'}">Właściciel: ${owner?.nick || 'Bank'} (${statusStr})</div>`;
    }

    // PRZYCISK KUPNA POLA LUB DOMKU BEZPOŚREDNIO NA KAFELKU PLANSZY
    if (roomState && roomState.status === "playing" && idx >= 0) {
        const activePlayers = getActivePlayers();
        const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
        const isMyTurn = currP && currP.id === myId && roomState.rolledThisTurn;

        if (isMyTurn) {
            const myPos = Number(currP.pos) || 0;
            const canBuyThisProp = !propState && myPos === idx && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && currP.cash >= tile.price;
            const canBuildThisHouse = canBuildHouseHere(myId, idx, boardData);

            if (canBuyThisProp) {
                html += `<button class="tooltip-buy-btn tooltip-buy-prop" onclick="event.stopPropagation(); buyPropertyOnTile(${idx})">💰 Kup pole (${tile.price}$)</button>`;
            }
            if (canBuildThisHouse) {
                const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
                const nextH = (propState?.houses || 0) + 1;
                const btnLabel = nextH > maxH ? `🏨 Kup Hotel (${tile.house}$)` : `🏠 Kup domek #${nextH} (${tile.house}$)`;
                html += `<button class="tooltip-buy-btn tooltip-buy-house" onclick="event.stopPropagation(); buildHouseOnIndex(${idx})">${btnLabel}</button>`;
            }
        }
    }

    return html;
}

function renderPawnsOnTilesOnly(boardData, activePlayers) {
    const boardEl = document.getElementById("monopoly-board");
    if (!boardEl) return;

    const tiles = boardEl.querySelectorAll(".m-tile");
    if (tiles.length === 0) return;

    tiles.forEach((tileEl, idx) => {
        const pawnsContainer = tileEl.querySelector(".tile-pawns");
        if (!pawnsContainer) return;

        const playersHere = activePlayers.filter(p => {
            const shownPos = (visualPositions[p.id] !== undefined) ? visualPositions[p.id] : (Number(p.pos) || 0);
            return shownPos === idx;
        });

        pawnsContainer.innerHTML = playersHere.map(p => {
            const hopClass = isHoppingMap[p.id] ? "pawn-hopping" : "";
            return `<div class="pawn-circle ${hopClass}" style="background:${p.color || '#f59e0b'}" title="${p.nick}">
                        ${(p.nick || "G").substring(0, 2).toUpperCase()}
                    </div>`;
        }).join("");
    });
}

// PRAWA KOLUMNA: POKAZYWANIE KUPIONYCH PÓL + EMOTKI DOMKÓW (🏠, 🏠🏠🏠, 🏨)
function renderMyOwnedProps(boardData, currP) {
    const box = document.getElementById("my-owned-list");
    if (!box || !roomState) return;
    const props = roomState.props || {};
    const myIndices = Object.keys(props).filter(i => props[i].owner === myId);
    if (myIndices.length === 0) {
        box.innerHTML = "Brak zakupionych pól.";
        return;
    }
    const isMyTurn = currP && currP.id === myId && roomState.rolledThisTurn;
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    box.innerHTML = myIndices.map(i => {
        const idx = parseInt(i);
        const t = boardData[idx];
        const h = props[idx].houses || 0;
        // Emotki domków (1 domek = 🏠, 3 domki = 🏠🏠🏠, hotel = 🏨)
        const hIcons = h > maxH ? "🏨" : (h > 0 ? "🏠".repeat(h) : "");
        const canB = isMyTurn && canBuildHouseHere(myId, idx, boardData);
        return `
            <div class="owned-item">
                <span>
                    <strong style="color:${t.color || '#38bdf8'}">■</strong> 
                    <strong>${t.name}</strong> 
                    <span style="margin-left:4px; font-size:13px;">${hIcons}</span>
                </span>
                <div style="display:flex; gap:4px;">
                    ${canB ? `<button class="btn-dark-sm" style="background:#d97706" onclick="buildHouseOnIndex(${idx})">+🏠 (${t.house}$)</button>` : ``}
                    ${roomState.settings?.mortgage ? `<button class="btn-dark-sm" onclick="sellPropertyToBank(${idx})">Sprzedaj (+${Math.floor(t.price/2)}$)</button>` : ``}
                </div>
            </div>
        `;
    }).join("");
}

function renderRichupScreen() {
    if (!roomState) return;

    const allPlayers = getOrderedPlayers();
    const activePlayers = getActivePlayers();
    const boardData = getCurrentBoard();

    if (!roomState.hostId || !roomState.players[roomState.hostId]) {
        roomState.hostId = allPlayers[0]?.id;
    }

    // 1. Płynna animacja skakania pionków pole po polu
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
                    renderPawnsOnTilesOnly(getCurrentBoard(), getActivePlayers());
                } else {
                    visualPositions[p.id] = (visualPositions[p.id] + 1) % getCurrentBoard().length;
                    renderPawnsOnTilesOnly(getCurrentBoard(), getActivePlayers());
                }
            }, 130);
        }
    });

    // 2. Ustawienia i blokada suwaków w trakcie gry
    const isPlaying = roomState.status === "playing";
    if (!isPlaying) applySettingsToDOM(roomState.settings);

    document.getElementById("settings-lock-info")?.classList.toggle("hidden", !isPlaying);
    document.querySelectorAll("#settings-panel-right select, #settings-panel-right input").forEach(el => {
        el.disabled = isPlaying;
    });

    document.getElementById("lobby-center-controls")?.classList.toggle("hidden", isPlaying);
    document.getElementById("playing-center-controls")?.classList.toggle("hidden", !isPlaying);

    const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
    const isMyTurnAndRolled = isPlaying && currP && currP.id === myId && roomState.rolledThisTurn;

    // 3. Rysowanie kafelków obwodu planszy
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

        boardEl.querySelectorAll(".m-tile").forEach(t => t.remove());

        const props = roomState.props || {};
        const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

        boardData.forEach((tile, idx) => {
            const pos = getPerimeterPos(idx, gridN);
            const div = document.createElement("div");
            div.className = "m-tile";
            if (idx % sideLen === 0) div.classList.add("corner");
            if (tile.type === "station") div.classList.add("airport");

            div.style.gridRow = pos.r;
            div.style.gridColumn = pos.c;

            const pState = props[idx];
            const owner = pState && roomState.players ? roomState.players[pState.owner] : null;
            const houses = pState ? (pState.houses || 0) : 0;

            let houseStr = "";
            let barBg = tile.color || "transparent";
            if (tile.color) {
                if (houses > maxH) {
                    houseStr = "🏨";
                    barBg = "#dc2626";
                } else if (houses > 0) {
                    houseStr = "🏠".repeat(houses);
                }
            }

            // Sprawdź, czy na tym polu gracz może teraz kliknąć i kupić działkę albo domek
            if (isMyTurnAndRolled) {
                const myPos = Number(currP.pos) || 0;
                const canBuyHere = !pState && myPos === idx && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && currP.cash >= tile.price;
                const canBuildHere = canBuildHouseHere(myId, idx, boardData);
                if (canBuyHere || canBuildHere) {
                    div.classList.add("actionable-tile");
                }
            }

            div.onclick = () => handleTileDirectClick(idx);

            div.innerHTML = `
                ${tile.color ? `<div class="tile-bar" style="background:${barBg}">${houseStr}</div>` : `<div></div>`}
                ${tile.icon ? `<div class="tile-icon">${tile.icon}</div>` : ``}
                <div class="tile-title">${tile.name}</div>
                ${tile.price ? `<div class="tile-price">${tile.price}$</div>` : `<div></div>`}
                <div class="tile-owner"></div>
                <div class="tile-pawns"></div>
                <div class="tile-tooltip">${getTileTooltipHTML(tile, pState, idx, boardData)}</div>
            `;

            if (owner && !owner.bankrupt) {
                div.classList.add("owned-tile");
                div.style.borderColor = owner.color;
                div.style.boxShadow = `0 0 12px ${owner.color}99, inset 0 0 18px ${owner.color}44`;
                div.style.background = `linear-gradient(180deg, #221e33 45%, ${owner.color}38 100%)`;

                const badge = div.querySelector(".tile-owner");
                if (badge) {
                    badge.className = "tile-owner-badge";
                    badge.style.background = owner.color;
                    badge.innerText = `👑 ${owner.nick.substring(0, 8)}`;
                }
            }

            boardEl.appendChild(div);
        });

        renderPawnsOnTilesOnly(boardData, activePlayers);
    }

    // 4. Kostki i pula Wakacji
    const dieFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const d1 = roomState.dice ? roomState.dice[0] : 5;
    const d2 = roomState.dice ? roomState.dice[1] : 3;

    if (roomState.diceRollId && roomState.diceRollId !== lastSeenDiceRollId) {
        lastSeenDiceRollId = roomState.diceRollId;
        triggerDiceSpinAnimation(d1, d2);
    } else {
        const box1 = document.getElementById("die-box-1");
        const box2 = document.getElementById("die-box-2");
        if (box1) box1.innerText = dieFaces[d1] || d1;
        if (box2) box2.innerText = dieFaces[d2] || d2;
    }

    const vacEl = document.getElementById("vacation-pot-val");
    if (vacEl) vacEl.innerText = (roomState.pot || 0) + "$";

    // 5. Tabelka historii (sztywna, bez mrugania i skakania)
    const logContainer = document.getElementById("action-log-box");
    if (logContainer) {
        const logs = roomState.historyLogs || [];
        const signature = logs.length > 0 ? (logs.length + "_" + logs[0].time + "_" + logs[0].text) : ("empty_" + (roomState.lastLog || ""));
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
                logContainer.scrollTop = 0;
            }
        }
    }

    // 6. Tura i przyciski (Rzut kostką / Koniec tury)
    if (isPlaying && currP) {
        const isMe = currP.id === myId;
        const stText = document.getElementById("turn-status-text");
        if (stText) {
            stText.innerText = `Tura gracza: ${currP.nick} ${isMe ? '(TWOJA KOLEJ!)' : ''}`;
            stText.style.borderColor = currP.color;
        }

        document.getElementById("btn-roll-dice")?.classList.toggle("hidden", !(isMe && !roomState.rolledThisTurn));
        document.getElementById("btn-finish-turn")?.classList.toggle("hidden", !(isMe && roomState.rolledThisTurn));

        if (currP.isBot && isMeRoomHost() && !botTurnInProgress) {
            setTimeout(() => {
                if (!botTurnInProgress && roomState?.status === "playing") {
                    const checkAct = getActivePlayers();
                    const checkCurr = checkAct[roomState.turnIdx % checkAct.length];
                    if (checkCurr && checkCurr.id === currP.id) {
                        runBotTurn(checkCurr);
                    }
                }
            }, 1200);
        }
    } else {
        const stText = document.getElementById("turn-status-text");
        if (stText) stText.innerText = "W Lobby – skonfiguruj grę po prawej stronie";
    }

    // 7. Lista graczy po prawej z przyciskiem Kick
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

    // 8. Czat
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

    // 9. Odśwież Chińczyka i Liar's Table Online
    renderLudoOnline();
    renderLiarOnline();
}

// =====================================================
// CHIŃCZYK (LUDO) - LOKALNY INIT + 100% ONLINE Z FIREBASE
// =====================================================
const L_PATH = [[4,0],[4,1],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],[4,6],[4,7],[4,8],[4,9],[4,10],[5,10],[6,10],[6,9],[6,8],[6,7],[6,6],[7,6],[8,6],[9,6],[10,6],[10,5],[10,4],[9,4],[8,4],[7,4],[6,4],[6,3],[6,2],[6,1],[6,0],[5,0]];
const L_BASES = [[[0,0],[0,1],[1,0],[1,1]], [[0,9],[0,10],[1,9],[1,10]], [[9,9],[9,10],[10,9],[10,10]], [[9,0],[9,1],[10,0],[10,1]]];
const L_COLS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
const LUDO_HOMES_COORDS = [
    [[5,1],[5,2],[5,3],[5,4]],
    [[1,5],[2,5],[3,5],[4,5]],
    [[5,9],[5,8],[5,7],[5,6]],
    [[9,5],[8,5],[7,5],[6,5]]
];
const LUDO_COLOR_NAMES = ["Czerwony 🔴", "Niebieski 🔵", "Żółty 🟡", "Zielony 🟢"];
let ludoState = { turn: 0, die: 6, pawns: [[-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1]] };

function initLudoLocal() { renderLudoLocal(); }
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
}

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
    if (step === -1) return die === 6 || die === 1;
    const targetStep = step + die;
    if (targetStep > 43) return false;
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
        myPawns[pawnIdx] = 0;
        ludo.log = `🚀 ${currP.nick} wyprowadza pionka z bazy na pole startowe!`;
    } else {
        myPawns[pawnIdx] += die;
        if (myPawns[pawnIdx] >= 40) {
            ludo.log = `🏠 ${currP.nick} wchodzi pionkiem do swojego kolorowego domku mety!`;
        } else {
            ludo.log = `🏃 ${currP.nick} przesuwa pionek o ${die} pól.`;
        }
    }

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
                            oPawns[oPwIdx] = -1;
                            ludo.log += ` 💥 ZBITO pionek gracza ${otherP.nick} do bazy!`;
                        }
                    }
                });
            }
        });
    }

    if (myPawns.every(s => s >= 40)) {
        ludo.log = `🏆 KONIEC GRY! ${currP.nick} wprowadził wszystkie 4 pionki do domku i WYGRYWA! 🎉`;
        ludo.rolled = false;
        await pushState();
        return;
    }

    ludo.rolled = false;
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
    const allP = getOrderedPlayers();
    const players4 = allP.slice(0, 4);
    const activeIdx = players4.length > 0 ? (ludo.turnIdx % players4.length) : 0;
    const currP = players4[activeIdx];
    const amIHost = isMeRoomHost();

    document.getElementById("ludo-room-code").innerText = currentRoom;

    const resetBtn = document.getElementById("btn-ludo-reset-host");
    if (resetBtn) resetBtn.classList.toggle("hidden", !amIHost);

    const pListEl = document.getElementById("ludo-players-online");
    if (pListEl) {
        pListEl.innerHTML = players4.map((p, idx) => {
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

    const dieFaces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    document.getElementById("ludo-die-box").innerText = dieFaces[ludo.die] || ludo.die;
    document.getElementById("ludo-log-box").innerText = ludo.log || "";

    if (currP) {
        const isMe = currP.id === myId;
        document.getElementById("ludo-turn-text").innerText = `Tura: ${currP.nick} (${LUDO_COLOR_NAMES[activeIdx]}) ${isMe ? '- TY!' : ''}`;
        document.getElementById("ludo-turn-text").style.borderColor = L_COLS[activeIdx];
    }

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

    L_PATH.forEach(([r, c], idx) => {
        const cell = cellMap[`${r}_${c}`];
        cell.classList.remove("empty");
        if (idx === 0) { cell.classList.add("ludo-start-0"); cell.innerText = "START"; }
        if (idx === 10) { cell.classList.add("ludo-start-1"); cell.innerText = "START"; }
        if (idx === 20) { cell.classList.add("ludo-start-2"); cell.innerText = "START"; }
        if (idx === 30) { cell.classList.add("ludo-start-3"); cell.innerText = "START"; }
    });

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

    cellMap["5_5"].classList.remove("empty");
    cellMap["5_5"].style.background = "#2e2942";
    cellMap["5_5"].innerText = "🏆";

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

    if (currP && currP.isBot && amIHost && document.getElementById("ludo-view")?.classList.contains("active")) {
        setTimeout(() => runLudoBotOnline(currP, activeIdx, players4), 950);
    }
}

async function runLudoBotOnline(bot, botIdx, players4) {
    const ludo = roomState.ludoOnline;
    const die = Math.floor(Math.random() * 6) + 1;
    ludo.die = die;
    const bPawns = ludo.pawns[bot.id] || [-1,-1,-1,-1];

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
// LIAR'S TABLE (BLEF KARCIANY) - LOKALNY INIT + 100% ONLINE
// =====================================================
let liarDeckTarget = "A", liarHand = [], liarSelected = [], liarLastCards = [], liarPile = 0;
let mySelectedLiarCards = [];

function liarInit() {
    const figs = ["A", "K", "Q"];
    liarDeckTarget = figs[Math.floor(Math.random() * 3)];
    liarHand = ["A", "K", "Q", "A", "JOKER"].sort(() => Math.random() - 0.5);
    liarSelected = []; liarPile = 0; liarLastCards = [];
}

function createFreshLiarRound(alivePlayers, existingShots = {}) {
    const targets = ["A", "K", "Q"];
    const target = targets[Math.floor(Math.random() * targets.length)];
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
        lastPlay: null,
        hands: hands,
        shots: shots,
        dead: roomState?.liarOnline?.dead || {},
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

    const amIHost = isMeRoomHost();
    document.getElementById("liar-room-code").innerText = currentRoom;
    const resetBtn = document.getElementById("btn-liar-reset-host");
    if (resetBtn) resetBtn.classList.toggle("hidden", !amIHost);

    if (!roomState.liarOnline) {
        const allP = getOrderedPlayers();
        roomState.liarOnline = createFreshLiarRound(allP, {});
    }

    const liar = roomState.liarOnline;
    const allP = getOrderedPlayers();
    const aliveP = getAliveLiarPlayers();
    const currP = aliveP.length > 0 ? aliveP[liar.turnIdx % aliveP.length] : null;

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

    if (currP && currP.isBot && amIHost && document.getElementById("liar-view")?.classList.contains("active")) {
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
    liar.lastPlay = { pid: myId, nick: myNick, cards: played };
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
// WARCABY I SZACHY 8x8, TETRIS ORAZ KASYNO
// =====================================================
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
    if (!tCur || !document.getElementById("tetris-view")?.classList.contains("active")) return;
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
// PRZESUWANIE + ROZCIĄGANIE TABELKI HISTORII GÓRA-DÓŁ (Z LIMITAMI)
// Wklej na sam dół pliku script.js (zastąp poprzedni skrypt przesuwania)!
// =====================================================
(function initDraggableAndResizableHistory() {
    let mode = null; // 'move' | 'resize-top' | 'resize-bottom'
    let startMouseY = 0;
    let startOffsetY = 0;
    let startHeight = 215;
    let currentOffsetY = 0;
    let currentHeight = 215;
    const MIN_HEIGHT = 95; // Minimalna wysokość, żeby tabelka nie zniknęła całkiem

    function ensureHandles() {
        const wrap = document.querySelector(".history-table-wrap");
        if (!wrap) return null;

        if (!wrap.querySelector(".hist-resize-top")) {
            const topH = document.createElement("div");
            topH.className = "hist-resize-handle hist-resize-top";
            topH.title = "Pociągnij góra/dół, aby rozszerzyć od góry";
            wrap.appendChild(topH);
        }
        if (!wrap.querySelector(".hist-resize-bottom")) {
            const botH = document.createElement("div");
            botH.className = "hist-resize-handle hist-resize-bottom";
            botH.title = "Pociągnij góra/dół, aby rozszerzyć od dołu";
            wrap.appendChild(botH);
        }
        return wrap;
    }

    setTimeout(ensureHandles, 200);

    window.addEventListener("mousedown", (e) => {
        const wrap = ensureHandles();
        if (!wrap) return;

        const topHandle = e.target.closest(".hist-resize-top");
        const botHandle = e.target.closest(".hist-resize-bottom");
        const header = e.target.closest(".history-header");

        if (topHandle) {
            mode = "resize-top";
        } else if (botHandle) {
            mode = "resize-bottom";
        } else if (header) {
            mode = "move";
        } else {
            return;
        }

        startMouseY = e.clientY;
        startOffsetY = currentOffsetY;
        startHeight = wrap.getBoundingClientRect().height;
        currentHeight = startHeight;

        wrap.classList.add("dragging-now");
        e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
        if (!mode) return;

        const wrap = document.querySelector(".history-table-wrap");
        const centerBox = document.querySelector(".board-inner-center");
        const diceZone = document.querySelector(".top-dice-zone");
        if (!wrap || !centerBox || !diceZone) return;

        const deltaY = e.clientY - startMouseY;

        // Pobieramy naturalną pozycję bazową elementu
        wrap.style.transform = "translateY(0px)";
        const baseRect = wrap.getBoundingClientRect();
        const centerRect = centerBox.getBoundingClientRect();
        const diceRect = diceZone.getBoundingClientRect();

        // Sztywne granice w pikselach na ekranie
        const limitTopY = diceRect.bottom + 6;      // Max pod kostkami
        const limitBottomY = centerRect.bottom - 8; // Max nad dolną krawędzią mapy

        if (mode === "move") {
            const minOffset = limitTopY - baseRect.top;
            const maxOffset = limitBottomY - (baseRect.top + currentHeight);
            currentOffsetY = Math.max(minOffset, Math.min(maxOffset, startOffsetY + deltaY));
        } 
        else if (mode === "resize-bottom") {
            // Górna krawędź stoi w miejscu, ciągniemy dolną krawędź w dół lub w górę
            const currentTopScreenY = baseRect.top + currentOffsetY;
            const maxAllowedHeight = limitBottomY - currentTopScreenY;
            currentHeight = Math.max(MIN_HEIGHT, Math.min(maxAllowedHeight, startHeight + deltaY));
        } 
        else if (mode === "resize-top") {
            // Dolna krawędź stoi sztywno w miejscu, a górna jedzie w górę lub w dół
            const fixedBottomOffset = startOffsetY + startHeight;
            const minAllowedOffset = limitTopY - baseRect.top;
            const maxAllowedOffset = fixedBottomOffset - MIN_HEIGHT;

            currentOffsetY = Math.max(minAllowedOffset, Math.min(maxAllowedOffset, startOffsetY + deltaY));
            currentHeight = fixedBottomOffset - currentOffsetY;
        }

        // Aplikujemy nową wysokość i pozycję
        wrap.style.setProperty("height", `${currentHeight}px`, "important");
        wrap.style.setProperty("max-height", `${currentHeight}px`, "important");
        wrap.style.setProperty("flex", `0 0 ${currentHeight}px`, "important");
        wrap.style.transform = `translateY(${currentOffsetY}px)`;
    });

    window.addEventListener("mouseup", () => {
        if (!mode) return;
        mode = null;
        const wrap = document.querySelector(".history-table-wrap");
        if (wrap) wrap.classList.remove("dragging-now");
    });
})();

// =====================================================
// SYSTEM WYMIAN MIĘDZY GRACZAMI (TRADE) + TWARDA BLOKADA UPRAWNIEŃ HOSTA 👑
// Wklej na sam dół pliku script.js!
// =====================================================

let activeTradeTargetId = null;
let lastSeenTradeId = null;

// 1. Automatyczne utworzenie okienek HTML dla wymian (nie trzeba edytować index.html!)
function ensureTradeModalsInDOM() {
    if (document.getElementById("trade-create-modal")) return;

    const modalHTML = `
        <!-- OKIENKO TWORZENIA OFERTY WYMIANY -->
        <div id="trade-create-modal" class="trade-modal-backdrop hidden">
            <div class="trade-modal-card">
                <div class="trade-modal-header">
                    <span>🤝 Zaproponuj wymianę z graczem: <strong id="trade-target-nick" style="color:#fde047;">---</strong></span>
                    <button class="btn-dark-sm" onclick="closeTradeModal()">✖ Zamknij</button>
                </div>

                <div class="trade-columns">
                    <!-- LEWA STRONA: CO JA DAJĘ -->
                    <div class="trade-col">
                        <div class="trade-col-title">
                            <span>📤 Ty oddajesz:</span>
                            <span style="color:#22c55e;">Masz: $<span id="trade-my-cash-max">0</span></span>
                        </div>
                        <label class="small-label">Gotówka dla gracza ($):</label>
                        <input type="number" id="trade-offer-cash" class="trade-cash-input" value="0" min="0" step="10">
                        <label class="small-label" style="margin-top:4px;">Twoje dzielnice (zaznacz):</label>
                        <div id="trade-my-props-list" class="trade-props-box"></div>
                    </div>

                    <!-- PRAWA STRONA: CO CHCĘ W ZAMIAN -->
                    <div class="trade-col">
                        <div class="trade-col-title">
                            <span>📥 Ty otrzymujesz:</span>
                            <span style="color:#38bdf8;">Ma: $<span id="trade-their-cash-max">0</span></span>
                        </div>
                        <label class="small-label">Gotówka od gracza ($):</label>
                        <input type="number" id="trade-request-cash" class="trade-cash-input" value="0" min="0" step="10">
                        <label class="small-label" style="margin-top:4px;">Dzielnice gracza (zaznacz):</label>
                        <div id="trade-their-props-list" class="trade-props-box"></div>
                    </div>
                </div>

                <div class="trade-modal-footer">
                    <button class="btn-dark" onclick="closeTradeModal()">Anuluj</button>
                    <button class="btn-action-buy" onclick="sendTradeOfferNow()">🚀 Wyślij ofertę wymiany</button>
                </div>
            </div>
        </div>

        <!-- OKIENKO ODBIORU OFERTY PRZEZ DRUGIEGO GRACZA -->
        <div id="trade-incoming-modal" class="trade-modal-backdrop hidden">
            <div class="incoming-trade-banner">
                <h3 style="color:#fde047;">🤝 Nowa propozycja wymiany!</h3>
                <div id="trade-incoming-title" style="font-size:13.5px;">Gracz proponuje Ci wymianę:</div>
                <div id="trade-incoming-body" class="incoming-trade-details"></div>
                <div class="main-turn-btns" style="margin-top:6px;">
                    <button class="btn-action-buy" onclick="respondToTradeOffer(true)">✅ Akceptuj wymianę</button>
                    <button class="btn-bankrupt" style="flex:0; padding:10px 18px;" onclick="respondToTradeOffer(false)">❌ Odrzuć</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// 2. Otwieranie okienka wymiany z wybranym graczem
function openTradeModalWith(targetId) {
    ensureTradeModalsInDOM();
    if (!roomState || roomState.status !== "playing") {
        alert("Wymiany są dostępne tylko w trakcie trwającej rozgrywki!");
        return;
    }
    const me = roomState.players?.[myId];
    const target = roomState.players?.[targetId];
    if (!me || !target || me.bankrupt || target.bankrupt) return;

    activeTradeTargetId = targetId;
    document.getElementById("trade-target-nick").innerText = target.nick;
    document.getElementById("trade-my-cash-max").innerText = me.cash;
    document.getElementById("trade-their-cash-max").innerText = target.cash;

    const myCashInp = document.getElementById("trade-offer-cash");
    const theirCashInp = document.getElementById("trade-request-cash");
    myCashInp.value = 0;
    myCashInp.max = me.cash;
    theirCashInp.value = 0;
    theirCashInp.max = target.cash;

    const boardData = getCurrentBoard();
    const props = roomState.props || {};

    // Moje dzielnice
    const myPropsIndices = Object.keys(props).filter(idx => props[idx].owner === myId);
    const myBox = document.getElementById("trade-my-props-list");
    if (myPropsIndices.length === 0) {
        myBox.innerHTML = `<div class="small-label">Brak własnych dzielnic.</div>`;
    } else {
        myBox.innerHTML = myPropsIndices.map(idx => {
            const t = boardData[idx];
            const h = props[idx].houses || 0;
            return `
                <label class="trade-prop-item">
                    <input type="checkbox" class="trade-my-prop-cb" value="${idx}">
                    <strong style="color:${t.color || '#38bdf8'}">■</strong>
                    <span>${t.name} (${t.price}$) ${h > 0 ? '🏠x'+h : ''}</span>
                </label>
            `;
        }).join("");
    }

    // Dzielnice drugiego gracza
    const theirPropsIndices = Object.keys(props).filter(idx => props[idx].owner === targetId);
    const theirBox = document.getElementById("trade-their-props-list");
    if (theirPropsIndices.length === 0) {
        theirBox.innerHTML = `<div class="small-label">Ten gracz nie ma jeszcze dzielnic.</div>`;
    } else {
        theirBox.innerHTML = theirPropsIndices.map(idx => {
            const t = boardData[idx];
            const h = props[idx].houses || 0;
            return `
                <label class="trade-prop-item">
                    <input type="checkbox" class="trade-their-prop-cb" value="${idx}">
                    <strong style="color:${t.color || '#38bdf8'}">■</strong>
                    <span>${t.name} (${t.price}$) ${h > 0 ? '🏠x'+h : ''}</span>
                </label>
            `;
        }).join("");
    }

    document.getElementById("trade-create-modal").classList.remove("hidden");
}

function closeTradeModal() {
    document.getElementById("trade-create-modal")?.classList.add("hidden");
    activeTradeTargetId = null;
}

// 3. Wysyłanie oferty wymiany (do żywego gracza lub Bota!)
async function sendTradeOfferNow() {
    if (!roomState || !activeTradeTargetId) return;
    const me = roomState.players?.[myId];
    const target = roomState.players?.[activeTradeTargetId];
    if (!me || !target) return;

    const offerCash = Math.max(0, parseInt(document.getElementById("trade-offer-cash").value) || 0);
    const requestCash = Math.max(0, parseInt(document.getElementById("trade-request-cash").value) || 0);

    if (offerCash > me.cash) {
        alert("Nie masz tylu pieniędzy!");
        return;
    }
    if (requestCash > target.cash) {
        alert(`${target.nick} nie ma tylu pieniędzy!`);
        return;
    }

    const offerProps = Array.from(document.querySelectorAll(".trade-my-prop-cb:checked")).map(cb => parseInt(cb.value));
    const requestProps = Array.from(document.querySelectorAll(".trade-their-prop-cb:checked")).map(cb => parseInt(cb.value));

    if (offerCash === 0 && requestCash === 0 && offerProps.length === 0 && requestProps.length === 0) {
        alert("Wybierz chociaż jedno pole lub wpisz kwotę gotówki do wymiany!");
        return;
    }

    const tradeObj = {
        id: "tr_" + Date.now(),
        fromId: myId,
        fromNick: me.nick,
        toId: target.id,
        toNick: target.nick,
        offerCash: offerCash,
        requestCash: requestCash,
        offerProps: offerProps,
        requestProps: requestProps
    };

    closeTradeModal();

    // Jeśli wymieniamy się z Botem -> Bot od razu ocenia opłacalność oferty!
    if (target.isBot) {
        const boardData = getCurrentBoard();
        const givenValue = offerCash + offerProps.reduce((acc, idx) => acc + (boardData[idx]?.price || 100), 0);
        const wantedValue = requestCash + requestProps.reduce((acc, idx) => acc + (boardData[idx]?.price || 100), 0);

        // Bot zgadza się, jeśli wartość tego co dostaje wynosi min. 90% wartości tego co oddaje
        if (givenValue >= wantedValue * 0.9) {
            executeTradeTransfer(tradeObj);
            addHistoryEntry(`🤝🤖 <strong>${target.nick}</strong> zaakceptował wymianę z graczem <strong>${me.nick}</strong>!`, target.color);
            await pushState();
            alert(`✅ ${target.nick} przyjął Twoją ofertę wymiany!`);
        } else {
            addHistoryEntry(`❌🤖 <strong>${target.nick}</strong> odrzucił nieopłacalną ofertę wymiany od <strong>${me.nick}</strong>.`, target.color);
            await pushState();
            alert(`❌ ${target.nick} odrzucił ofertę (uznał ją za nieopłacalną)!`);
        }
        return;
    }

    // Jeśli to żywy gracz -> zapisujemy ofertę w pokoju Firebase
    roomState.pendingTrade = tradeObj;
    addHistoryEntry(`🤝 <strong>${me.nick}</strong> wysłał propozycję wymiany do <strong>${target.nick}</strong>.`, me.color);
    await pushState();
}

// 4. Przekazanie pól i gotówki po akceptacji
function executeTradeTransfer(tr) {
    const pFrom = roomState.players?.[tr.fromId];
    const pTo = roomState.players?.[tr.toId];
    if (!pFrom || !pTo) return false;
    if (pFrom.cash < tr.offerCash || pTo.cash < tr.requestCash) return false;

    const props = roomState.props || {};
    // Sprawdź, czy obaj gracze nadal posiadają oferowane pola
    for (const idx of (tr.offerProps || [])) {
        if (!props[idx] || props[idx].owner !== tr.fromId) return false;
    }
    for (const idx of (tr.requestProps || [])) {
        if (!props[idx] || props[idx].owner !== tr.toId) return false;
    }

    // Przelew gotówki
    pFrom.cash = (Number(pFrom.cash) || 0) - tr.offerCash + tr.requestCash;
    pTo.cash = (Number(pTo.cash) || 0) - tr.requestCash + tr.offerCash;

    // Przepisanie własności działek
    (tr.offerProps || []).forEach(idx => {
        props[idx].owner = tr.toId;
    });
    (tr.requestProps || []).forEach(idx => {
        props[idx].owner = tr.fromId;
    });

    return true;
}

// 5. Odpowiedź drugiego gracza (Akceptuj / Odrzuć)
async function respondToTradeOffer(accepted) {
    if (!roomState || !roomState.pendingTrade) return;
    const tr = roomState.pendingTrade;

    if (accepted) {
        const ok = executeTradeTransfer(tr);
        if (ok) {
            addHistoryEntry(`✅🤝 <strong>${tr.toNick}</strong> zaakceptował wymianę z graczem <strong>${tr.fromNick}</strong>!`, "#22c55e");
        } else {
            addHistoryEntry(`⚠️ Wymiana między ${tr.fromNick} a ${tr.toNick} nie powiodła się (brak środków lub działek).`, "#ef4444");
        }
    } else {
        addHistoryEntry(`❌🤝 <strong>${tr.toNick}</strong> odrzucił propozycję wymiany od <strong>${tr.fromNick}</strong>.`, "#ef4444");
    }

    roomState.pendingTrade = null;
    document.getElementById("trade-incoming-modal")?.classList.add("hidden");
    await pushState();
}

// 6. Twarda blokada zmiany ustawień i startu gry TYLKO dla Hosta 👑
const origUpdateSettingsHostCheck = updateSettingsFromUI;
updateSettingsFromUI = async function() {
    if (!roomState) return;
    if (!isMeRoomHost()) {
        alert("👑 Tylko Host pokoju może zmieniać ustawienia i zasady gry!");
        applySettingsToDOM(roomState.settings);
        return;
    }
    await origUpdateSettingsHostCheck();
};

const origHostStartCheck = hostStartGame;
hostStartGame = async function() {
    if (!roomState) return;
    if (!isMeRoomHost()) {
        alert("👑 Tylko Host pokoju może wystartować rozgrywkę!");
        return;
    }
    await origHostStartCheck();
};

const origAddBotHostCheck = addBotPlayer;
addBotPlayer = async function() {
    if (!roomState) return;
    if (!isMeRoomHost()) {
        alert("👑 Tylko Host pokoju może dodawać Boty!");
        return;
    }
    await origAddBotHostCheck();
};

// 7. Rozszerzenie głównego odświeżania o przyciski Wymiany (🤝) i blokady dla gości
const prevRenderBeforeTradeAndHost = renderRichupScreen;
renderRichupScreen = function() {
    ensureTradeModalsInDOM();
    prevRenderBeforeTradeAndHost();
    if (!roomState) return;

    const amIHost = isMeRoomHost();
    const isPlaying = roomState.status === "playing";
    const allPlayers = getOrderedPlayers();
    const boardData = getCurrentBoard();

    // A. Blokada wszystkich ustawień po prawej i widoczności pokoju dla osób niebędących Hostem
    const lockBanner = document.getElementById("settings-lock-info");
    if (lockBanner) {
        if (!amIHost) {
            lockBanner.classList.remove("hidden");
            lockBanner.innerText = "👑 Tylko Host pokoju może zmieniać ustawienia gry.";
        } else if (isPlaying) {
            lockBanner.classList.remove("hidden");
            lockBanner.innerText = "🔒 Gra trwa! Kliknij 'Reset do Ustawień' powyżej.";
        } else {
            lockBanner.classList.add("hidden");
        }
    }

    const disableControls = isPlaying || !amIHost;
    document.querySelectorAll("#settings-panel-right select, #settings-panel-right input, #room-visibility").forEach(el => {
        el.disabled = disableControls;
    });

    // Ukryj przycisk Resetu do Ustawień oraz Startu Gry dla nie-Hosta
    const resetBtn = document.getElementById("btn-reset-lobby");
    if (resetBtn) resetBtn.classList.toggle("hidden", !amIHost);

    const startBtn = document.querySelector(".btn-richup-start");
    if (startBtn) {
        startBtn.disabled = !amIHost;
        startBtn.style.opacity = amIHost ? "1" : "0.5";
        startBtn.innerText = amIHost ? "▶️ Rozpocznij Grę" : "⏳ Czekaj aż Host rozpocznie grę...";
    }

    // B. Lista graczy z przyciskiem 🤝 Wymiany (w trakcie gry) oraz 🥾 Kick (tylko dla Hosta)
    const monoList = document.getElementById("players-list-right");
    if (monoList) {
        monoList.innerHTML = allPlayers.map(p => {
            const canTradeWith = isPlaying && p.id !== myId && !p.bankrupt && !roomState.players?.[myId]?.bankrupt;
            return `
                <div class="p-row" style="opacity:${p.bankrupt ? 0.4 : 1}">
                    <div class="p-left">
                        <div class="p-dot" style="background:${p.color}"></div>
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                        ${p.bankrupt ? `<span style="color:#ef4444;font-size:11px;">BANKRUT</span>` : ``}
                    </div>
                    <div style="display:flex; align-items:center;">
                        <strong>$${p.cash}</strong>
                        ${canTradeWith ? `<button class="btn-trade-mini" onclick="openTradeModalWith('${p.id}')" title="Zaproponuj wymianę">🤝</button>` : ``}
                        ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć z gry (Tylko Host)">🥾</button>` : ``}
                    </div>
                </div>
            `;
        }).join("");
    }

    // C. Sprawdź, czy przyszła do mnie oferta wymiany od innego gracza
    const incomingModal = document.getElementById("trade-incoming-modal");
    const tr = roomState.pendingTrade;
    if (incomingModal) {
        if (tr && tr.toId === myId) {
            const offerPropsNames = (tr.offerProps || []).map(i => `• ${boardData[i]?.name}`).join("<br>") || "Brak działek";
            const reqPropsNames = (tr.requestProps || []).map(i => `• ${boardData[i]?.name}`).join("<br>") || "Brak działek";

            document.getElementById("trade-incoming-title").innerHTML = `Gracz <strong style="color:#fde047;">${tr.fromNick}</strong> proponuje Ci wymianę:`;
            document.getElementById("trade-incoming-body").innerHTML = `
                <div>
                    <strong style="color:#22c55e;">📥 Otrzymasz od ${tr.fromNick}:</strong><br>
                    💵 Gotówka: <strong>$${tr.offerCash || 0}</strong><br>
                    ${offerPropsNames}
                </div>
                <div>
                    <strong style="color:#ef4444;">📤 Oddasz w zamian:</strong><br>
                    💵 Gotówka: <strong>$${tr.requestCash || 0}</strong><br>
                    ${reqPropsNames}
                </div>
            `;
            incomingModal.classList.remove("hidden");
        } else {
            incomingModal.classList.add("hidden");
        }
    }
};

// =====================================================
// POWIADOMIENIA (TOASTY) + PRAWDZIWE KARTY SZANSY + UKŁAD GRY (CZAT I DZIELNICE PO PRAWEJ)
// Wklej na sam dół pliku script.js!
// =====================================================

let lastSeenNotificationId = 0;

// 1. Funkcja wyświetlająca ładne powiadomienie u góry ekranu
function showGameToast(title, message, icon = "🔔", borderColor = "#8b5cf6", duration = 4500) {
    let container = document.getElementById("rsl-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "rsl-toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "rsl-toast";
    toast.style.borderLeftColor = borderColor;
    toast.innerHTML = `
        <div class="rsl-toast-icon">${icon}</div>
        <div class="rsl-toast-body">
            <div class="rsl-toast-title">${title}</div>
            <div>${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Maksymalnie 3 powiadomienia naraz, żeby nie zasłonić ekranu
    while (container.children.length > 3) {
        container.removeChild(container.firstChild);
    }

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        toast.style.transition = "all 0.25s ease";
        setTimeout(() => toast.remove(), 260);
    }, duration);
}

// Wysyłanie powiadomienia do wszystkich graczy w pokoju
function broadcastToast(title, message, icon = "🔔", color = "#8b5cf6") {
    if (!roomState) return;
    roomState.lastNotification = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: title,
        message: message,
        icon: icon,
        color: color
    };
    lastSeenNotificationId = roomState.lastNotification.id;
    showGameToast(title, message, icon, color);
}

// 2. Przebudowa prawej kolumny:
// Wyciągamy "Twoje Dzielnice" z wnętrza karty Zasad Rozgrywki do osobnego pudełka,
// żeby po ukryciu zasad podczas gry Twoje Dzielnice zostały na widoku pod Czatem!
function setupDynamicRightPanelLayout() {
    const rightPanel = document.querySelector("#monopoly-view .right-panel");
    const leftPanel = document.querySelector("#monopoly-view .left-panel");
    const settingsCard = document.getElementById("settings-panel-right");
    const chatCard = document.querySelector(".chat-card");
    const ownedSection = document.querySelector(".my-owned-section");

    if (!rightPanel || !leftPanel || !settingsCard || !chatCard || !ownedSection) return;

    // Upewnij się, że "Twoje Dzielnice" są osobną kartą na dole prawego panelu (poza settings-panel-right)
    if (ownedSection.parentElement === settingsCard) {
        ownedSection.classList.remove("my-owned-section");
        ownedSection.classList.add("owned-card-standalone");
        rightPanel.appendChild(ownedSection);
    }

    const isPlaying = roomState && roomState.status === "playing";

    if (isPlaying) {
        // W trakcie gry: Ukryj Zasady Rozgrywki, przenieś Czat na prawy panel nad Twoje Dzielnice!
        settingsCard.classList.add("hidden");
        if (chatCard.parentElement !== rightPanel) {
            chatCard.classList.add("chat-card-in-right");
            rightPanel.insertBefore(chatCard, ownedSection);
        }
    } else {
        // W Lobby: Pokaż Zasady Rozgrywki po prawej, a Czat trzymaj w lewej kolumnie
        settingsCard.classList.remove("hidden");
        if (chatCard.parentElement !== leftPanel) {
            chatCard.classList.remove("chat-card-in-right");
            leftPanel.appendChild(chatCard);
        }
    }
}

// 3. PRAWDZIWE KARTY "NIESPODZIANKA" (❓) ORAZ "SKARB ŚLĄSKI" (📦) + POWIADOMIENIA
processLanding = function(player, tile, posIdx, boardData) {
    if (!roomState.props) roomState.props = {};
    const pState = roomState.props[posIdx];
    const isMe = player.id === myId;

    // A. PODATKI
    if (tile.type === "tax") {
        player.cash -= tile.amount;
        if (roomState.settings?.vacationCash) roomState.pot = (roomState.pot || 0) + tile.amount;
        broadcastToast("💸 Podatek!", `${player.nick} płaci ${tile.name}: -${tile.amount}$`, "💸", "#ef4444");
        return `Płaci ${tile.name} (-${tile.amount}$).`;
    }

    // B. WAKACJE (BURLOCH)
    if (tile.type === "parking") {
        if (roomState.settings?.vacationCash && roomState.pot > 0) {
            const won = roomState.pot;
            player.cash += won;
            roomState.pot = 0;
            broadcastToast("🏖️ Pula z Burlochu!", `${player.nick} zgarnia całą pulę z Wakacji: +${won}$!`, "🎉", "#22c55e");
            return `Zgarnia pulę z Wakacji na Burlochu: +${won}$! 🎉`;
        }
        return `Odpoczywa na Burloch Arenie.`;
    }

    // C. IDŹ DO WIĘZIENIA
    if (tile.type === "gotojail") {
        const jailIdx = boardData.findIndex(t => t.type === "jail");
        player.pos = jailIdx >= 0 ? jailIdx : 10;

        // Sprawdź, czy gracz ma kartę "Wyjście z Więzienia za darmo"!
        if ((player.jailCards || 0) > 0) {
            player.jailCards -= 1;
            player.inJail = 0;
            broadcastToast("🎟️ Użyto karty!", `${player.nick} miał trafić na Izbę, ale używa karty "Wyjście z Więzienia za darmo"!`, "🎟️", "#10b981");
            return `Trafia na Izbę, ale od razu wychodzi dzięki darmowej karcie 🎟️!`;
        }

        player.inJail = 1;
        broadcastToast("🚔 Idziesz do Więzienia!", `${player.nick} jedzie prosto na Izbę Wytrzeźwień!`, "⛓️", "#ef4444");
        return `Jedzie prosto do Więzienia! 🚔`;
    }

    // D. NIESPODZIANKA (❓) ORAZ SKARB ŚLĄSKI (📦) - ROZBUDOWANA TALIA KART!
    if (tile.type === "chance" || tile.type === "chest") {
        const activePlayers = getActivePlayers();
        const jailIdx = boardData.findIndex(t => t.type === "jail");
        const ratuszIdx = boardData.findIndex(t => t.name.includes("Ratusz"));
        const aquadromIdx = boardData.findIndex(t => t.name.includes("Aquadrom"));
        const chebzieIdx = boardData.findIndex(t => t.type === "station");

        const cardsDeck = [
            {
                title: "🎟️ Wyjście z Więzienia za darmo!",
                icon: "🎟️",
                color: "#10b981",
                run: () => {
                    player.jailCards = (player.jailCards || 0) + 1;
                    return `Otrzymuje kartę <strong>"Wyjście z Więzienia za darmo"</strong> 🎟️!`;
                }
            },
            {
                title: "🎂 Masz dzisiaj Urodziny!",
                icon: "🎂",
                color: "#ec4899",
                run: () => {
                    let collected = 0;
                    activePlayers.forEach(other => {
                        if (other.id !== player.id) {
                            const oRef = roomState.players[other.id];
                            if (oRef) {
                                oRef.cash -= 50;
                                player.cash += 50;
                                collected += 50;
                            }
                        }
                    });
                    return `Urodziny! Każdy gracz wręcza prezent po 50$ (łącznie +${collected}$)! 🎂`;
                }
            },
            {
                title: "🍻 Stawiasz kolejkę znajomym!",
                icon: "🍻",
                color: "#f97316",
                run: () => {
                    let paidTotal = 0;
                    activePlayers.forEach(other => {
                        if (other.id !== player.id) {
                            const oRef = roomState.players[other.id];
                            if (oRef) {
                                player.cash -= 30;
                                oRef.cash += 30;
                                paidTotal += 30;
                            }
                        }
                    });
                    return `Stawia kolejkę wszystkim graczom po 30$ (łącznie -${paidTotal}$)! 🍻`;
                }
            },
            {
                title: "🏁 Ekspres na START!",
                icon: "🏁",
                color: "#22c55e",
                run: () => {
                    player.pos = 0;
                    player.cash += 200;
                    return `Przechodzi prosto na pole <strong>START</strong> i zgarnia +200$! 🏁`;
                }
            },
            {
                title: "🏛️ Wizyta w Ratuszu!",
                icon: "🏛️",
                color: "#3b82f6",
                run: () => {
                    const target = ratuszIdx >= 0 ? ratuszIdx : (boardData.length - 1);
                    player.pos = target;
                    const subRes = processLanding(player, boardData[target], target, boardData);
                    return `Idzie prosto na pole <strong>${boardData[target].name}</strong>! ${subRes}`;
                }
            },
            {
                title: "🏊 Wycieczka na Aquadrom!",
                icon: "🏊",
                color: "#0ea5e9",
                run: () => {
                    const target = aquadromIdx >= 0 ? aquadromIdx : 15;
                    if (target < posIdx) player.cash += 200; // Mija Start po drodze
                    player.pos = target;
                    const subRes = processLanding(player, boardData[target], target, boardData);
                    return `Jedzie na <strong>${boardData[target].name}</strong>! ${subRes}`;
                }
            },
            {
                title: "✈️ Lot z Dworca Chebzie!",
                icon: "✈️",
                color: "#38bdf8",
                run: () => {
                    const target = chebzieIdx >= 0 ? chebzieIdx : 5;
                    if (target < posIdx) player.cash += 200;
                    player.pos = target;
                    const subRes = processLanding(player, boardData[target], target, boardData);
                    return `Przenosi się na stację <strong>${boardData[target].name}</strong>! ${subRes}`;
                }
            },
            {
                title: "🚔 Kontrola drogowa – na Izbę!",
                icon: "🚔",
                color: "#ef4444",
                run: () => {
                    if ((player.jailCards || 0) > 0) {
                        player.jailCards -= 1;
                        return `Miał trafić do więzienia, ale wykorzystuje kartę darmowego wyjścia 🎟️!`;
                    }
                    player.pos = jailIdx >= 0 ? jailIdx : 10;
                    player.inJail = 1;
                    return `Karta wysyła gracza prosto do Więzienia (Izba)! ⛓️`;
                }
            },
            {
                title: "💰 Zwrot podatku ze Skarbówki!",
                icon: "💰",
                color: "#22c55e",
                run: () => {
                    player.cash += 150;
                    return `Otrzymuje zwrot podatku: <strong>+150$</strong>!`;
                }
            },
            {
                title: "📸 Fotoradar na DTŚ!",
                icon: "📸",
                color: "#ef4444",
                run: () => {
                    player.cash -= 100;
                    if (roomState.settings?.vacationCash) roomState.pot = (roomState.pot || 0) + 100;
                    return `Mandat z fotoradaru na DTŚ: <strong>-100$</strong> (trafia do puli Burloch)!`;
                }
            }
        ];

        const drawn = cardsDeck[Math.floor(Math.random() * cardsDeck.length)];
        const resultText = drawn.run();
        broadcastToast(`${tile.name}: ${drawn.title}`, `${player.nick}: ${resultText.replace(/<[^>]*>?/gm, '')}`, drawn.icon, drawn.color);
        return `🃏 [${drawn.title}] ${resultText}`;
    }

    // E. ZWYKŁE POLA (DZIELNICE, STACJE, MEDIA)
    if (tile.type === "prop" || tile.type === "station" || tile.type === "utility") {
        // 1. Pole należy do innego gracza -> Płacisz czynsz
        if (pState && pState.owner !== player.id) {
            const owner = roomState.players[pState.owner];
            if (owner && !owner.bankrupt) {
                if (roomState.settings?.noPrisonRent && owner.inJail > 0) {
                    broadcastToast("⛓️ Brak czynszu!", `Właściciel (${owner.nick}) siedzi w więzieniu – ${player.nick} nie płaci!`, "⛓️", "#94a3b8");
                    return `Właściciel (${owner.nick}) siedzi w więzieniu – brak czynszu!`;
                }

                let finalRent = 0;
                if (tile.type === "station") {
                    const sIdx = boardData.map((t, i) => t.type === "station" ? i : -1).filter(i => i !== -1);
                    const count = sIdx.filter(i => roomState.props[i]?.owner === owner.id).length;
                    finalRent = [0, 50, 150, 250, 400][Math.min(count, 4)] || 50;
                } else if (tile.type === "utility") {
                    const uIdx = boardData.map((t, i) => t.type === "utility" ? i : -1).filter(i => i !== -1);
                    const count = uIdx.filter(i => roomState.props[i]?.owner === owner.id).length;
                    const diceSum = (roomState.dice ? roomState.dice[0] + roomState.dice[1] : 7);
                    finalRent = diceSum * (count >= 2 ? 10 : 5);
                } else if (tile.type === "prop") {
                    const rSet = tile.rentSet || [10, 50, 150, 450, 625, 750];
                    const houses = pState.houses || 0;
                    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
                    if (houses === 0) {
                        finalRent = rSet[0];
                        const gIdx = boardData.map((t, i) => t.group === tile.group ? i : -1).filter(i => i !== -1);
                        if (gIdx.every(i => roomState.props[i]?.owner === owner.id) && roomState.settings?.doubleRent) {
                            finalRent *= 2;
                        }
                    } else {
                        finalRent = rSet[houses > maxH ? 5 : Math.min(houses, 4)] || rSet[1];
                    }
                }

                player.cash -= finalRent;
                owner.cash += finalRent;
                broadcastToast("💸 Opłata czynszu!", `${player.nick} płaci ${finalRent}$ czynszu dla gracza ${owner.nick} (pole ${tile.name})!`, "💸", "#f59e0b");
                return `Płaci <strong>${finalRent}$</strong> czynszu dla ${owner.nick}!`;
            }
        }
        // 2. Pole jest WOLNE -> Powiadomienie dla gracza, że może je kupić!
        else if (!pState) {
            if (isMe && player.cash >= tile.price) {
                showGameToast(
                    `💰 Możesz kupić: ${tile.name}!`,
                    `Koszt: ${tile.price}$. Najedź myszką lub kliknij bezpośrednio na to pole na planszy, aby je kupić!`,
                    "🏘️",
                    "#22c55e",
                    5000
                );
            }
            return `Wolne pole (${tile.price}$) – kliknij na pole na mapie, aby kupić!`;
        }
        // 3. Gracz staje na WŁASNYM polu -> Powiadomienie jeśli może postawić domek/hotel!
        else if (pState && pState.owner === player.id) {
            if (isMe && canBuildHouseHere(player.id, posIdx, boardData)) {
                showGameToast(
                    `🏠 Możesz rozbudować: ${tile.name}!`,
                    `Kliknij na swoje pole na planszy, aby postawić domek lub hotel za ${tile.house}$!`,
                    "🏠",
                    "#d97706",
                    5000
                );
            }
            return `Staje na własnej dzielnicy ${tile.name}.`;
        }
    }

    return `Staje na polu ${tile.name}.`;
};

// 4. Rozszerzenie głównego odświeżania o odbieranie powiadomień (toastów), odznakę karty więzienia i chowanie Zasad
const prevRenderBeforeToastsAndLayout = renderRichupScreen;
renderRichupScreen = function() {
    prevRenderBeforeToastsAndLayout();
    setupDynamicRightPanelLayout();

    if (!roomState) return;

    // A. Wyświetl nowe powiadomienie z Firebase (jeśli jeszcze go nie widzieliśmy)
    const notif = roomState.lastNotification;
    if (notif && notif.id && notif.id !== lastSeenNotificationId) {
        lastSeenNotificationId = notif.id;
        showGameToast(notif.title, notif.message, notif.icon, notif.color);
    }

    // B. Dopisz ikonkę karty "Wyjście z Więzienia" (🎟️) przy graczach, którzy ją wylosowali
    const allPlayers = getOrderedPlayers();
    const amIHost = isMeRoomHost();
    const isPlaying = roomState.status === "playing";
    const monoList = document.getElementById("players-list-right");

    if (monoList) {
        monoList.innerHTML = allPlayers.map(p => {
            const canTradeWith = isPlaying && p.id !== myId && !p.bankrupt && !roomState.players?.[myId]?.bankrupt;
            const jailCardsCount = p.jailCards || 0;
            return `
                <div class="p-row" style="opacity:${p.bankrupt ? 0.4 : 1}">
                    <div class="p-left">
                        <div class="p-dot" style="background:${p.color}"></div>
                        <strong>${p.nick}</strong>
                        ${p.id === roomState.hostId ? `<span class="host-crown">👑 Host</span>` : ``}
                        ${jailCardsCount > 0 ? `<span class="jail-card-badge" title="Karta: Wyjście z Więzienia za darmo">🎟️x${jailCardsCount}</span>` : ``}
                        ${p.bankrupt ? `<span style="color:#ef4444;font-size:11px;">BANKRUT</span>` : ``}
                    </div>
                    <div style="display:flex; align-items:center;">
                        <strong>$${p.cash}</strong>
                        ${canTradeWith ? `<button class="btn-trade-mini" onclick="openTradeModalWith('${p.id}')" title="Zaproponuj wymianę">🤝</button>` : ``}
                        ${amIHost && p.id !== myId ? `<button class="btn-kick" onclick="hostKickPlayer('${p.id}')" title="Wyrzuć z gry (Tylko Host)">🥾</button>` : ``}
                    </div>
                </div>
            `;
        }).join("");
    }
};

// =====================================================
// AUTOMATYCZNE ZWALNIANIE PÓL PO BANKRUCTWIE LUB WYJŚCIU GRACZA
// Wklej na sam dół pliku script.js!
// =====================================================

// 1. Funkcja "Odkurzacz" – usuwa osierocone pola (gdy właściciel wyszedł, zamknął kartę lub zbankrutował)
function cleanupOrphanedProperties() {
    if (!roomState || !roomState.props) return false;
    const players = roomState.players || {};
    let changed = false;

    Object.keys(roomState.props).forEach(posKey => {
        const pState = roomState.props[posKey];
        if (!pState) return;

        const owner = players[pState.owner];
        // Jeśli właściciela nie ma już w pokoju ALBO jest oznaczony jako bankrut -> zwolnij pole!
        if (!owner || owner.bankrupt) {
            delete roomState.props[posKey];
            changed = true;
        }
    });

    return changed;
}

// 2. Poprawione wyjście z lobby (🚪 Wyjdź) – od razu zwalnia wszystkie kupione pola gracza!
leaveCurrentLobby = async function(silent = false) {
    if (!silent && roomState && roomState.players && roomState.players[myId] && currentRoom) {
        const leavingNick = roomState.players[myId].nick || myNick;

        // Zwolnij wszystkie pola opuszczającego gracza, żeby inni mogli je normalnie kupić
        if (roomState.props) {
            Object.keys(roomState.props).forEach(posKey => {
                if (roomState.props[posKey]?.owner === myId) {
                    delete roomState.props[posKey];
                }
            });
        }

        delete roomState.players[myId];
        cleanupOrphanedProperties();

        // Napraw kolejkę tur, jeśli wychodzący gracz miał teraz swoją turę
        const remActive = getActivePlayers();
        if (remActive.length > 0) {
            roomState.turnIdx = roomState.turnIdx % remActive.length;
            roomState.rolledThisTurn = false;
        } else {
            roomState.status = "lobby";
        }

        addHistoryEntry(`🚪 <strong>${leavingNick}</strong> opuścił(a) grę! Wszystkie jego dzielnice są znów wolne do zakupu.`, "#94a3b8");
        broadcastToast("🚪 Gracz wyszedł!", `${leavingNick} opuścił grę – jego dzielnice można teraz normalnie kupić!`, "🏘️", "#38bdf8");

        await fetch(`${FIREBASE_URL}richup_rooms/${currentRoom}.json`, {
            method: "PUT",
            body: JSON.stringify(roomState)
        });
    }

    if (pollTimer) clearInterval(pollTimer);
    Object.values(animTimers).forEach(t => clearInterval(t));
    animTimers = {};
    visualPositions = {};
    isHoppingMap = {};

    isInLobbyRoom = false;
    roomState = null;
    currentRoom = "";
    setLobbyUIState(false, "");

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
};

// 3. Poprawione bankructwo – czyści pola do zera i powiadamia innych, że działki są do wzięcia!
declareBankrupt = async function(pid) {
    if (!roomState || !roomState.players) return;
    const p = roomState.players[pid];
    if (!p) return;

    p.bankrupt = true;
    p.cash = 0;

    if (roomState.props) {
        Object.keys(roomState.props).forEach(k => {
            if (roomState.props[k]?.owner === pid) {
                delete roomState.props[k];
            }
        });
    }
    cleanupOrphanedProperties();

    const rem = getActivePlayers();
    if (rem.length === 1) {
        addHistoryEntry(`🏆 KONIEC GRY! Wygrywa <strong>${rem[0].nick}</strong>! Kliknij Reset do Ustawień, aby zagrać ponownie.`, rem[0].color);
        broadcastToast("🏆 Mamy Zwycięzcę!", `Gracz ${rem[0].nick} wygrywa całą partię Monopoly RSL!`, "🏆", "#fde047");
    } else {
        roomState.rolledThisTurn = false;
        roomState.housesThisTurn = 0;
        roomState.turnIdx = roomState.turnIdx % Math.max(1, rem.length);
        addHistoryEntry(`🏳️ <strong>${p.nick}</strong> bankrutuje! Wszystkie jego dzielnice są znów wolne i można je kupić!`, "#ef4444");
        broadcastToast("🏳️ Bankructwo!", `${p.nick} odpada z gry! Jego dzielnice wróciły na mapę jako wolne pola do zakupu!`, "🏘️", "#ef4444");
    }
    await pushState();
};

// 4. Aktualizacja dymku (tooltipa) nad polem – nigdy więcej napisu "Właściciel: Bank"!
getTileTooltipHTML = function(tile, propState, idx = -1, boardData = MAP_40) {
    let html = "";

    // Sprawdzamy, czy pole ma PRAWDZIWEGO, aktywnego właściciela w grze
    const realOwner = (propState && roomState?.players && roomState.players[propState.owner] && !roomState.players[propState.owner].bankrupt)
        ? roomState.players[propState.owner]
        : null;

    // Jeśli nie ma prawdziwego właściciela, traktujemy pole jako 100% wolne!
    const validPropState = realOwner ? propState : null;

    if (tile.type === "station") {
        html = `<div class="tooltip-title">${tile.name} (Stacja)</div>
                <div class="tooltip-row"><span>Cena zakupu:</span><strong>${tile.price || 200}$</strong></div>
                <div class="tooltip-row"><span>1 stacja:</span><strong>50$</strong></div>
                <div class="tooltip-row"><span>2 stacje:</span><strong>150$</strong></div>
                <div class="tooltip-row"><span>3 stacje:</span><strong>250$</strong></div>
                <div class="tooltip-row"><span>4 stacje:</span><strong>400$</strong></div>`;
    } else if (tile.type === "utility") {
        html = `<div class="tooltip-title">${tile.name} (Media)</div>
                <div class="tooltip-row"><span>Cena zakupu:</span><strong>${tile.price || 150}$</strong></div>
                <div style="font-size:10.5px; color:#94a3b8; margin-top:3px;">1 obiekt: Rzut kośćmi x 5<br>2 obiekty: Rzut kośćmi x 10</div>`;
    } else if (tile.type === "prop") {
        const price = tile.price || 100;
        const houseCost = tile.house || 50;
        const r = tile.rentSet || [10, 50, 150, 450, 625, 750];

        html = `<div class="tooltip-title">${tile.name}</div>`;
        html += `<div class="tooltip-row"><span>Cena zakupu:</span><strong>${price}$</strong></div>`;
        html += `<div class="tooltip-row"><span>Cena domku:</span><strong>${houseCost}$</strong></div>`;
        html += `<div class="tooltip-row" style="border-top:1px solid #3b3354; margin-top:3px; padding-top:3px;"><span>Czynsz bazowy:</span><strong>${r[0]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠 1 domek:</span><strong>${r[1]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠 2 domki:</span><strong>${r[2]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠🏠 3 domki:</span><strong>${r[3]}$</strong></div>`;
        html += `<div class="tooltip-row"><span>🏠🏠🏠🏠 4 domki:</span><strong>${r[4]}$</strong></div>`;
        html += `<div class="tooltip-row" style="color:#fde047;"><span>🏨 Hotel:</span><strong>${r[5]}$</strong></div>`;
    } else {
        return `<div class="tooltip-title">${tile.name}</div><div>Pole specjalne</div>`;
    }

    if (realOwner && validPropState) {
        const hCnt = validPropState.houses || 0;
        const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
        const statusStr = hCnt > maxH ? "🏨 Hotel" : (hCnt === 0 ? "Brak zabudowy" : "🏠".repeat(hCnt));
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:${realOwner.color}">Właściciel: <strong>${realOwner.nick}</strong> (${statusStr})</div>`;
    } else {
        html += `<div style="margin-top:4px; border-top:1px dashed #475569; padding-top:3px; color:#22c55e; font-weight:700;">🟢 WOLNE POLE (Można kupić!)</div>`;
    }

    // Przycisk kupna pola lub domku bezpośrednio w dymku nad kafelkiem
    if (roomState && roomState.status === "playing" && idx >= 0) {
        const activePlayers = getActivePlayers();
        const currP = activePlayers.length > 0 ? activePlayers[roomState.turnIdx % activePlayers.length] : null;
        const isMyTurn = currP && currP.id === myId && roomState.rolledThisTurn;

        if (isMyTurn) {
            const myPos = Number(currP.pos) || 0;
            const canBuyThisProp = !validPropState && myPos === idx && (tile.type === "prop" || tile.type === "station" || tile.type === "utility") && currP.cash >= tile.price;
            const canBuildThisHouse = canBuildHouseHere(myId, idx, boardData);

            if (canBuyThisProp) {
                html += `<button class="tooltip-buy-btn tooltip-buy-prop" onclick="event.stopPropagation(); buyPropertyOnTile(${idx})">💰 Kup pole (${tile.price}$)</button>`;
            }
            if (canBuildThisHouse) {
                const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
                const nextH = (validPropState?.houses || 0) + 1;
                const btnLabel = nextH > maxH ? `🏨 Kup Hotel (${tile.house}$)` : `🏠 Kup domek #${nextH} (${tile.house}$)`;
                html += `<button class="tooltip-buy-btn tooltip-buy-house" onclick="event.stopPropagation(); buildHouseOnIndex(${idx})">${btnLabel}</button>`;
            }
        }
    }

    return html;
};

// 5. Przed każdym wejściem na pole i każdym odświeżeniem ekranu automatycznie czyścimy porzucone działki!
const prevProcessLandingBeforeCleanup = processLanding;
processLanding = function(player, tile, posIdx, boardData) {
    cleanupOrphanedProperties();
    return prevProcessLandingBeforeCleanup(player, tile, posIdx, boardData);
};

const prevBuyOnTileBeforeCleanup = buyPropertyOnTile;
buyPropertyOnTile = async function(targetIdx) {
    cleanupOrphanedProperties();
    await prevBuyOnTileBeforeCleanup(targetIdx);
};

const prevRenderBeforeOrphanCleanup = renderRichupScreen;
renderRichupScreen = function() {
    if (roomState) {
        const cleaned = cleanupOrphanedProperties();
        if (cleaned && isMeRoomHost() && !isSavingNow) {
            // Host automatycznie zapisuje w bazie oczyszczone pola po graczach, którzy zamknęli przeglądarkę
            pushState();
            return;
        }
    }
    prevRenderBeforeOrphanCleanup();
};
// =====================================================
// SYSTEM SPRZEDAŻY DOMKÓW ZA POŁOWĘ CENY
// Wklej na sam dół pliku script.js!
// =====================================================

// 1. Funkcja obsługująca sprzedaż pojedynczego domku z danej dzielnice
async function sellHouseOnIndex(idx) {
    if (!roomState || !roomState.props) return;
    const pState = roomState.props[idx];
    if (!pState || pState.owner !== myId) return;

    const housesCount = pState.houses || 0;
    if (housesCount <= 0) {
        alert("Na tym polu nie ma żadnych domków do sprzedaży!");
        return;
    }

    const boardData = getCurrentBoard();
    const tile = boardData[idx];
    const me = roomState.players[myId];
    if (!tile || !me) return;

    // Cena pojedynczego domku (bazowa z definicji pola)
    const houseCost = tile.house || 50;
    const refund = Math.floor(houseCost / 2);

    // Zmniejsz liczbę domków o 1 i oddaj graczowi 50% kasy
    pState.houses = housesCount - 1;
    me.cash += refund;

    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;
    const statusLabel = pState.houses > maxH ? "🏨 Hotel" : (pState.houses === 0 ? "brak domków" : `${pState.houses} domki 🏠`);

    addHistoryEntry(
        `💸 <strong>${me.nick}</strong> sprzedaje 1 domek z pola <strong>${tile.name}</strong> za połowę ceny (+${refund}$). Pozostało: ${statusLabel}.`,
        me.color
    );

    await pushState();
}

// 2. Nadpisujemy funkcję renderującą Twoje dzielnice po prawej stronie, żeby dodać przycisk "-🏠 Sprzedaj"
const prevRenderMyOwnedPropsBeforeHouseSell = renderMyOwnedProps;
renderMyOwnedProps = function(boardData, currP) {
    if (typeof prevRenderMyOwnedPropsBeforeHouseSell === "function") {
        // Wywołujemy oryginalną strukturę, żeby nie popsuć przycisków zakupu/sprzedaży działki
        // (nadpisujemy tylko zawartość boxa, żeby wstawić przycisk sprzedaży domków)
    }

    const box = document.getElementById("my-owned-list");
    if (!box || !roomState) return;
    const props = roomState.props || {};
    const myIndices = Object.keys(props).filter(i => props[i].owner === myId);

    if (myIndices.length === 0) {
        box.innerHTML = "Brak zakupionych pól.";
        return;
    }

    const isMyTurn = currP && currP.id === myId && roomState.rolledThisTurn;
    const maxH = roomState?.settings?.maxHousesBeforeHotel || 4;

    box.innerHTML = myIndices.map(i => {
        const idx = parseInt(i);
        const t = boardData[idx];
        if (!t) return "";

        const h = props[idx].houses || 0;
        const hIcons = h > maxH ? "🏨 HOTEL" : (h > 0 ? "🏠".repeat(h) : "Brak domków");
        const canBuild = isMyTurn && canBuildHouseHere(myId, idx, boardData);
        const canSellHouse = h > 0; // Można sprzedawać domki, jeśli jakiekolwiek stoją na polu
        const houseRefund = Math.floor((t.house || 50) / 2);

        return `
            <div class="owned-item" style="flex-direction:column; align-items:flex-start; gap:4px; padding:8px;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span><strong style="color:${t.color || '#38bdf8'}">■</strong> <strong>${t.name}</strong></span>
                    <span style="font-size:12px;">${hIcons}</span>
                </div>
                <div style="display:flex; gap:4px; flex-wrap:wrap; width:100%; justify-content:flex-end; margin-top:2px;">
                    ${canSellHouse ? `<button class="btn-dark-sm" style="background:#7c3aed; color:#fff;" onclick="sellHouseOnIndex(${idx})" title="Odzyskaj 50% ceny domku">-🏠 Sprzedaj dom (+${houseRefund}$)</button>` : ``}
                    ${canBuild ? `<button class="btn-dark-sm" style="background:#d97706" onclick="buildHouseOnIndex(${idx})">+🏠 (${t.house}$)</button>` : ``}
                    ${roomState.settings?.mortgage ? `<button class="btn-dark-sm" onclick="sellPropertyToBank(${idx})">Sprzedaj pole (+${Math.floor(t.price/2)}$)</button>` : ``}
                </div>
            </div>
        `;
    }).join("");
};
// =====================================================
// KASA NA MINUS + RĘCZNE BANKRUCTWO (BRAK AUTOMATU)
// Wklej na sam dół pliku script.js!
// =====================================================

// 1. Nadpisujemy funkcję sprawdzenia kasy po lądowaniu na polu – dopuszczamy minusy!
const prevProcessLandingBeforeDebt = processLanding;
processLanding = function(player, tile, posIdx, boardData) {
    const res = prevProcessLandingBeforeDebt(player, tile, posIdx, boardData);
    
    // Jeśli stan konta spadł poniżej 0, wyliczamy ile brakuje i NIE wyrzucamy z gry automatycznie
    if (player.cash < 0) {
        const debt = Math.abs(player.cash);
        addHistoryEntry(`⚠️ <strong>${player.nick}</strong> wpada w długi! Stan konta: <span style="color:#ef4444;">$${player.cash}</span> (Brakuje Ci <strong>$${debt}</strong>, żeby wyjść na zero. Sprzedaj domki lub pole!).`, "#ef4444");
        broadcastToast("⚠️ Poważny dług!", `${player.nick} ma na koncie $${player.cash}! Brakuje $${debt} do spłaty długów.`, "⚠️", "#ef4444");
    }
    
    return res;
};

// 2. Blokujemy automatyczne usuwanie gracza z gry przy ujemnym saldo w funkcji rzutu i ruchu bota
rollDiceNow = async function() {
    if (!roomState || roomState.status !== "playing") return;
    const activePlayers = getActivePlayers();
    if (activePlayers.length === 0) return;

    const currIdx = roomState.turnIdx % activePlayers.length;
    const currP = activePlayers[currIdx];

    if (!currP || currP.id !== myId) {
        alert("To nie Twoja tura!");
        return;
    }
    if (roomState.rolledThisTurn) {
        alert("W tej turze już rzuciłeś kostką!");
        return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    roomState.dice = [d1, d2];
    roomState.diceRollId = Date.now();
    lastSeenDiceRollId = roomState.diceRollId;
    roomState.rolledThisTurn = true;
    roomState.housesThisTurn = 0;

    triggerDiceSpinAnimation(d1, d2);

    const boardData = getCurrentBoard();
    const playerObj = roomState.players[myId];
    const oldPos = Number(playerObj.pos) || 0;
    const newPos = (oldPos + sum) % boardData.length;
    playerObj.pos = newPos;

    let passMsg = "";
    if (newPos < oldPos) {
        playerObj.cash += 200;
        passMsg = " (Mija START +200$)";
    }

    const tile = boardData[newPos];
    const landResult = processLanding(playerObj, tile, newPos, boardData);

    addHistoryEntry(
        `🎲 <strong>${playerObj.nick}</strong> wyrzuca <strong>${sum}</strong> (${d1}+${d2})${passMsg} ➡️ staje na <strong>${tile.name}</strong>. ${landResult}`,
        playerObj.color
    );

    // USUNIĘTE: warunek sprawdzający `if (playerObj.cash < 0) { declareBankrupt(...); }`
    // Od teraz kasa może być ujemna, a gracz sam decyduje kiedy się podda!

    await pushState();
};

// 3. Boty w długach automatycznie wyprzedają domki albo ogłaszają bankructwo, jeśli nie mają wyjścia
const prevRunBotTurnBeforeDebt = runBotTurn;
runBotTurn = async function(botObj) {
    if (!roomState || roomState.status !== "playing") return;
    const bot = roomState.players?.[botObj.id];
    
    // Jeśli bot ma długi, najpierw próbuje ratować się sprzedażą domków
    if (bot && bot.cash < 0) {
        const props = roomState.props || {};
        const botProps = Object.keys(props).filter(k => props[k].owner === bot.id);
        
        let soldSomething = false;
        for (const pKey of botProps) {
            if (props[pKey].houses > 0) {
                props[pKey].houses -= 1;
                const boardData = getCurrentBoard();
                const refund = Math.floor((boardData[pKey]?.house || 50) / 2);
                bot.cash += refund;
                soldSomething = true;
                addHistoryEntry(`🤖 ${bot.nick} ratuje się przed długiem i sprzedaje domek z ${boardData[pKey].name} (+${refund}$).`, bot.color);
                break;
            }
        }

        // Jeśli nie ma już nic do sprzedaży, a dług nadal rośnie poniżej -$300 -> bot ogłasza bankructwo
        if (!soldSomething && bot.cash < -300) {
            await declareBankrupt(bot.id);
            return;
        }
    }

    await prevRunBotTurnBeforeDebt(botObj);
};
// =====================================================
// 10-SEKUNDOWY DELAY (COOLDOWN) MIĘDZY WYMIANAMI
// Wklej na sam dół pliku script.js!
// =====================================================

let lastTradeTimestamp = 0;
const TRADE_COOLDOWN_MS = 10000; // 10 sekund

// Nadpisujemy funkcję otwierania wymiany, żeby sprawdzać upływ czasu
const origOpenTradeModalWith = openTradeModalWith;
openTradeModalWith = function(targetId) {
    const now = Date.now();
    const elapsed = now - lastTradeTimestamp;

    if (elapsed < TRADE_COOLDOWN_MS) {
        const remainingSec = Math.ceil((TRADE_COOLDOWN_MS - elapsed) / 1000);
        alert(`⏳ Musisz odczekać jeszcze ${remainingSec} sek., zanim wyślesz kolejną propozycję wymiany!`);
        return;
    }

    origOpenTradeModalWith(targetId);
};

// Nadpisujemy wysyłanie oferty, żeby zapisać dokładny moment wysłania
const origSendTradeOfferNow = sendTradeOfferNow;
sendTradeOfferNow = async function() {
    lastTradeTimestamp = Date.now();
    await origSendTradeOfferNow();
};
// =====================================================
// PRZESUWANIE CZATU GÓRA-DÓŁ + WERSJA GRY V1.0.0
// Wklej na sam dół pliku script.js!
// =====================================================

(function initDraggableChatBox() {
    let isDraggingChat = false;
    let startMouseY = 0;
    let startOffsetY = 0;
    let currentChatOffsetY = 0;

    // Automatycznie dodaj etykietę wersji gry w rogu ekranu
    window.addEventListener("DOMContentLoaded", () => {
        if (!document.getElementById("rsl-game-version-tag")) {
            const badge = document.createElement("div");
            badge.id = "rsl-game-version-tag";
            badge.className = "game-version-badge";
            badge.innerText = "RSL.IO v1.0.0";
            document.body.appendChild(badge);
        }
    });

    window.addEventListener("mousedown", (e) => {
        const chatCard = e.target.closest(".chat-card-in-right");
        if (!chatCard) return;

        // Pozwól normalnie pisać i klikać w inputy/przyciski czatu
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.closest(".chat-messages")) {
            return;
        }

        const titleEl = e.target.closest(".card-title");
        if (!titleEl) return;

        isDraggingChat = true;
        startMouseY = e.clientY;
        startOffsetY = currentChatOffsetY;
        e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDraggingChat) return;

        const chatCard = document.querySelector(".chat-card-in-right");
        if (!chatCard) return;

        const deltaY = e.clientY - startMouseY;
        currentChatOffsetY = startOffsetY + deltaY;

        // Ograniczenia ruchu góra-dół, żeby czat nie uciekł z prawego panelu
        currentChatOffsetY = Math.max(-120, Math.min(180, currentChatOffsetY));
        chatCard.style.transform = `translateY(${currentChatOffsetY}px)`;
    });

    window.addEventListener("mouseup", () => {
        if (!isDraggingChat) return;
        isDraggingChat = false;
    });
})();
