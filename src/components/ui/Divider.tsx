import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme';

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.line, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    width: '100%',
  },
});
