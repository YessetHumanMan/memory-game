'use strict';

const CARD_DATA = [
  { pairId: 'star', image: './assets/cards/star.svg', name: 'Star' },
  { pairId: 'sun', image: './assets/cards/sun.svg', name: 'Sun' },
  { pairId: 'mountain', image: './assets/cards/mountain.svg', name: 'Mountain' },
  { pairId: 'diamond', image: './assets/cards/diamond.svg', name: 'Diamond' },
  { pairId: 'flower', image: './assets/cards/flower.svg', name: 'Flower' },
  { pairId: 'moon', image: './assets/cards/moon.svg', name: 'Moon' },
  { pairId: 'castle', image: './assets/cards/castle.svg', name: 'Castle' },
  { pairId: 'spark', image: './assets/cards/spark.svg', name: 'Spark' },
];
const TOTAL_PAIRS = CARD_DATA.length;
const MISMATCH_DELAY = 1000;
const MAX_LEADERBOARD_RESULTS = 10;
const STORAGE_KEY = 'memory-game-results';

const state = {
  cards: [],
  firstCardId: null,
  secondCardId: null,
  moves: 0,
  matchedPairs: 0,
  isLocked: false,
  isCompleted: false,
  mismatchTimerId: null,
  resultSaved: false,
  gameId: 0,
};

const elements = {
  board: null,
  moves: null,
  pairs: null,
  hint: null,
  newGameButton: null,
  leaderboardButton: null,
  modalOverlay: null,
  modalDialog: null,
  modalContent: null,
  backgroundSections: [],
};

let previouslyFocusedElement = null;
let modalAnimationFrameId = null;

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
  }

  return element;
}

function createBrand() {
  const brand = createElement('a', {
    className: 'brand',
    attributes: { href: '#game', 'aria-label': 'Memory Game home' },
  });
  const brandMark = createElement('span', {
    className: 'brand__mark',
    text: 'M',
    attributes: { 'aria-hidden': 'true' },
  });
  const brandText = createElement('span', {
    className: 'brand__text',
    text: 'Memory',
  });

  brand.append(brandMark, brandText);
  return brand;
}

function createHeaderButton(text, variant, action) {
  return createElement('button', {
    className: `button button--${variant}`,
    text,
    attributes: { type: 'button', 'data-action': action },
  });
}

function createHeader() {
  const header = createElement('header', { className: 'header' });
  const headerInner = createElement('div', {
    className: 'header__inner container',
  });
  const actions = createElement('div', {
    className: 'header__actions',
  });

  actions.append(
    createHeaderButton('Leaderboard', 'ghost', 'leaderboard'),
    createHeaderButton('New game', 'primary', 'new-game'),
  );
  headerInner.append(createBrand(), actions);
  header.append(headerInner);

  return header;
}

function createStat(label, value, modifier) {
  const stat = createElement('div', {
    className: `stat stat--${modifier}`,
  });
  const statLabel = createElement('span', {
    className: 'stat__label',
    text: label,
  });
  const statValue = createElement('strong', {
    className: 'stat__value',
    text: value,
    attributes: {
      id: `${modifier}-value`,
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  });

  stat.append(statLabel, statValue);
  return stat;
}

function createGameIntro() {
  const intro = createElement('section', {
    className: 'game-intro',
    attributes: { 'aria-labelledby': 'game-title' },
  });
  const copy = createElement('div', { className: 'game-intro__copy' });
  const eyebrow = createElement('p', {
    className: 'eyebrow',
    text: 'Train your memory',
  });
  const title = createElement('h1', {
    className: 'game-intro__title',
    text: 'Find every pair.',
    attributes: { id: 'game-title' },
  });
  const description = createElement('p', {
    className: 'game-intro__description',
    text: 'Turn over two cards at a time and match all eight pairs in the fewest moves.',
  });
  const stats = createElement('div', {
    className: 'stats',
    attributes: { 'aria-label': 'Game statistics' },
  });

  copy.append(eyebrow, title, description);
  stats.append(
    createStat('Moves', '0', 'moves'),
    createStat('Pairs', `0 / ${TOTAL_PAIRS}`, 'pairs'),
  );
  intro.append(copy, stats);

  return intro;
}

function createCard(cardData, index) {
  const card = createElement('button', {
    className: `card${cardData.status === 'hidden' ? '' : ` is-${cardData.status}`}`,
    attributes: {
      type: 'button',
      'data-card-id': cardData.id,
      'data-pair-id': cardData.pairId,
      'aria-label': getCardLabel(cardData, index),
    },
  });
  const cardInner = createElement('span', {
    className: 'card__inner',
    attributes: { 'aria-hidden': 'true' },
  });
  const back = createElement('span', { className: 'card__face card__back' });
  const backMark = createElement('span', {
    className: 'card__back-mark',
    text: 'M',
  });
  const front = createElement('span', {
    className: 'card__face card__front',
  });
  const cardImage = createElement('img', {
    className: 'card__image',
    attributes: {
      src: cardData.image,
      alt: '',
      draggable: 'false',
    },
  });

  back.append(backMark);
  front.append(cardImage);
  cardInner.append(back, front);
  card.append(cardInner);
  card.disabled = isCardUnavailable(cardData);

  return card;
}

function createBoard() {
  const boardSection = createElement('section', {
    className: 'board-shell',
    attributes: { 'aria-labelledby': 'board-title' },
  });
  const boardHeader = createElement('div', { className: 'board-shell__header' });
  const boardTitle = createElement('h2', {
    className: 'board-shell__title',
    text: 'Game board',
    attributes: { id: 'board-title' },
  });
  const hint = createElement('p', {
    className: 'board-shell__hint',
    text: 'Select two cards',
    attributes: { id: 'board-hint', 'aria-live': 'polite' },
  });
  const board = createElement('div', {
    className: 'game-board',
    attributes: { id: 'game-board' },
  });

  board.addEventListener('click', handleBoardClick);
  boardHeader.append(boardTitle, hint);
  boardSection.append(boardHeader, board);

  return boardSection;
}

function createModal() {
  const overlay = createElement('div', {
    className: 'modal-overlay',
    attributes: { id: 'modal-overlay', 'aria-hidden': 'true', hidden: '' },
  });
  const dialog = createElement('div', {
    className: 'modal',
    attributes: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
      tabindex: '-1',
    },
  });
  const content = createElement('div', {
    className: 'modal__content',
    attributes: { id: 'modal-content' },
  });

  dialog.append(content);
  overlay.append(dialog);
  overlay.addEventListener('click', handleOverlayClick);

  return overlay;
}

function createFooter() {
  const footer = createElement('footer', { className: 'footer' });
  const footerText = createElement('p', {
    className: 'footer__text container',
    text: 'Stay focused. Trust your memory.',
  });

  footer.append(footerText);
  return footer;
}

function createApp() {
  const app = createElement('div', { className: 'app' });
  const main = createElement('main', {
    className: 'main container',
    attributes: { id: 'game' },
  });

  main.append(createGameIntro(), createBoard());
  app.append(createHeader(), main, createFooter(), createModal());
  document.body.append(app);
}

function shuffle(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

function createDeck() {
  const cards = CARD_DATA.flatMap((card) => [1, 2].map((copyNumber) => ({
    ...card,
    id: `${card.pairId}-${copyNumber}`,
    status: 'hidden',
  })));

  return shuffle(cards);
}

function getCardLabel(card, index) {
  if (card.status === 'hidden') {
    return `Closed card ${index + 1}`;
  }

  if (card.status === 'matched') {
    return `Matched card: ${card.name}`;
  }

  return `Open card: ${card.name}`;
}

function renderBoard() {
  const cardElements = state.cards.map((card, index) => createCard(card, index));
  elements.board.replaceChildren(...cardElements);
}

function isCardUnavailable(card) {
  return card.status !== 'hidden' || state.isLocked || state.isCompleted;
}

function updateCard(cardId) {
  const cardIndex = state.cards.findIndex((card) => card.id === cardId);
  const card = state.cards[cardIndex];
  const cardElement = elements.board.querySelector(`[data-card-id="${cardId}"]`);

  if (!card || !cardElement) {
    return;
  }

  cardElement.classList.toggle('is-open', card.status === 'open');
  cardElement.classList.toggle('is-matched', card.status === 'matched');
  cardElement.setAttribute('aria-label', getCardLabel(card, cardIndex));
  cardElement.disabled = isCardUnavailable(card);
}

function updateCardAvailability() {
  state.cards.forEach((card) => {
    const cardElement = elements.board.querySelector(`[data-card-id="${card.id}"]`);

    if (cardElement) {
      cardElement.disabled = isCardUnavailable(card);
    }
  });
}

function updateCounters() {
  elements.moves.textContent = String(state.moves);
  elements.pairs.textContent = `${state.matchedPairs} / ${TOTAL_PAIRS}`;
}

function resetSelection() {
  state.firstCardId = null;
  state.secondCardId = null;
}

function handleMatchingCards(firstCard, secondCard) {
  firstCard.status = 'matched';
  secondCard.status = 'matched';
  state.matchedPairs += 1;
  state.isLocked = false;
  resetSelection();
  updateCard(firstCard.id);
  updateCard(secondCard.id);
  updateCounters();

  if (state.matchedPairs === TOTAL_PAIRS) {
    state.isCompleted = true;
    updateCardAvailability();
    elements.hint.textContent = 'All pairs found!';
    saveCompletedGame();
    showVictoryModal();
    return;
  }

  updateCardAvailability();
  elements.hint.textContent = 'Pair found — keep going';
}

function handleMismatchedCards(firstCard, secondCard) {
  const currentGameId = state.gameId;
  elements.hint.textContent = 'Not a match — remember their places';

  state.mismatchTimerId = window.setTimeout(() => {
    if (currentGameId !== state.gameId) {
      return;
    }

    firstCard.status = 'hidden';
    secondCard.status = 'hidden';
    resetSelection();
    state.isLocked = false;
    state.mismatchTimerId = null;
    updateCard(firstCard.id);
    updateCard(secondCard.id);
    updateCardAvailability();
    elements.hint.textContent = 'Select two cards';
  }, MISMATCH_DELAY);
}

function selectCard(card) {
  card.status = 'open';
  updateCard(card.id);

  if (state.firstCardId === null) {
    state.firstCardId = card.id;
    elements.hint.textContent = 'Now find its match';
    return;
  }

  state.secondCardId = card.id;
  state.moves += 1;
  state.isLocked = true;
  updateCounters();
  updateCardAvailability();

  const firstCard = state.cards.find(({ id }) => id === state.firstCardId);

  if (firstCard.pairId === card.pairId) {
    handleMatchingCards(firstCard, card);
  } else {
    handleMismatchedCards(firstCard, card);
  }
}

function handleBoardClick(event) {
  const cardElement = event.target.closest('.card');

  if (!cardElement || !elements.board.contains(cardElement)) {
    return;
  }

  const card = state.cards.find(({ id }) => id === cardElement.dataset.cardId);

  if (
    !card
    || state.isLocked
    || state.isCompleted
    || card.status !== 'hidden'
  ) {
    return;
  }

  selectCard(card);
}

function setBackgroundInert(isInert) {
  elements.backgroundSections.forEach((section) => {
    section.inert = isInert;
  });
}

function getModalFocusableElements() {
  return [...elements.modalDialog.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )];
}

function openModal(content, initialFocusElement) {
  if (elements.modalOverlay.hidden) {
    previouslyFocusedElement = document.activeElement;
  }

  if (modalAnimationFrameId !== null) {
    window.cancelAnimationFrame(modalAnimationFrameId);
  }

  elements.modalContent.replaceChildren(content);
  elements.modalOverlay.hidden = false;
  elements.modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setBackgroundInert(true);

  modalAnimationFrameId = window.requestAnimationFrame(() => {
    modalAnimationFrameId = null;

    if (elements.modalOverlay.hidden) {
      return;
    }

    elements.modalOverlay.classList.add('is-visible');
    (initialFocusElement || elements.modalDialog).focus();
  });
}

function closeModal() {
  if (elements.modalOverlay.hidden) {
    return;
  }

  if (modalAnimationFrameId !== null) {
    window.cancelAnimationFrame(modalAnimationFrameId);
    modalAnimationFrameId = null;
  }

  elements.modalOverlay.classList.remove('is-visible');
  elements.modalOverlay.hidden = true;
  elements.modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  setBackgroundInert(false);
  elements.modalContent.replaceChildren();

  const canRestorePreviousFocus = previouslyFocusedElement?.isConnected
    && !previouslyFocusedElement.disabled;
  const focusTarget = canRestorePreviousFocus
    ? previouslyFocusedElement
    : elements.newGameButton;

  focusTarget?.focus();
  previouslyFocusedElement = null;
}

function handleOverlayClick(event) {
  if (event.target === elements.modalOverlay) {
    closeModal();
  }
}

function handleModalKeydown(event) {
  if (elements.modalOverlay.hidden) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getModalFocusableElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    elements.modalDialog.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const activeElement = document.activeElement;

  if (!elements.modalDialog.contains(activeElement)) {
    event.preventDefault();
    firstElement.focus();
  } else if (
    event.shiftKey
    && (activeElement === firstElement || activeElement === elements.modalDialog)
  ) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function createVictoryContent() {
  const content = createElement('div', { className: 'victory' });
  const badge = createElement('div', {
    className: 'victory__badge',
    text: '✦',
    attributes: { 'aria-hidden': 'true' },
  });
  const eyebrow = createElement('p', {
    className: 'modal__eyebrow',
    text: 'Board complete',
  });
  const title = createElement('h2', {
    className: 'modal__title',
    text: 'Brilliant memory!',
    attributes: { id: 'modal-title' },
  });
  const message = createElement('p', {
    className: 'modal__message',
    text: `You found all ${TOTAL_PAIRS} pairs in ${state.moves} moves.`,
  });
  const actions = createElement('div', { className: 'modal__actions' });
  const newGameButton = createHeaderButton('New game', 'primary', 'modal-new-game');
  const closeButton = createHeaderButton('Close', 'ghost', 'close-modal');

  newGameButton.addEventListener('click', () => {
    closeModal();
    startGame();
  });
  closeButton.addEventListener('click', closeModal);
  actions.append(newGameButton, closeButton);
  content.append(badge, eyebrow, title, message, actions);

  return { content, initialFocusElement: newGameButton };
}

function showVictoryModal() {
  const { content, initialFocusElement } = createVictoryContent();
  openModal(content, initialFocusElement);
}

function isValidResult(result) {
  return result
    && Number.isInteger(result.moves)
    && result.moves > 0
    && Number.isFinite(result.completedAt)
    && result.completedAt > 0
    && !Number.isNaN(new Date(result.completedAt).getTime());
}

function sortResults(results) {
  return [...results].sort((firstResult, secondResult) => {
    if (firstResult.moves !== secondResult.moves) {
      return firstResult.moves - secondResult.moves;
    }

    return firstResult.completedAt - secondResult.completedAt;
  });
}

function loadResults() {
  try {
    const savedResults = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(savedResults)) {
      return [];
    }

    return sortResults(savedResults.filter(isValidResult))
      .slice(0, MAX_LEADERBOARD_RESULTS);
  } catch {
    return [];
  }
}

function storeResults(results) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function saveCompletedGame() {
  if (state.resultSaved) {
    return;
  }

  const updatedResults = sortResults([
    ...loadResults(),
    { moves: state.moves, completedAt: Date.now() },
  ]).slice(0, MAX_LEADERBOARD_RESULTS);

  storeResults(updatedResults);
  state.resultSaved = true;
}

function formatResultDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}.${month}.${date.getFullYear()}`;
}

function createLeaderboardTable(results) {
  const tableWrapper = createElement('div', { className: 'leaderboard__table-wrapper' });
  const table = createElement('table', { className: 'leaderboard__table' });
  const caption = createElement('caption', {
    className: 'visually-hidden',
    text: 'Best completed Memory Game results',
  });
  const tableHead = createElement('thead');
  const headingRow = createElement('tr');

  ['Place', 'Moves', 'Date'].forEach((heading) => {
    headingRow.append(createElement('th', {
      text: heading,
      attributes: { scope: 'col' },
    }));
  });

  tableHead.append(headingRow);
  const tableBody = createElement('tbody');

  results.forEach((result, index) => {
    const row = createElement('tr');
    const placeCell = createElement('th', {
      text: String(index + 1),
      attributes: { scope: 'row' },
    });
    const movesCell = createElement('td', { text: String(result.moves) });
    const dateCell = createElement('td', {
      text: formatResultDate(result.completedAt),
    });

    row.append(placeCell, movesCell, dateCell);
    tableBody.append(row);
  });

  table.append(caption, tableHead, tableBody);
  tableWrapper.append(table);

  return tableWrapper;
}

function createLeaderboardContent() {
  const results = loadResults();
  const content = createElement('div', { className: 'leaderboard' });
  const eyebrow = createElement('p', {
    className: 'modal__eyebrow',
    text: 'Hall of fame',
  });
  const title = createElement('h2', {
    className: 'modal__title leaderboard__title',
    text: 'Leaderboard',
    attributes: { id: 'modal-title' },
  });
  const description = createElement('p', {
    className: 'modal__message leaderboard__description',
    text: 'The ten best games, ranked by the fewest moves.',
  });
  const actions = createElement('div', { className: 'modal__actions' });
  const closeButton = createHeaderButton('Close', 'primary', 'close-modal');

  if (results.length > 0) {
    content.append(eyebrow, title, description, createLeaderboardTable(results));
  } else {
    const emptyState = createElement('div', { className: 'leaderboard__empty' });
    const emptyMark = createElement('span', {
      className: 'leaderboard__empty-mark',
      text: '—',
      attributes: { 'aria-hidden': 'true' },
    });
    const emptyMessage = createElement('p', {
      className: 'leaderboard__empty-message',
      text: 'No results yet. Complete a game to take the first place.',
    });

    emptyState.append(emptyMark, emptyMessage);
    content.append(eyebrow, title, description, emptyState);
  }

  closeButton.addEventListener('click', closeModal);
  actions.append(closeButton);
  content.append(actions);

  return { content, initialFocusElement: closeButton };
}

function showLeaderboardModal() {
  const { content, initialFocusElement } = createLeaderboardContent();
  openModal(content, initialFocusElement);
}

function cancelMismatchTimer() {
  if (state.mismatchTimerId !== null) {
    window.clearTimeout(state.mismatchTimerId);
    state.mismatchTimerId = null;
  }
}

function startGame() {
  cancelMismatchTimer();
  closeModal();
  state.gameId += 1;
  state.cards = createDeck();
  state.firstCardId = null;
  state.secondCardId = null;
  state.moves = 0;
  state.matchedPairs = 0;
  state.isLocked = false;
  state.isCompleted = false;
  state.mismatchTimerId = null;
  state.resultSaved = false;

  renderBoard();
  updateCounters();
  elements.hint.textContent = 'Select two cards';
}

function initializeApp() {
  createApp();
  elements.board = document.getElementById('game-board');
  elements.moves = document.getElementById('moves-value');
  elements.pairs = document.getElementById('pairs-value');
  elements.hint = document.getElementById('board-hint');
  elements.newGameButton = document.querySelector('[data-action="new-game"]');
  elements.leaderboardButton = document.querySelector('[data-action="leaderboard"]');
  elements.modalOverlay = document.getElementById('modal-overlay');
  elements.modalDialog = elements.modalOverlay.querySelector('.modal');
  elements.modalContent = document.getElementById('modal-content');
  elements.backgroundSections = [
    document.querySelector('.header'),
    document.querySelector('.main'),
    document.querySelector('.footer'),
  ];

  elements.newGameButton.addEventListener('click', startGame);
  elements.leaderboardButton.addEventListener('click', showLeaderboardModal);
  document.addEventListener('keydown', handleModalKeydown);
  startGame();
}

initializeApp();
