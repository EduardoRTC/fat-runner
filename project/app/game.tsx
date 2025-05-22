// app/(tabs)/game.tsx  –– ou o caminho onde fica seu GameScreen
import { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import GameEngine from '@/components/game/GameEngine';
import GameOverModal from '@/components/game/GameOverModal';
import PauseModal from '@/components/game/PauseModal';

export default function GameScreen() {
  /* ───────── Estados ───────── */
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isPaused,  setIsPaused]    = useState(false);
  const [score,     setScore]       = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScore, setHighScore]   = useState(0);

  const router = useRouter();

  /* ───────── Inicia automaticamente ao montar ───────── */
  useEffect(() => {
    setIsPlaying(true);
  }, []);

  /* ───────── Back button pausa ───────── */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPlaying && !isPaused && !isGameOver) {
        setIsPaused(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isPlaying, isPaused, isGameOver]);

  /* ───────── Callbacks ───────── */
  const handleGameOver = (final: number) => {
    setIsPlaying(false);
    setIsGameOver(true);
    setScore(final);
    if (final > highScore) setHighScore(final);
  };

  const handlePause   = () => setIsPaused(true);
  const handleResume  = () => setIsPaused(false);

  const handleRestart = () => {
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setIsPlaying(true);                 // reinicia imediatamente
  };

  const handleExit = () => {
    setIsPlaying(false);
    setIsPaused(false);
    router.replace('/');
  };

  /* ───────── Layout ───────── */
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <GameEngine
        isPlaying={isPlaying}
        isPaused={isPaused}
        onGameOver={handleGameOver}
        onScoreUpdate={setScore}
        onPause={handlePause}
        startGame={() => setIsPlaying(true)}
        score={score}
      />

      {isGameOver && (
        <GameOverModal
          score={score}
          highScore={highScore}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}

      {isPaused && !isGameOver && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
});
