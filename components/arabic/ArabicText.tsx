import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { colors, fonts } from '../../constants/theme';

interface ArabicTextProps extends TextProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
  style?: TextStyle | TextStyle[];
}

/**
 * Renders Arabic / Quran text with the Amiri font, RTL writing direction
 * and proper line height. Never use latin placeholders here.
 */
export function ArabicText({
  children,
  size = 30,
  color = colors.text.heading,
  bold,
  style,
  ...rest
}: ArabicTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        {
          fontSize: size,
          lineHeight: size * 1.7,
          color,
          fontFamily: bold ? fonts.arabicBold : fonts.arabic,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});

export default ArabicText;
