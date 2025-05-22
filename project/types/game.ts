export interface Enemy {
  id: string;
  type: string; // 'burger', 'pizza', 'soda', 'fries'
  x: number;
  y: number;
  size: number;
  hit: boolean;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  health: number;
  highScore: number;
}