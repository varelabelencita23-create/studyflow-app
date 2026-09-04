import { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollProps?: Partial<ScrollViewProps>;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  padded = true,
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
          contentContainerStyle={[
            padded && styles.paddedContent,
            styles.scrollContent,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.paddedContent, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  paddedContent: { paddingHorizontal: spacing.xl },
  scrollContent: { paddingBottom: spacing.massive },
});
