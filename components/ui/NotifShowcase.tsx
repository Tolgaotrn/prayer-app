import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fonts, radii, spacing } from '../../constants/theme';

const APP_ICON = require('../../assets/icons/icon.png');
const APP_NAME = 'Huda';

// En sevilen, kısa içerikler
const VERSE = { meta: 'Ash-Sharh 94:6', text: 'Verily, with hardship comes ease.' };
const HADITH = { meta: 'Prophet Muhammad ﷺ', text: 'Actions are by intentions.' };

const SPEED = 40; // ms / harf

/** Bir metni harf harf "akıtarak" gösterir. */
function useTypewriter(text: string, active: boolean): string {
  const [out, setOut] = React.useState('');
  React.useEffect(() => {
    if (!active) { setOut(''); return; }
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, SPEED);
    return () => clearInterval(id);
  }, [text, active]);
  return out;
}

interface CardProps {
  meta: string;
  body: string;
  typing: boolean;
}

function NotifCard({ meta, body, typing }: CardProps) {
  return (
    <BlurView intensity={45} tint="light" style={styles.card}>
      <Image source={APP_ICON} style={styles.iconBox} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.time}>now</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        <Text style={styles.body} numberOfLines={2}>
          {body}
          {typing ? <Text style={styles.cursor}>│</Text> : null}
        </Text>
      </View>
    </BlurView>
  );
}

/**
 * İki bildirimli canlı önizleme: üstteki ayet bildirimi alttaki hadis
 * bildiriminin üzerine biner (iOS yığını gibi). Önce ayet harf harf akar,
 * tamamlanınca hadis akmaya başlar; sonra döngü başa sarar.
 */
export function NotifShowcase() {
  const [cycle, setCycle] = React.useState(0);
  const [typeVerse, setTypeVerse] = React.useState(false);
  const [typeHadith, setTypeHadith] = React.useState(false);
  const [showSecond, setShowSecond] = React.useState(false);

  React.useEffect(() => {
    setTypeHadith(false);
    setShowSecond(false);
    setTypeVerse(true);

    const verseMs = VERSE.text.length * SPEED + 450;
    const t1 = setTimeout(() => { setShowSecond(true); setTypeHadith(true); }, verseMs);

    const totalMs = verseMs + HADITH.text.length * SPEED + 3000;
    const t2 = setTimeout(() => setCycle((c) => c + 1), totalMs);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cycle]);

  const verseText = useTypewriter(VERSE.text, typeVerse);
  const hadithText = useTypewriter(HADITH.text, typeHadith);

  const verseDone = verseText.length >= VERSE.text.length;
  const hadithDone = hadithText.length >= HADITH.text.length;

  return (
    <View style={styles.stack}>
      {/* Üstteki bildirim — alttakinin üzerine biner */}
      <Animated.View key={`v${cycle}`} entering={FadeInDown.duration(420)} style={styles.front}>
        <NotifCard meta={VERSE.meta} body={verseText} typing={!verseDone} />
      </Animated.View>

      {/* Alttaki bildirim — ayet bitince sonradan akıp gelir, üstten kısmen örtülü */}
      {showSecond ? (
        <Animated.View key={`h${cycle}`} entering={FadeInDown.duration(420)} style={styles.behind}>
          <NotifCard meta={HADITH.meta} body={hadithText} typing={typeHadith && !hadithDone} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'relative' },
  front: {
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  behind: {
    zIndex: 1,
    marginTop: -16,
    marginHorizontal: 8,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(248,248,250,0.95)',
    overflow: 'hidden',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconBox: { width: 38, height: 38, borderRadius: 9 },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 13, color: '#1A1A1A' },
  time: { fontFamily: fonts.sans, fontSize: 11, color: '#6A6A6A' },
  meta: { fontFamily: fonts.sansSemibold, fontSize: 11, color: '#9A7B3A', marginTop: 1 },
  body: { fontFamily: fonts.sans, fontSize: 13, color: '#2A2A2A', marginTop: 2, lineHeight: 18 },
  cursor: { color: '#9A7B3A' },
});

export default NotifShowcase;
