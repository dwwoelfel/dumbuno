import { Container } from '@mantine/core';
import Game from '@/components/Game';

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ playerId?: string }>;
}) {
  const { id: gameId } = await params;
  const { playerId } = await searchParams;
  return (
    <Container fluid h="100vh">
      {/* <ColorSchemeToggle /> */}
      <Game gameId={gameId} playerId={playerId} />
    </Container>
  );
}
