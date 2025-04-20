export type Color = 'red' | 'yellow' | 'green' | 'blue';
export type Attack = 'skip' | 'reverse' | 'draw-two';
export type Card =
  | { type: 'number'; id: string; number: number; color: Color }
  | { type: 'attack'; id: string; attack: Attack; color: Color }
  | { type: 'wild'; id: string }
  | { type: 'draw-four'; id: string };

export type Deck = { cards: Card[] };

export type Player = {
  id: string;
  handle: string;
};

export type CurrentColor = Color | 'any';

export type NextAction =
  | { type: 'choose-color'; player: Player }
  | { type: 'draw-four'; player: Player; cardsLeft: number }
  | { type: 'draw-two'; player: Player; cardsLeft: number }
  | { type: 'play'; player: Player }
  | { type: 'finished'; player: Player };

export type Game = {
  id: string;
  // Order of players in the list is the player order
  // Dealer should be the last player in the list
  players: Player[];
  playerHands: Record<string, Card[]>;
  activePlayerIdx: number;
  currentColor: CurrentColor;
  discard: Card[];
  drawPile: Card[];
  reverseDirection: boolean;
  nextActions: NextAction[];
};
export const colors: Color[] = ['red', 'yellow', 'green', 'blue'];
const attacks: Attack[] = ['skip', 'reverse', 'draw-two'];

export const makeDeck = (): Deck => {
  const cards: Card[] = [];
  for (const color of colors) {
    for (const number of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      cards.push({
        type: 'number',
        number,
        color,
        id: `number-${number}-${color}-1`,
      });
    }
    // only 1 set of zeros
    for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      cards.push({
        type: 'number',
        number,
        color,
        id: `number-${number}-${color}-2`,
      });
    }
    for (const attack of attacks) {
      cards.push({
        type: 'attack',
        attack,
        color,
        id: `attack-${attack}-${color}-1`,
      });
      cards.push({
        type: 'attack',
        attack,
        color,
        id: `attack-${attack}-${color}-2`,
      });
    }
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ type: 'wild', id: `wild-${i + 1}` });
    cards.push({ type: 'draw-four', id: `draw-four-${i + 1}` });
  }
  return { cards };
};

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const defaultCardsPerPerson = 7;

function startingIdx(players: Player[], card: Card): number {
  if (players.length === 2 && card.type === 'attack') {
    return 1;
  }
  if (card.type === 'attack' && card.attack === 'reverse') {
    return players.length - 1;
  }

  if (card.type === 'attack' && card.attack === 'skip') {
    return 1 % players.length;
  }
  return 0;
}

function startingCardAction(players: Player[], card: Card): NextAction {
  if (card.type === 'attack' && card.attack === 'draw-two') {
    return { type: 'draw-two', cardsLeft: 2, player: players[0] };
  }
  return { type: 'play', player: players[startingIdx(players, card)] };
}

export const deal = ({
  id,
  players,
  cardsPerPerson = defaultCardsPerPerson,
}: {
  id: string;
  players: Player[];
  cardsPerPerson?: number;
}): Game => {
  // XXX: Ensure less than MaxPlayer players
  //      but see what happpens if you don't
  let cards = shuffle(makeDeck().cards);
  const playerHands: Record<string, Card[]> = {};
  for (const player of players) {
    playerHands[player.id] = [];
  }

  for (let i = 0; i < cardsPerPerson; i++) {
    for (const player of players) {
      const card = cards.pop();
      if (card) {
        playerHands[player.id].push(card);
      }
    }
  }

  let startingCard = cards.pop();
  const invalidStartingCards = [];
  while (true) {
    if (startingCard == null) {
      throw new Error(
        'Not enough cards. Reduce the number of players or the number of cards per person'
      );
    }
    if (startingCard.type === 'draw-four') {
      invalidStartingCards.push(startingCard);
      startingCard = cards.pop();
      continue;
    }
    break;
  }

  if (invalidStartingCards.length) {
    cards.push(...invalidStartingCards);
    cards = shuffle(cards);
  }

  if (startingCard == null) {
    // Just for typescript
    throw new Error('No starting card');
  }

  const startingPlayerIdx = startingIdx(players, startingCard);

  return {
    id,
    players,
    playerHands,
    activePlayerIdx: startingPlayerIdx,
    currentColor: startingCard.type === 'wild' ? 'any' : startingCard.color,
    discard: [startingCard],
    drawPile: cards,
    nextActions: [startingCardAction(players, startingCard)],
    reverseDirection:
      startingCard.type === 'attack' && startingCard.attack === 'reverse',
  };
};

export function canPlayCard({
  card,
  baseCard,
  currentColor,
}: {
  card: Card;
  baseCard: Card;
  currentColor: CurrentColor;
}): boolean {
  if (card.type === 'draw-four' || card.type === 'wild') {
    return true;
  }
  if (card.color === currentColor || currentColor === 'any') {
    return true;
  }

  if (baseCard.type === 'attack' && card.type === 'attack') {
    return baseCard.attack === card.attack;
  }

  if (card.type === 'number' && baseCard.type === 'number') {
    return baseCard.number === card.number;
  }

  return false;
}

export function canDrawCard({
  player,
  game,
}: {
  player: Player;
  game: Game;
}): boolean {
  const action = game.nextActions[0];
  if (!action || action.player.id !== player.id) {
    return false;
  }
  switch (action.type) {
    case 'choose-color':
    case 'finished': {
      return false;
    }
    case 'draw-four':
    case 'draw-two': {
      return true;
    }
    case 'play': {
      const baseCard = game.discard[game.discard.length - 1];
      const availableCard = game.playerHands[player.id].find((card) =>
        canPlayCard({ card, baseCard, currentColor: game.currentColor })
      );
      return !availableCard;
    }
  }
}

function incrementPlay(
  activeIndex: number,
  increment: number,
  playerCount: number
) {
  const i = (activeIndex + increment) % playerCount;
  if (i < 0) {
    return playerCount + i;
  }
  return i;
}

function advancePlayerIdx(game: Game, card: Card): number {
  if (
    game.players.length === 2 &&
    (card.type === 'attack' || card.type === 'draw-four')
  ) {
    return game.activePlayerIdx;
  }
  if (card.type === 'attack' && card.attack === 'reverse') {
    const increment = game.reverseDirection ? 1 : -1;
    return incrementPlay(game.activePlayerIdx, increment, game.players.length);
  }
  const increment = game.reverseDirection ? -1 : 1;
  return incrementPlay(game.activePlayerIdx, increment, game.players.length);
}

function advancePlayer(game: Game, card: Card): Player {
  return game.players[advancePlayerIdx(game, card)];
}

function advanceColor(card: Card) {
  if (card.type === 'number' || card.type === 'attack') {
    return card.color;
  }
  return 'any';
}

function advanceAction(game: Game, card: Card): NextAction[] {
  switch (card.type) {
    case 'number': {
      return [{ type: 'play', player: advancePlayer(game, card) }];
    }
    case 'attack': {
      if (card.attack === 'draw-two') {
        return [
          {
            type: 'draw-two',
            cardsLeft: 2,
            player:
              game.players[
                incrementPlay(
                  game.activePlayerIdx,
                  game.reverseDirection ? -1 : 1,
                  game.players.length
                )
              ],
          },
        ];
      }
      return [{ type: 'play', player: advancePlayer(game, card) }];
    }
    case 'draw-four': {
      return [
        { type: 'choose-color', player: game.players[game.activePlayerIdx] },
        {
          type: 'draw-four',
          cardsLeft: 4,
          player:
            game.players[
              incrementPlay(
                game.activePlayerIdx,
                game.reverseDirection ? -1 : 1,
                game.players.length
              )
            ],
        },
      ];
    }
    case 'wild': {
      return [
        { type: 'choose-color', player: game.players[game.activePlayerIdx] },
      ];
    }
  }
}

export function playCard(game: Game, card: Card): Game {
  const currentPlayer = game.players[game.activePlayerIdx];
  const nextPlayerCards = [];
  let foundCard = false;
  for (const c of game.playerHands[currentPlayer.id]) {
    if (card.id === c.id) {
      foundCard = true;
    } else {
      nextPlayerCards.push(c);
    }
  }
  if (!foundCard) {
    throw new Error('Player does not have that card to play.');
  }

  const playerWon = nextPlayerCards.length === 0;

  return {
    ...game,
    playerHands: {
      ...game.playerHands,
      [currentPlayer.id]: nextPlayerCards,
    },
    activePlayerIdx: playerWon
      ? game.activePlayerIdx
      : advancePlayerIdx(game, card),
    currentColor: advanceColor(card),
    discard: [...game.discard, card],
    reverseDirection:
      card.type === 'attack' && card.attack === 'reverse'
        ? !game.reverseDirection
        : game.reverseDirection,
    nextActions: playerWon
      ? [{ type: 'finished', player: currentPlayer }]
      : advanceAction(game, card),
  };
}

export function chooseColor(game: Game, player: Player, color: Color): Game {
  const nextActions = [];
  let found = false;
  for (const action of game.nextActions) {
    if (action.type === 'choose-color' && action.player.id === player.id) {
      found = true;
    } else {
      nextActions.push(action);
    }
  }
  if (!found) {
    throw new Error('Did not find choose-color action.');
  }
  return {
    ...game,
    currentColor: color,
    nextActions: nextActions.length
      ? nextActions
      : [
          {
            type: 'play',
            player: game.players[game.activePlayerIdx],
          },
        ],
  };
}

// XXX: Need special handling for when the draw pile is empty

export function drawCard(game: Game, player: Player): Game {
  if (!canDrawCard({ player, game })) {
    throw new Error("Player can't draw a card.");
  }
  const action = game.nextActions.find(
    (a) =>
      a.player.id === player.id &&
      (a.type === 'draw-four' || a.type === 'draw-two' || a.type === 'play')
  );

  if (!action) {
    throw new Error('No draw card action');
  }

  const nextActions = game.nextActions.filter((a) => a !== action);

  const [card, ...drawPile] = game.drawPile;
  const playerHands = {
    ...game.playerHands,
    [player.id]: [...game.playerHands[player.id], card],
  };

  switch (action.type) {
    case 'draw-four':
    case 'draw-two': {
      const remaining = action.cardsLeft - 1;
      if (remaining !== 0) {
        nextActions.push({
          type: action.type,
          cardsLeft: remaining,
          player: action.player,
        });
      } else if (!nextActions.length) {
        nextActions.push({
          type: 'play',
          player: game.players[game.activePlayerIdx],
        });
      }
      break;
    }
    case 'play': {
      nextActions.push({
        type: 'play',
        player:
          game.players[
            incrementPlay(
              game.activePlayerIdx,
              game.reverseDirection ? -1 : 1,
              game.players.length
            )
          ],
      });
      break;
    }
    case 'choose-color':
    case 'finished': {
      break;
    }
  }

  let discard = game.discard;
  // Move the discard to the draw pile if we're about to run out
  if (drawPile.length < 2) {
    const baseCard = game.discard[game.discard.length - 1];
    if (baseCard) {
      discard = [baseCard];
      drawPile.push(...shuffle(game.discard.slice(0, game.discard.length - 1)));
    }
  }

  return {
    ...game,
    activePlayerIdx:
      action.type === 'play'
        ? incrementPlay(
            game.activePlayerIdx,
            game.reverseDirection ? -1 : 1,
            game.players.length
          )
        : game.activePlayerIdx,
    drawPile,
    discard,
    playerHands,
    nextActions,
  };
}
