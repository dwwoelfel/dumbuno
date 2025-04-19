'use client';

import { useEffect, useRef, useState } from 'react';
import { IconBan, IconRefresh, IconShare } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  CopyButton,
  Flex,
  Group,
  Loader,
  MantineTheme,
  rem,
  rgba,
  RingProgress,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { useOs } from '@mantine/hooks';
import db from '@/lib/db';
import {
  canDrawCard,
  canPlayCard,
  chooseColor,
  Color,
  colors,
  CurrentColor,
  drawCard,
  NextAction,
  playCard,
  type Card as DumbunoCard,
  type Game,
  type Player,
} from '@/lib/game';
import classes from './Game.module.css';

function themeBackgroundColorOfColor(
  theme: MantineTheme,
  color: Color
): string {
  return theme.colors[color][6];
}

function getCardBackgroundColor(
  card: DumbunoCard,
  theme: MantineTheme
): string {
  if (card.type === 'wild' || card.type === 'draw-four') {
    return theme.colors.dark[7]; // Black for wild cards
  }
  return themeBackgroundColorOfColor(theme, card.color);
}

// Determine text/icon color based on background for contrast
function getContentColor(
  _backgroundColor: string,
  theme: MantineTheme
): string {
  // Simple contrast check - yellow background needs dark text, others can use white
  /* if (backgroundColor === theme.colors.yellow[6]) {
    return theme.black;
  } */
  return theme.white;
}

// --- Components ---

function WildCircle({
  size = 60,
  currentColor,
}: {
  size?: number;
  currentColor?: CurrentColor;
}) {
  return (
    <RingProgress
      size={size}
      thickness={Math.max(4, size / 5)} // Adjust thickness based on size
      roundCaps
      sections={
        currentColor && currentColor !== 'any'
          ? [{ value: 100, color: currentColor }]
          : [
              { value: 25, color: 'green' },
              { value: 25, color: 'blue' },
              { value: 25, color: 'yellow' },
              { value: 25, color: 'red' },
            ]
      }
    />
  );
}

function TinyCard({ color }: { color: Color }) {
  const theme = useMantineTheme();
  return (
    <Card
      withBorder
      w={rem(1)} // Adjust size as needed
      h={rem(50)} // Adjust size as needed
      bg={getCardBackgroundColor(
        { type: 'number', number: 0, color, id: '' },
        theme
      )}
      radius="md"
      shadow="md"
      // Optional: add a subtle border for better definition, especially for white cards
      style={{
        border: `2px solid ${rgba(color === theme.white ? theme.black : theme.white, 0.7)}`,
        transform: 'scale(0.8)',
      }}
    />
  );
}

// Renders the appropriate symbol (number, icon, text, wild)
function CardSymbol({
  card,
  size = 'lg',
  currentColor,
}: {
  card: DumbunoCard;
  size?: 'sm' | 'lg';
  currentColor?: CurrentColor;
}) {
  const iconSize = size === 'sm' ? rem(18) : rem(60);
  const textSize = size === 'sm' ? 'md' : rem(50); // Larger text size for center
  const fontWeight = size === 'sm' ? 500 : 700;
  const wildCircleSize = size === 'sm' ? 20 : 60;

  if (card.type === 'number') {
    return (
      <Text size={textSize} fw={fontWeight} lh={1}>
        {card.number}
      </Text>
    );
  }
  if (card.type === 'attack') {
    if (card.attack === 'reverse') {
      return <IconRefresh style={{ width: iconSize, height: iconSize }} />;
    }
    if (card.attack === 'skip') {
      return <IconBan style={{ width: iconSize, height: iconSize }} />;
    }
    if (card.attack === 'draw-two') {
      if (size === 'lg') {
        return (
          <Group
            gap={rem(2)}
            justify="center"
            wrap="nowrap"
            style={{ transform: 'rotate(24deg)', position: 'relative' }}
          >
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: -5,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <TinyCard color={card.color} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 5,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <TinyCard color={card.color} />
            </div>
          </Group>
        );
      }
      return (
        <Text size={textSize} fw={fontWeight} lh={1}>
          +2
        </Text>
      );
    }
  }
  if (card.type === 'wild') {
    return <WildCircle currentColor={currentColor} size={wildCircleSize} />;
  }
  if (card.type === 'draw-four') {
    if (size === 'lg') {
      const overrideColor = currentColor === 'any' ? null : currentColor;
      return (
        <Group
          gap={rem(2)}
          justify="center"
          wrap="nowrap"
          style={{ transform: 'rotate(24deg)', position: 'relative' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 15,
              top: 0,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TinyCard color={overrideColor || 'yellow'} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: -15,
              top: 0,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TinyCard color={overrideColor || 'red'} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 10,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TinyCard color={overrideColor || 'blue'} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: -5,
              top: -10,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TinyCard color={overrideColor || 'green'} />
          </div>
        </Group>
      );
    }

    return (
      <Text size={textSize} fw={fontWeight} lh={1}>
        +4
      </Text>
    );
  }
  return null;
}

// The main Dumbuno Card Component
function DumbunoCard({
  card,
  hide,
  currentColor,
}: {
  card: DumbunoCard;
  hide?: boolean;
  currentColor?: CurrentColor;
}) {
  const theme = useMantineTheme();
  const backgroundColor = getCardBackgroundColor(
    hide ? { type: 'wild', id: '' } : card,
    theme
  );
  const contentColor = getContentColor(backgroundColor, theme);

  const cardWidth = rem(100);
  const cardHeight = rem(150); // Typical card aspect ratio

  return (
    <Card
      shadow="md"
      padding={0}
      radius="md"
      withBorder
      style={{
        width: cardWidth,
        height: cardHeight,
        backgroundColor,
        color: contentColor,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {hide ? null : (
        <Box
          pos="absolute"
          top={theme.spacing.xs}
          left={theme.spacing.sm}
          //style={{ transform: 'rotate(15deg)' }}
        >
          <CardSymbol card={card} size="sm" currentColor={currentColor} />
        </Box>
      )}

      <Center
        pos="absolute"
        top="50%"
        left="50%"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {hide ? (
          <Center>
            <Flex direction="column" align="center">
              <Text size="lg" fw={700} lh={1}>
                Dumb
              </Text>

              <Text size="lg" fw={700} lh={1}>
                Uno
              </Text>
            </Flex>
          </Center>
        ) : (
          <CardSymbol card={card} size="lg" currentColor={currentColor} />
        )}
      </Center>

      {hide ? null : (
        <Box
          pos="absolute"
          bottom={theme.spacing.xs}
          right={theme.spacing.sm}
          //style={{ transform: 'rotate(15deg)' }}
        >
          <CardSymbol card={card} size="sm" currentColor={currentColor} />
        </Box>
      )}
    </Card>
  );
}

type ActionHandler = (
  action:
    | { type: 'play'; card: DumbunoCard }
    | { type: 'choose-color'; color: Color; player: Player }
    | { type: 'draw-card' }
) => string | undefined;

// XXX: Need to put them in multiple groups if we get too many in a hand
function PlayerHand({
  cards,
  cardWidth = rem(80), // Default width for cards in hand
  maxSpreadAngle = 30, // Default max angle deviation from center
  originY = '150%', // Default origin below the card creates a nice fan arc
  hideCards,
  canPlay,
  onAction,
  isMe,
}: {
  cards: DumbunoCard[];
  cardWidth?: string | number;
  maxSpreadAngle?: number;
  originY?: string;
  hideCards: boolean;
  canPlay: boolean;
  onAction: ActionHandler;
  isMe: boolean;
}) {
  const numCards = cards.length;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [triggerShake, setTriggerShake] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const os = useOs();

  const isMobile = os === 'android' || os === 'ios';

  useEffect(() => {
    if (!isMe) {
      return;
    }
    const listener = (e: TouchEvent) => {
      const el = containerRef.current;
      if (!el) {
        return;
      }
      const touch = e.changedTouches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const touchedElement = document.elementFromPoint(x, y);

      if (!el.contains(touchedElement)) {
        setHoveredCard(null);
        setSelectedCard(null);
      }
    };
    document.addEventListener('touchend', listener);
    return () => document.removeEventListener('touchend', listener);
  }, []);

  if (numCards === 0) {
    return null;
  }

  const selectedIdx = selectedCard
    ? cards.findIndex((c) => c.id === selectedCard)
    : cards.findIndex((c) => c.id === hoveredCard);

  const cardHeight = `calc(${typeof cardWidth === 'number' ? rem(cardWidth) : cardWidth} * 1.5)`;
  const angleInRadians = maxSpreadAngle * (Math.PI / 180);
  const estimatedLift = `calc(${typeof cardWidth === 'number' ? rem(cardWidth) : cardWidth} * ${Math.sin(angleInRadians).toFixed(3)})`;
  const containerMinHeight = `calc(${cardHeight} + ${estimatedLift} + ${rem(20)})`;

  return (
    <Box
      ref={containerRef}
      pos="relative"
      style={{
        minHeight: containerMinHeight,
        width: '100%',
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cardEl = el?.closest('[data-card-id]');
        if (cardEl) {
          setHoveredCard(cardEl.getAttribute('data-card-id'));
        }
      }}
      onTouchEnd={() => {
        setHoveredCard(null);
        if (selectedCard && selectedCard !== hoveredCard) {
          setSelectedCard(null);
        }
      }}
    >
      {cards.map((card, index) => {
        let rotation = 0;

        const rotationForIndex = (i: number): number => {
          const centerIndex = (numCards - 1) / 2;
          const deviationFromCenter = i - centerIndex;
          return centerIndex === 0
            ? 0
            : (deviationFromCenter / centerIndex) * maxSpreadAngle;
        };

        if (numCards > 1) {
          if (selectedIdx !== -1 && selectedIdx !== numCards - 1) {
            const hoveredRotation = rotationForIndex(selectedIdx);
            if (index < selectedIdx) {
              const minRotation = rotationForIndex(0);
              const spreadSize = (hoveredRotation - minRotation) / numCards / 2;
              rotation = minRotation + spreadSize * index;
            } else {
              const maxRotation = rotationForIndex(numCards - 1);
              const spreadSize = (maxRotation - hoveredRotation) / numCards / 2;
              rotation = maxRotation - spreadSize * (numCards - 1 - index);
            }

            if (index === selectedIdx) {
              rotation = rotationForIndex(index);
              if (rotation > 0) {
                rotation -= rotation * 0.8;
              }
            } else {
              rotation *= 1.4;
            }
          } else {
            rotation = rotationForIndex(index);
          }
        }

        const extraTransform =
          index === selectedIdx
            ? 'scale(1.03)'
            : selectedIdx != null
              ? 'scale(0.95)'
              : '';

        return (
          <Box
            key={card.id}
            className={`${classes['card-shakeable']} ${triggerShake === card.id ? classes['card-shake'] : ''}`}
          >
            <Box
              pos="absolute"
              bottom={0}
              left="50%"
              w={cardWidth}
              data-card-id={card.id}
              style={{
                transform: `translateX(-50%) rotate(${rotation}deg) ${extraTransform}`,
                transformOrigin: `50% ${originY}`,
                transition: 'transform 0.2s ease-out',
                cursor: canPlay ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onPointerEnter={() => {
                if (hideCards) {
                  return;
                }
                setHoveredCard(card.id);
              }}
              onPointerLeave={() => {
                if (hideCards) {
                  return;
                }
                setHoveredCard((current) =>
                  current === card.id ? null : current
                );
              }}
              onClick={() => {
                if (isMe && isMobile) {
                  const earlyReturn = selectedCard !== card.id;
                  setSelectedCard(card.id);
                  if (earlyReturn) {
                    return;
                  }
                }

                if (canPlay || isMe) {
                  setTriggerShake(null);

                  const error = onAction({ type: 'play', card });

                  if (error) {
                    setTimeout(() => setTriggerShake(card.id));
                  }
                }
              }}
            >
              <DumbunoCard card={card} hide={hideCards} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function PlayerActions({
  game,
  me,
  player,
  singlePlayer,
  onAction,
}: {
  game: Game;
  me: Player;
  player: Player;
  singlePlayer?: boolean;
  onAction: ActionHandler;
}) {
  const theme = useMantineTheme();

  if (!singlePlayer && player.id !== me.id) {
    return null;
  }
  const action = game.nextActions[0];

  if (action?.player.id !== player.id) {
    return <Text>{friendlyGameStatus(me, action)}</Text>;
  }

  switch (action.type) {
    case 'play': {
      return <Text>Your turn to play a card or draw.</Text>;
    }
    case 'draw-four':
    case 'draw-two': {
      return (
        <Text>
          You're under attack! Please draw {action.cardsLeft} more cards.
        </Text>
      );
    }
    case 'finished': {
      return <Text>You win!</Text>;
    }
    case 'choose-color': {
      return (
        <Box>
          <Text>Choose a color</Text>
          <Flex gap="sm">
            {colors.map((c) => (
              <Button
                variant="filled"
                color={themeBackgroundColorOfColor(theme, c)}
                key={c}
                onClick={() =>
                  onAction({
                    type: 'choose-color',
                    color: c,
                    player,
                  })
                }
              >
                {c}
              </Button>
            ))}
          </Flex>
        </Box>
      );
    }
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

function Players({
  game,
  me,
  onAction,
  singlePlayer,
}: {
  game: Game;
  me: Player;
  onAction: ActionHandler;
  singlePlayer?: boolean;
}) {
  const action = game.nextActions[0];
  return (
    <>
      {game.players.map((player) => {
        const cards = game.playerHands[player.id];
        const isMe = player.id === me.id;
        return (
          <div
            key={player.id}
            style={
              isMe
                ? {
                    position: 'absolute',
                    left: '50%',
                    bottom: '10%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                  }
                : {
                    position: 'absolute',
                    left: '50%',
                    top: '10%',
                    transform: 'translateX(-50%) rotate(180deg)',
                    width: '100%',
                  }
            }
          >
            {/* {isMe ? null : player.handle} */}
            <Flex align="center" justify="center" ml="1em" mr="1em">
              <PlayerActions
                game={game}
                me={me}
                player={player}
                singlePlayer={singlePlayer}
                onAction={onAction}
              />
            </Flex>
            <PlayerHand
              cards={cards}
              hideCards={!singlePlayer && !isMe}
              canPlay={
                action?.type === 'play' &&
                action.player.id === player.id &&
                (singlePlayer || isMe)
              }
              isMe={isMe}
              onAction={onAction}
            />
          </div>
        );
      })}
    </>
  );
}

function friendlyGameStatus(me: Player, action: NextAction): string {
  const handle = action.player.id === me.id ? 'you' : action.player.handle;
  switch (action.type) {
    case 'choose-color': {
      return `Waiting for ${handle} to pick a color.`;
    }
    case 'draw-four': {
      return `Waiting for ${handle} to draw four cards.`;
    }
    case 'draw-two': {
      return `Waiting for ${handle} to draw two cards.`;
    }
    case 'finished': {
      return `The winner is ${handle}!`;
    }
    case 'play': {
      return `Waiting for ${handle} to play.`;
    }
  }
}

function Game({
  game,
  me,
  onUpdateGame,
  singlePlayer,
  playerStartedGame,
}: {
  game: Game;
  me: Player;
  onUpdateGame: (game: Game) => void;
  singlePlayer?: boolean;
  playerStartedGame: boolean;
}) {
  // XXX: Run a check on the game to ensure we haven't violated invariants
  const [drawCardError, setDrawCardError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [urlCopied, setUrlCopied] = useState(false);
  useEffect(() => {
    if (playerStartedGame) {
      const url = new URL(window.location.href);
      const playerId = game.players.find((p) => p.id !== me.id)?.id;
      url.searchParams.delete('startedGame');
      url.searchParams.set('playerId', playerId || '');
      setShareUrl(url.toString());
    }
  }, []);

  const baseCard = game.discard[game.discard.length - 1];
  const handlePlayCard = (card: DumbunoCard) => {
    const activePlayer = game.players[game.activePlayerIdx];
    if (!singlePlayer && activePlayer.id !== me.id) {
      return 'Player is not active';
    }
    if (canPlayCard({ card, baseCard, currentColor: game.currentColor })) {
      onUpdateGame(playCard(game, card));
      return;
    }
    return "Can't play that card";
  };

  const handleChooseColor = (color: Color, player: Player) => {
    onUpdateGame(chooseColor(game, player, color));
    return undefined;
  };

  const handleDrawCard = () => {
    if (singlePlayer) {
      const player = game.players.find((p) => canDrawCard({ player: p, game }));
      if (!player) {
        return "Can't draw a card";
      }
      onUpdateGame(drawCard(game, player));
      return undefined;
    }
    if (!canDrawCard({ player: me, game })) {
      return "Can't draw a card;";
    }
    onUpdateGame(drawCard(game, me));
    return undefined;
  };

  const handleAction: ActionHandler = (action) => {
    switch (action.type) {
      case 'play': {
        return handlePlayCard(action.card);
      }
      case 'choose-color': {
        return handleChooseColor(action.color, action.player);
      }
      case 'draw-card': {
        return handleDrawCard();
      }
    }
  };

  return (
    <Box mt="1em">
      {shareUrl ? (
        <CopyButton value={shareUrl}>
          {({ copied, copy }) => {
            const showFullButton = urlCopied ? copied : true;
            const Component = showFullButton ? Button : ActionIcon;
            return (
              <Component
                color={copied ? 'teal' : 'blue'}
                onClick={() => {
                  setUrlCopied(true);
                  copy();
                }}
              >
                {!showFullButton ? (
                  <IconShare
                    style={{ width: '70%', height: '70%' }}
                    stroke={1.5}
                  />
                ) : copied ? (
                  "Copied url. Don't peek!"
                ) : (
                  'Copy url to play against someone else'
                )}
              </Component>
            );
          }}
        </CopyButton>
      ) : null}
      <Players
        me={me}
        game={game}
        onAction={handleAction}
        singlePlayer={singlePlayer}
      />
      <Flex
        gap="sm"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      >
        <Box style={{ position: 'relative' }}>
          <Box style={{ position: 'relative' }}>
            <Box style={{ visibility: 'hidden' }}>
              <DumbunoCard card={baseCard} />
            </Box>
            {game.drawPile.slice(0, 5).map((card, i) => {
              return (
                <Box
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0 + i * 2,
                    cursor: 'pointer',
                  }}
                  className={`${classes['card-shakeable']} ${drawCardError && i === 4 ? classes['card-shake'] : ''}`}
                  onClick={() => {
                    if (i !== 4) {
                      return;
                    }
                    setDrawCardError(null);
                    const error = handleDrawCard();
                    if (error) {
                      setTimeout(() => setDrawCardError(error), 10);
                    }
                  }}
                >
                  <DumbunoCard card={card} hide />
                </Box>
              );
            })}
          </Box>
        </Box>

        <DumbunoCard card={baseCard} currentColor={game.currentColor} />
      </Flex>
    </Box>
  );
}

export default function GameWrapper({
  singlePlayer,
  gameId,
  playerId,
  startedGame,
}: {
  singlePlayer?: boolean;
  gameId: string;
  playerId?: string;
  startedGame: boolean;
}) {
  const { isLoading, error, data } = db.useQuery({
    games: { $: { where: { id: gameId } } },
  });

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }
  const game = data?.games?.[0];
  if (error || !game) {
    return (
      <Center h="100%">
        <Flex direction="column" align="center">
          <Box>
            <Text>Something went wrong :(</Text>
          </Box>
          <Box>
            <Text>{error ? error.message : 'Game not found.'}</Text>
          </Box>
        </Flex>
      </Center>
    );
  }

  const updateGame = async (game: Game) => {
    await db.transact(db.tx.games[game.id].update(game));
  };

  return (
    <Game
      game={game}
      playerStartedGame={startedGame}
      me={game.players.find((p) => p.id === playerId) || game.players[0]}
      onUpdateGame={updateGame}
      singlePlayer={singlePlayer}
    />
  );
}
