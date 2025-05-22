import { Dimensions } from 'react-native';
import { Enemy } from '@/types/game';

/* grid */
const { width } = Dimensions.get('window');
export const TOTAL_COLUMNS  = 5;
export const COLUMN_WIDTH   = width / TOTAL_COLUMNS;

/* tipos de inimigos */
const enemyTypes = ['coxinha', 'pizza', 'refri', 'batata'];
const id = () => Math.random().toString(36).slice(2, 9);

/* gera uma onda, deixando 1 coluna vazia (gap) */
export const generateWave = (difficulty: number): Enemy[] => {
  const enemies: Enemy[] = [];
  const gap = Math.floor(Math.random() * TOTAL_COLUMNS);

  for (let col = 0; col < TOTAL_COLUMNS; col++) {
    if (col === gap) continue;

    enemies.push({
      id: id(),
      type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
      x: col * COLUMN_WIDTH,
      y: -COLUMN_WIDTH,
      size: COLUMN_WIDTH,
      hit: false,
    });
  }
  return enemies;
};
