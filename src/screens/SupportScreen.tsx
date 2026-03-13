import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, ActivityIndicator, Alert, Modal, Share, StatusBar,
  Animated, Easing, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SupportScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // ── ANIMACJE ──
  const floatAnim = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(1)).current;
  const scanlineTop = useRef(new Animated.Value(0)).current;
  const scanlineOpacity = useRef(new Animated.Value(0)).current;

  // Staggered card slide-in
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

  // Hero fade in
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // ── Float animation (heart going up/down) ──
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Ring pulse 1 ──
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 1.12,
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0.4,
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 1,
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 1,
            duration: 1250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // ── Ring pulse 2 (delayed) ──
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring2Scale, {
              toValue: 1.12,
              duration: 1250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 0.4,
              duration: 1250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring2Scale, {
              toValue: 1,
              duration: 1250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 1,
              duration: 1250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, 400);

    // ── Scanline ──
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scanlineTop, {
            toValue: SCREEN_HEIGHT,
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scanlineOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.delay(3500),
            Animated.timing(scanlineOpacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(scanlineTop, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── Hero fade-in ──
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Staggered card slide-in ──
    const stagger = (anim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, delay);
    };

    stagger(card1Anim, 200);
    stagger(card2Anim, 340);
    stagger(card3Anim, 480);
  }, []);

  const cardSlideStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  });

  // ── AKCJE ──
  const openCoffeeLink = async () => {
    const url = 'https://buycoffee.to/twojanazwa';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Błąd", "Nie udało się otworzyć linku :(");
    }
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setTimeout(() => {
      setIsWatchingAd(false);
      Alert.alert(
        "Dziękujemy! ❤️",
        "Dzięki Tobie serwery BitQuiz będą działać o minutę dłużej! Jesteś super!",
        [{ text: "Cieszę się, że pomogłem", style: "default" }]
      );
    }, 5000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Sprawdź BitQuiz — najlepsza apka do nauki kwalifikacji INF/EE/ELK! 🚀\nhttps://bitquiz.app',
      });
    } catch (error) {
      console.error('Błąd udostępniania:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* SCANLINE EFFECT */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanline,
          {
            opacity: scanlineOpacity,
            transform: [{ translateY: scanlineTop }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,45,120,0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>WESPRZYJ NAS</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HERO SECTION W KARCIE */}
        <Animated.View style={[{ opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
          <LinearGradient
            colors={['#0d1a2e', '#120728', '#1a0d00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Pulsujące pierścienie + serce */}
            <View style={styles.heartWrap}>
              {/* Ring 2 (outer) */}
              <Animated.View
                style={[
                  styles.heartRing2,
                  {
                    transform: [{ scale: ring2Scale }],
                    opacity: ring2Opacity,
                  },
                ]}
              />
              {/* Ring 1 */}
              <Animated.View
                style={[
                  styles.heartRing1,
                  {
                    transform: [{ scale: ring1Scale }],
                    opacity: ring1Opacity,
                  },
                ]}
              />
              {/* Heart circle (floating) */}
              <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <LinearGradient
                  colors={['#ff2d78', '#ff6b35']}
                  style={styles.heartCircle}
                >
                  <Ionicons name="heart" size={36} color="#FFF" />
                </LinearGradient>
              </Animated.View>
            </View>

            <Text style={styles.heroTitle}>
              Tworzymy BitQuiz{'\n'}
              <Text style={styles.heroTitleAccent}>z pasji!</Text>
            </Text>
            <Text style={[styles.heroDesc, { color: '#64748b' }]}>
              Aplikacja jest darmowa i rozwijamy ją po godzinach. Jeśli podoba Ci się to, co robimy — możesz nam pomóc w bardzo prosty sposób.
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#ff2d78' }]}>12k+</Text>
                <Text style={styles.statLabel}>GRACZY</Text>
              </View>
              <View style={[styles.statDivider]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#f59e0b' }]}>4500+</Text>
                <Text style={styles.statLabel}>PYTAŃ</Text>
              </View>
              <View style={[styles.statDivider]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#00f5ff' }]}>100%</Text>
                <Text style={styles.statLabel}>PASJA</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* SECTION LABEL */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Wybierz sposób wsparcia</Text>
          <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
        </View>

        {/* KARTA 1: KAWA */}
        <Animated.View style={cardSlideStyle(card1Anim)}>
          <TouchableOpacity onPress={openCoffeeLink} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2a1800', '#1a1000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionCard, { borderColor: 'rgba(245,158,11,0.35)' }]}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.25)' }]}>
                <Ionicons name="cafe" size={26} color="#f59e0b" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#f59e0b' }]}>Postaw nam kawę</Text>
                <Text style={styles.actionDesc}>
                  Kofeina zamienia się w kod! Każda kawa to nowe pytania w bazie.
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ionicons name="open-outline" size={15} color="#f59e0b" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* KARTA 2: REKLAMA */}
        <Animated.View style={cardSlideStyle(card2Anim)}>
          <TouchableOpacity onPress={handleWatchAd} activeOpacity={0.85}>
            <LinearGradient
              colors={['#150a2e', '#0e071f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionCard, { borderColor: 'rgba(124,58,237,0.35)' }]}
            >
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>BEZPŁATNE</Text>
              </View>
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.3)' }]}>
                <Ionicons name="play-circle" size={26} color="#a78bfa" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#a78bfa' }]}>Obejrzyj reklamę</Text>
                <Text style={styles.actionDesc}>
                  To nic Cię nie kosztuje, a nam pozwala opłacić serwery.
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                <Ionicons name="chevron-forward" size={15} color="#a78bfa" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* KARTA 3: POLEĆ */}
        <Animated.View style={cardSlideStyle(card3Anim)}>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85}>
            <LinearGradient
              colors={['#001a25', '#000f18']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionCard, { borderColor: 'rgba(0,245,255,0.25)' }]}
            >
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>BEZPŁATNE</Text>
              </View>
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(0,245,255,0.08)', borderColor: 'rgba(0,245,255,0.2)' }]}>
                <Ionicons name="megaphone" size={26} color="#00f5ff" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#00f5ff' }]}>Poleć znajomym</Text>
                <Text style={styles.actionDesc}>
                  Udostępnij BitQuiz — każdy nowy gracz to dla nas motywacja.
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: 'rgba(0,245,255,0.08)' }]}>
                <Ionicons name="chevron-forward" size={15} color="#00f5ff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* THANK YOU FOOTER */}
        <View style={[styles.thankYou, { borderColor: theme.border }]}>
          <Text style={styles.thankYouText}>
            Dziękujemy, że jesteś z nami!{'\n'}
            Każde wsparcie ma dla nas <Text style={styles.thankYouBold}>ogromne znaczenie</Text>.
          </Text>
          <Text style={styles.thankYouSig}>~ Zespół BitQuiz</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL SYMULUJĄCY REKLAMĘ */}
      <Modal visible={isWatchingAd} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Oglądanie reklamy...</Text>
            <Text style={{ color: theme.subText, fontSize: 12, marginTop: 5 }}>
              (Symulacja: trwa 5 sekund)
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Scanline ──
  scanline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 999,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.2)',
    padding: 36,
    paddingBottom: 28,
    alignItems: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },

  // ── Heart with rings ──
  heartWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  heartRing1: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.3)',
  },
  heartRing2: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.12)',
  },
  heartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#ff2d78',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  // ── Hero Text ──
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  heroTitleAccent: {
    color: '#ff2d78',
    fontSize: 24,
    fontWeight: '700',
  },
  heroDesc: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    fontWeight: '300',
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#64748b',
  },

  // ── Section label ──
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },

  // ── Action Cards ──
  actionCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    fontWeight: '300',
  },
  actionArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Free Badge ──
  freeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  freeBadgeText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── Thank You ──
  thankYou: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  thankYouBold: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontStyle: 'normal',
  },
  thankYouSig: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.25)',
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
  },
  loadingText: { marginTop: 15, fontWeight: 'bold' },
});