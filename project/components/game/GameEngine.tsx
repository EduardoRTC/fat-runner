// components/game/GameEngine.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  Image,
  ImageBackground,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HealthBar from './HealthBar';
import ScoreDisplay from './ScoreDisplay';
import useGameLoop from '@/hooks/useGameLoop';
import { Enemy } from '@/types/game';
import { generateWave, COLUMN_WIDTH } from '@/utils/gameUtils';

/* ────── GRID & PLAYER ────── */
const { width, height } = Dimensions.get('window');
export const TOTAL_COLUMNS = 5;

const CHARACTER_SIZE = COLUMN_WIDTH * 0.9;
const CHARACTER_Y    = height * 0.80 - CHARACTER_SIZE / 2;

/* hitboxes */
const PLAYER_HIT = 0.65;
const ENEMY_HIT  = 0.90;

/* mecânica */
const INITIAL_HEALTH = 30;
const MAX_HEALTH     = 100;
const HEALTH_DECREASE_RATE = 0.1;
const ENEMY_MOVE_SPEED     = 3;

/* sprites */
const enemySprites: Record<string, any> = {
  coxinha: require('@/assets/images/coxinha.png'),
  pizza:   require('@/assets/images/pizza.png'),
  refri:   require('@/assets/images/refri.png'),
  batata:  require('@/assets/images/batata.png'),
};
const playerSprite  = require('@/assets/images/player.png');
const backgroundImg = require('@/assets/images/background.png');

export default function GameEngine({
  isPlaying,
  isPaused,
  onGameOver,
  onScoreUpdate,
  onPause,
  startGame,
  score,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  onGameOver: (score: number) => void;
  onScoreUpdate: (fn: (prev: number) => number) => void;
  onPause: () => void;
  startGame: () => void;
  score: number;
}) {
  /* refs e estados básicos */
  const scoreRef = useRef(score);
  const frame    = useRef(0);
  const lastWave = useRef(Date.now());
  const firstRun = useRef(true);

  const [health,  setHealth]  = useState(INITIAL_HEALTH);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [difficulty, setDifficulty] = useState(1);

  /* posição e coluna atual do player */
  const [column, setColumn] = useState(Math.floor(TOTAL_COLUMNS / 2)); // começa no meio
  const characterX = useRef(
    new Animated.Value(column * COLUMN_WIDTH + (COLUMN_WIDTH - CHARACTER_SIZE) / 2)
  ).current;

  /* mantém scoreRef sincronizado */
  useEffect(() => { scoreRef.current = score; }, [score]);

  /* ────── TAP → mover 1 coluna ────── */
  const handleTap = (e: GestureResponderEvent) => {
    if (!isPlaying || isPaused) return;

    const tapX = e.nativeEvent.locationX;
    const charCenter = characterX.__getValue() + CHARACTER_SIZE / 2;

    let targetCol = column;
    if (tapX > charCenter + 10 && column < TOTAL_COLUMNS - 1) {
      targetCol = column + 1; // direita
    } else if (tapX < charCenter - 10 && column > 0) {
      targetCol = column - 1; // esquerda
    }

    if (targetCol !== column) {
      setColumn(targetCol);
      Animated.timing(characterX, {
        toValue: targetCol * COLUMN_WIDTH + (COLUMN_WIDTH - CHARACTER_SIZE) / 2,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  /* ────── game loop ────── */
  const { startGameLoop, stopGameLoop } = useGameLoop(() => {
    if (!isPlaying || isPaused) return;

    frame.current += 1;
    setHealth(h => Math.max(0, h - HEALTH_DECREASE_RATE));

    if (frame.current % 10 === 0) onScoreUpdate(s => s + 1);
    if (frame.current % 600 === 0) setDifficulty(d => Math.min(d + 0.2, 3));

    const now = Date.now();
    const interval = Math.max(1500 - difficulty * 100, 1000);
    if (now - lastWave.current > interval) {
      setEnemies(e => [...e, ...generateWave(difficulty)]);
      lastWave.current = now;
    }

    setEnemies(prev =>
      prev.flatMap(enemy => {
        const newY = enemy.y + ENEMY_MOVE_SPEED * difficulty;

        /* hitboxes reduzidas */
        const playerHit = {
          x: characterX.__getValue() + (CHARACTER_SIZE * (1 - PLAYER_HIT)) / 2,
          y: CHARACTER_Y              + (CHARACTER_SIZE * (1 - PLAYER_HIT)) / 2,
          size: CHARACTER_SIZE * PLAYER_HIT,
        };
        const enemyHit = {
          x: enemy.x + (enemy.size * (1 - ENEMY_HIT)) / 2,
          y: newY    + (enemy.size * (1 - ENEMY_HIT)) / 2,
          size: enemy.size * ENEMY_HIT,
        };

        const collided =
          enemyHit.x < playerHit.x + playerHit.size &&
          enemyHit.x + enemyHit.size > playerHit.x &&
          enemyHit.y < playerHit.y + playerHit.size &&
          enemyHit.y + enemyHit.size > playerHit.y;

        if (collided) {
          const heal = { refri: 10, pizza: 15, coxinha: 20, batata: 25 }[enemy.type] || 10;
          setHealth(prev => {
            const newH = Math.min(MAX_HEALTH, prev + heal);
            if (newH >= MAX_HEALTH) onGameOver(scoreRef.current);
            return newH;
          });
          return []; // remove inimigo
        }

        return newY < height + 100 ? [{ ...enemy, y: newY }] : [];
      })
    );
  });

  /* iniciar/parar loop */
  useEffect(() => {
    if (isPlaying && !isPaused) startGameLoop();
    else stopGameLoop();
    return () => stopGameLoop();
  }, [isPlaying, isPaused]);

  /* reset ao entrar */
  useEffect(() => {
    if (isPlaying && firstRun.current) {
      frame.current    = 0;
      lastWave.current = Date.now();
      setColumn(Math.floor(TOTAL_COLUMNS / 2));
      characterX.setValue(
        Math.floor(TOTAL_COLUMNS / 2) * COLUMN_WIDTH + (COLUMN_WIDTH - CHARACTER_SIZE) / 2
      );
      setHealth(INITIAL_HEALTH);
      setEnemies([]);
      setDifficulty(1);
      firstRun.current = false;
    }
  }, [isPlaying]);

  useEffect(() => { if (!isPlaying) firstRun.current = true; }, [isPlaying]);

  /* ────── UI / telas ────── */
  if (!isPlaying) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.startTitle}>Fat Runner</Text>
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>TAP TO START</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.header}>
        <HealthBar currentHealth={health} maxHealth={MAX_HEALTH} />
        <ScoreDisplay score={score} />
        <TouchableOpacity onPress={onPause}>
          <Ionicons name="pause" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ImageBackground
        source={backgroundImg}
        style={styles.gameArea}
        resizeMode="cover"
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTap}
      >
        {enemies.map(e => (
          <Animated.View
            key={e.id}
            pointerEvents="none"
            style={[
              styles.enemy,
              { left: e.x, top: e.y, width: e.size, height: e.size },
            ]}
          >
            <Image source={enemySprites[e.type]} style={styles.full} resizeMode="contain" />
          </Animated.View>
        ))}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.character,
            { top: CHARACTER_Y, transform: [{ translateX: characterX }] },
          ]}
        >
          <Image source={playerSprite} style={styles.full} resizeMode="contain" />
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

/* ────── estilos ────── */
const styles = StyleSheet.create({
  gameContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,.6)',
  },
  gameArea: { flex: 1 },
  enemy:   { position: 'absolute' },
  character: {
    position: 'absolute',
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
  },
  full: { width: '100%', height: '100%' },

  startContainer: {
    flex: 1, backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
  },
  startTitle: { fontSize: 48, color: '#fff', marginBottom: 32 },
  startButton: {
    backgroundColor: '#38b000',
    paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 30,
  },
  startButtonText: { color: '#fff', fontSize: 24 },
});
