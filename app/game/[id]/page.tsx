import { Container } from '@mantine/core';
import Game from '@/components/Game';

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ playerId?: string; startedGame?: string }>;
}) {
  const { id: gameId } = await params;
  const { playerId, startedGame } = await searchParams;
  return (
    <Container fluid h="100vh" style={{ overflow: 'hidden' }}>
      {/* <ColorSchemeToggle /> */}
      <Game gameId={gameId} playerId={playerId} startedGame={!!startedGame} />
    </Container>
  );
}
