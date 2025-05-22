import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onExit: () => void;
}

export default function GameOverModal({ score, highScore, onRestart, onExit }: GameOverModalProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.modalContent,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <LinearGradient
          colors={['#ef233c', '#d00000']}
          style={styles.header}
        >
          <Text style={styles.gameOverText}>GAME OVER</Text>
        </LinearGradient>
        
        <View style={styles.body}>
          <Text style={styles.messageText}>Comeu tanto que explodiu!</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>KM</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>TOP KM</Text>
              <Text style={styles.scoreValue}>{highScore}</Text>
              {score >= highScore && (
                <View style={styles.newHighScoreBadge}>
                  <Text style={styles.newHighScoreText}>NOVO</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={onRestart}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Jogar novamente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.exitButton]} 
              onPress={onExit}
              activeOpacity={0.8}
            >
              <Ionicons name="exit" size={20} color="#38b000" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, styles.exitButtonText]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  body: {
    padding: 24,
  },
  messageText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  scoreItem: {
    alignItems: 'center',
    position: 'relative',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  newHighScoreBadge: {
    position: 'absolute',
    top: -10,
    right: -30,
    backgroundColor: '#38b000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    transform: [{ rotate: '15deg' }],
  },
  newHighScoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#38b000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#38b000',
  },
  exitButtonText: {
    color: '#38b000',
  },
});