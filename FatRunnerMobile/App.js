import React, { useState } from 'react';
import {
  View,
  ImageBackground,
  Image,
  Pressable,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';

import AppStyles from './styles/AppStyles';
import CharacterStyles from './styles/CharacterStyles';

export default function App() {
  const [col, setCol] = useState(2);
  const moveLeft  = () => setCol(c => Math.max(0, c - 1));
  const moveRight = () => setCol(c => Math.min(4, c + 1));
  const leftPercent = `${(col / 4) * 100}%`;

  const { width: screenWidth } = Dimensions.get('window');

  function handlePress({ nativeEvent }) {
    if (nativeEvent.locationX < screenWidth / 2) {
      moveLeft();
    } else {
      moveRight();
    }
  }

  return (
    <View style={AppStyles.container}>
      <StatusBar hidden />
      <ImageBackground
        source={require('./assets/background.png')}
        style={AppStyles.background}
        resizeMode="cover"
      >
        {/* 
          A área de jogo inteira agora é um Pressable:
          clicou no lado esquerdo → moveLeft
          clicou no lado direito → moveRight
        */}
        <Pressable style={AppStyles.gameArea} onPress={handlePress}>
          <Image
            source={require('./assets/player.png')}
            style={[
              CharacterStyles.sprite,
              { left: leftPercent }
            ]}
          />
        </Pressable>
      </ImageBackground>
    </View>
  );
}
