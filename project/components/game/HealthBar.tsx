import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface HealthBarProps {
  currentHealth: number;
  maxHealth: number;
}

export default function HealthBar({ currentHealth, maxHealth }: HealthBarProps) {
  const healthPercentage = (currentHealth / maxHealth) * 100;
  
  // Determine color based on health percentage
  // For inverse health, higher is worse
  const getHealthColor = () => {
    if (healthPercentage < 20) return '#38b000'; // Healthy (low weight)
    if (healthPercentage < 40) return '#90be6d'; // Fairly healthy
    if (healthPercentage < 60) return '#f9c74f'; // Caution
    if (healthPercentage < 80) return '#f8961e'; // Warning
    return '#ef233c'; // Danger (high weight)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PESO</Text>
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.healthFill, 
            { 
              width: `${healthPercentage}%`,
              backgroundColor: getHealthColor(), 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barContainer: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
  },
});