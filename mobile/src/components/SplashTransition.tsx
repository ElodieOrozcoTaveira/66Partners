import { useCallback, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";

// Écran de démarrage plein écran (assets/images/splashScreenNew.png,
// 849 x 1851) : dégradé rouge → jaune avec le logo 66 Partners au centre.
// splashScreenNew-glow.png : halo autour des contours du logo (jamais par-dessus,
// pour garder le logo net), généré depuis l'image et exactement aligné (même
// format). À régénérer si l'image change.
const splashImage = require("../../assets/images/splashScreenNew.png");
const glowImage = require("../../assets/images/splashScreenNew-glow.png");

const IMAGE_WIDTH = 849;
const IMAGE_HEIGHT = 1851;
// Centre du logo dans l'image (fractions de la largeur / hauteur), mesuré.
const LOGO_CENTER_X = 0.498;
const LOGO_CENTER_Y = 0.468;
// Teinte rouge de l'image : même couleur que l'écran natif (app.json).
const BASE_COLOR = "#E2052A";

const INTRO_MS = 250; // image seule avant le premier éclat
const GLOW_IN_MS = 450; // les contours s'illuminent
const GLOW_OUT_MS = 550; // puis s'éteignent
const GLOW_PAUSE_MS = 250; // intervalle entre deux éclats
const GLOW_COUNT = 2;
// Intensité maximale du halo (0 à 1) : éclat discret, le logo reste net.
const GLOW_PEAK_OPACITY = 0.7;
const ZOOM_MS = 750; // plongée vers le logo
const FADE_MS = 450; // fondu vers l'application
const ZOOM_SCALE = 1.8;

interface SplashTransitionProps {
  children: React.ReactNode;
}

/**
 * Transition de démarrage, jouée une fois par lancement par-dessus
 * l'application : image plein écran → les contours du logo s'illuminent à
 * intervalles → zoom sur le logo et fondu vers l'app. Toucher l'écran la
 * passe ; avec "Réduire les animations", un seul éclat doux puis un fondu.
 */
export default function SplashTransition({ children }: SplashTransitionProps) {
  const { width, height } = useWindowDimensions();
  const [glow] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(0));
  const [imageReady, setImageReady] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleImageReady = useCallback(() => {
    setImageReady(true);
    // L'image est peinte à l'écran : on peut retirer l'écran natif sans flash.
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (!imageReady) return;

    let animation: Animated.CompositeAnimation | null = null;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;

        const pulse = (inMs: number, outMs: number) =>
          Animated.sequence([
            Animated.timing(glow, {
              toValue: 1,
              duration: inMs,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(glow, {
              toValue: 0,
              duration: outMs,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]);

        const fadeOut = Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });

        const pulses: Animated.CompositeAnimation[] = [];
        for (let i = 0; i < GLOW_COUNT; i += 1) {
          if (i > 0) pulses.push(Animated.delay(GLOW_PAUSE_MS));
          pulses.push(pulse(GLOW_IN_MS, GLOW_OUT_MS));
        }

        animation = reduceMotion
          ? Animated.sequence([Animated.delay(INTRO_MS), pulse(700, 700), fadeOut])
          : Animated.sequence([
              Animated.delay(INTRO_MS),
              ...pulses,
              Animated.parallel([
                Animated.timing(zoom, {
                  toValue: 1,
                  duration: ZOOM_MS,
                  easing: Easing.in(Easing.cubic),
                  useNativeDriver: true,
                }),
                // Dernier éclat pendant la plongée, fondu sur la fin du zoom.
                pulse(ZOOM_MS / 2, ZOOM_MS / 2),
                Animated.sequence([Animated.delay(ZOOM_MS - FADE_MS / 2), fadeOut]),
              ]),
            ]);

        animation.start(({ finished: completed }) => {
          if (completed) setFinished(true);
        });
      });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [imageReady, glow, zoom, fade]);

  // Filet de sécurité : si l'image ne se charge jamais, on ne bloque pas l'app.
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hide();
      setFinished(true);
    }, 7000);
    return () => clearTimeout(timeout);
  }, []);

  // Taille réelle de l'image affichée en "cover" (elle remplit l'écran).
  const coverScale = Math.max(width / IMAGE_WIDTH, height / IMAGE_HEIGHT);
  const renderedWidth = IMAGE_WIDTH * coverScale;
  const renderedHeight = IMAGE_HEIGHT * coverScale;
  // Décalage du logo par rapport au centre de l'écran.
  const logoDx = (LOGO_CENTER_X - 0.5) * renderedWidth;
  const logoDy = (LOGO_CENTER_Y - 0.5) * renderedHeight;

  // translate puis scale : le logo glisse vers le centre pendant le zoom.
  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, ZOOM_SCALE] });
  const translateX = zoom.interpolate({ inputRange: [0, 1], outputRange: [0, -ZOOM_SCALE * logoDx] });
  const translateY = zoom.interpolate({ inputRange: [0, 1], outputRange: [0, -ZOOM_SCALE * logoDy] });
  const splashOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, GLOW_PEAK_OPACITY] });

  return (
    <View style={styles.container}>
      {children}

      {!finished ? (
        <Animated.View style={[styles.overlay, { opacity: splashOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Passer l'animation d'ouverture"
            style={StyleSheet.absoluteFill}
            onPress={() => setFinished(true)}
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]}
            >
              <Image
                source={splashImage}
                contentFit="cover"
                // onDisplay : l'image est réellement peinte (pas seulement chargée).
                onDisplay={handleImageReady}
                onError={handleImageReady}
                accessibilityIgnoresInvertColors
                style={StyleSheet.absoluteFill}
              />
              {/* Halo des contours : même format et même cadrage que l'image. */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]} pointerEvents="none">
                <Image
                  source={glowImage}
                  contentFit="cover"
                  accessible={false}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    overflow: "hidden",
    backgroundColor: BASE_COLOR,
  },
});
