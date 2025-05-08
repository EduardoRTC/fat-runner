import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  gameArea: { flex: 1, paddingBottom: 50 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
