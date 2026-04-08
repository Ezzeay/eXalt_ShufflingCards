const shuffleBtn = document.getElementById("shuffleBtn");
const drawBtn = document.getElementById("drawBtn");
const showAnswerBtn = document.getElementById("showAnswerBtn");
const presenterAnswerBtn = document.getElementById("presenterAnswerBtn");
const presenterHintWrapEl = document.getElementById("presenterHintWrap");
const presenterTooltipEl = document.getElementById("presenterTooltip");
const drawnCardEl = document.getElementById("drawnCard");
const answerPanelEl = document.getElementById("answerPanel");
const statusTextEl = document.getElementById("statusText");
const remainingCountEl = document.getElementById("remainingCount");
const drawnCountEl = document.getElementById("drawnCount");
const drawHistoryEl = document.getElementById("drawHistory");

const state = {
    sourceCards: [],
    deck: [],
    drawn: [],
    currentCard: null,
    isAnswerVisible: false
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatRichText(value) {
    return escapeHtml(value).replaceAll("\n", "<br />");
}

function getIdealReaction(option) {
    return option?.idealReaction?.trim() || "Aucune réponse idéale disponible pour cette carte.";
}

function renderAnswerPanels() {
    const hasCurrentCard = Boolean(state.currentCard);
    const answerText = hasCurrentCard ? getIdealReaction(state.currentCard) : "";

    showAnswerBtn.disabled = !hasCurrentCard;
    presenterAnswerBtn.disabled = !hasCurrentCard;
    presenterHintWrapEl.classList.toggle("is-disabled", !hasCurrentCard);
    showAnswerBtn.textContent = state.isAnswerVisible ? "Masquer la réponse" : "Afficher la réponse";
    presenterTooltipEl.innerHTML = hasCurrentCard ? formatRichText(answerText) : "";
    presenterTooltipEl.setAttribute("aria-hidden", String(!hasCurrentCard));

    if (!hasCurrentCard) {
        answerPanelEl.classList.add("is-hidden");
        answerPanelEl.innerHTML = "";
        return;
    }

    if (state.isAnswerVisible) {
        answerPanelEl.classList.remove("is-hidden");
        answerPanelEl.innerHTML = `
            <div class="answer-panel-head">
                <span class="answer-panel-label">Réponse attendue</span>
            </div>
            <p class="answer-panel-body">${formatRichText(answerText)}</p>
        `;
    } else {
        answerPanelEl.classList.add("is-hidden");
        answerPanelEl.innerHTML = "";
    }
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

    const recentCards = [...state.drawn].reverse();

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
            <span class="card-rank">${escapeHtml(option.title)}</span>
            <span class="card-suit">${escapeHtml(safeTag)}</span>
            <p class="option-description">${escapeHtml(safeDescription)}</p>
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
    state.currentCard = null;
    state.isAnswerVisible = false;

    drawnCardEl.className = "drawn-card is-empty";
    drawnCardEl.innerHTML = '<p class="placeholder">Appuyez sur <strong>Tirer une option</strong> pour en révéler une.</p>';

    renderCounters();
    renderHistory();
    renderAnswerPanels();
    setStatus(message);
}

function drawCard() {
    if (state.deck.length === 0) {
        setStatus("Plus d'options disponibles. Mélangez pour recommencer.");
        return;
    }

    const option = state.deck.pop();
    state.drawn.push(option);
    state.currentCard = option;
    state.isAnswerVisible = false;

    showCard(option);
    renderCounters();
    renderHistory();
    renderAnswerPanels();
    setStatus(`Vous avez tiré ${formatOptionLabel(option)}.`);
}

function toggleAnswer() {
    if (!state.currentCard) {
        return;
    }

    state.isAnswerVisible = !state.isAnswerVisible;
    renderAnswerPanels();
}

function togglePresenterAnswer() {
    presenterAnswerBtn.focus();
}

shuffleBtn.addEventListener("click", () => resetDeck("Options remélangées."));
drawBtn.addEventListener("click", drawCard);
showAnswerBtn.addEventListener("click", toggleAnswer);
presenterAnswerBtn.addEventListener("click", togglePresenterAnswer);

document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePresenterAnswer();
    }
});

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
