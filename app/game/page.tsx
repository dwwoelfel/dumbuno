'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { id } from '@instantdb/react';
import { Button, Center, Container } from '@mantine/core';
import db from '@/lib/db';
import { deal, type Player } from '@/lib/game';

export default function GamePage() {
  const router = useRouter();
  const [players, _setPlayers] = useState<Player[]>([
    { id: '2', handle: 'player 2' },
    { id: '1', handle: 'player 1' },
  ]);

  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      const gameId = id();

      const game = deal({ id: gameId, players, cardsPerPerson: 7 });

      await db.transact(db.tx.games[gameId].update(game));
      router.push(`/game/${gameId}?playerId=1&startedGame=true`);
    } catch (_e) {
      setLoading(false);
    }
  };

  return (
    <Container fluid h="100vh" style={{ overflow: 'hidden' }}>
      <Center h="100%">
        <Button
          loading={loading}
          onClick={() => {
            startGame();
          }}
        >
          Start game
        </Button>
      </Center>
    </Container>
  );
}
