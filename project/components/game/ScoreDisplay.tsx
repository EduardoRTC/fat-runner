import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ScoreDisplayProps {
  score: number;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);
  
  // Animate score when it changes
  useEffect(() => {
    if (score > prevScore.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevScore.current = score;
  }, [score, scaleAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>KM</Text>
      <Animated.Text 
        style={[
          styles.scoreText,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {score.toString().padStart(5, '0')}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});