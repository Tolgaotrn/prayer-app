import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../constants/theme';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Uygulama genelinde render hatalarını yakalar — bir ekran patlasa bile
 * kullanıcı beyaz/kırmızı ekranla karşılaşmaz, nazik bir "tekrar dene"
 * ekranı görür. App Store crash raporlarını da önler.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Geliştirmede konsola yaz; prod'da sessiz (analytics ileride eklenebilir)
    if (__DEV__) console.error('ErrorBoundary caught:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.mark}>✦</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            We hit an unexpected issue. Please try again.
          </Text>
          <Pressable
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={styles.btn}
          >
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.warm.bg,
  },
  mark: { fontSize: 40, color: colors.warm.gold, marginBottom: spacing.md },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.warm.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.warm.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.xl,
    backgroundColor: colors.warm.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  btnText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF' },
});

export default ErrorBoundary;
