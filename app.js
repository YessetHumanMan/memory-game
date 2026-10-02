'use strict';

const CARD_SYMBOLS = ['✦', '●', '▲', '◆', '✿', '☾', '♜', '❖'];
const TOTAL_PAIRS = CARD_SYMBOLS.length;

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

function createCard(symbol, index) {
  const card = createElement('button', {
    className: 'card',
    attributes: {
      type: 'button',
      'data-card-index': String(index),
      'aria-label': `Closed card ${index + 1}`,
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
  const symbolElement = createElement('span', {
    className: 'card__symbol',
    text: symbol,
  });

  back.append(backMark);
  front.append(symbolElement);
  cardInner.append(back, front);
  card.append(cardInner);

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
  });
  const board = createElement('div', {
    className: 'game-board',
    attributes: { id: 'game-board' },
  });
  const cardValues = [...CARD_SYMBOLS, ...CARD_SYMBOLS];

  cardValues.forEach((symbol, index) => {
    board.append(createCard(symbol, index));
  });

  boardHeader.append(boardTitle, hint);
  boardSection.append(boardHeader, board);

  return boardSection;
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
  app.append(createHeader(), main, createFooter());
  document.body.append(app);
}

createApp();
