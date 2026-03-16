const shuffleBtn = document.getElementById("shuffleBtn");
const drawBtn = document.getElementById("drawBtn");
const drawnCardEl = document.getElementById("drawnCard");
const statusTextEl = document.getElementById("statusText");
const remainingCountEl = document.getElementById("remainingCount");
const drawnCountEl = document.getElementById("drawnCount");
const drawHistoryEl = document.getElementById("drawHistory");

const state = {
    sourceCards: [],
    deck: [],
    drawn: []
};

function shuffleDeck(cards) {
    const shuffled = [...cards];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

function formatOptionLabel(option) {
    return option.title;
}

function renderCounters() {
    remainingCountEl.textContent = String(state.deck.length);
    drawnCountEl.textContent = String(state.drawn.length);
}

function renderHistory() {
    drawHistoryEl.innerHTML = "";

    if (state.drawn.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "Aucune option tirée pour le moment.";
        drawHistoryEl.appendChild(emptyItem);
        return;
    }

    const recentCards = state.drawn.slice(-5).reverse();

    recentCards.forEach((option) => {
        const item = document.createElement("li");
        item.className = "history-pill";
        item.textContent = formatOptionLabel(option);
        drawHistoryEl.appendChild(item);
    });
}

function showCard(option) {
    const safeDescription = option.description || "Aucune description fournie.";
    const safeTag = option.tag || "Option";

    drawnCardEl.className = "drawn-card option-card";
    drawnCardEl.innerHTML = `
        <div class="card-corner top">✨</div>
        <div class="card-main">
            <span class="card-rank">${option.title}</span>
            <span class="card-suit">${safeTag}</span>
            <p class="option-description">${safeDescription}</p>
        </div>
        <div class="card-corner bottom">✨</div>
    `;
}

function setStatus(message) {
    statusTextEl.textContent = message;
}

function resetDeck(message = "Options mélangées. Prêt à tirer.") {
    state.deck = shuffleDeck(state.sourceCards);
    state.drawn = [];

    drawnCardEl.className = "drawn-card is-empty";
    drawnCardEl.innerHTML = '<p class="placeholder">Appuyez sur <strong>Tirer une option</strong> pour en révéler une.</p>';

    renderCounters();
    renderHistory();
    setStatus(message);
}

function drawCard() {
    if (state.deck.length === 0) {
        setStatus("Plus d'options disponibles. Mélangez pour recommencer.");
        return;
    }

    const option = state.deck.pop();
    state.drawn.push(option);

    showCard(option);
    renderCounters();
    renderHistory();
    setStatus(`Vous avez tiré ${formatOptionLabel(option)}.`);
}

shuffleBtn.addEventListener("click", () => resetDeck("Options remélangées."));
drawBtn.addEventListener("click", drawCard);

try {
    const response = await fetch("cards.json");

    if (!response.ok) {
        throw new Error("Échec du chargement des données d'options.");
    }

    const cards = await response.json();

    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error("Les données d'options sont vides ou invalides.");
    }

    const hasInvalidOption = cards.some((card) => typeof card.title !== "string" || card.title.trim() === "");

    if (hasInvalidOption) {
        throw new Error("Chaque option doit avoir un titre non vide.");
    }

    state.sourceCards = cards;
    resetDeck();
} catch (error) {
    console.error(error);
    setStatus("Impossible de charger les options depuis le fichier JSON.");
    drawBtn.disabled = true;
    shuffleBtn.disabled = true;
}
