import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseModal({ onResume, onRestart, onExit }: PauseModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.modalContent,
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.pauseText}>Pausado</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={onResume}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={onRestart}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Reiniciar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.exitButton]} 
            onPress={onExit}
            activeOpacity={0.8}
          >
            <Ionicons name="exit" size={20} color="#38b000" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.exitButtonText]}>EXIT</Text>
          </TouchableOpacity>
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
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pauseText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
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