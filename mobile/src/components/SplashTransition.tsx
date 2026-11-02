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

import { GLOW_SECTORS } from "./splashGlowSectors";

// Écran de démarrage plein écran (assets/images/splashScreenNew.png,
// 849 x 1851) : dégradé rouge → jaune avec le logo 66 Partners au centre.
// Halo : découpé en morceaux autour du logo (GLOW_SECTORS, générés par
// scripts/generate-splash-glow.py, à relancer si l'image change). Allumés l'un
// après l'autre, ils font tourner la lumière autour du logo en partant du haut
// à gauche. Le halo n'est jamais par-dessus le logo, qui reste net.
const splashImage = require("../../assets/images/splashScreenNew.png");

const IMAGE_WIDTH = 849;
const IMAGE_HEIGHT = 1851;
// Centre du logo dans l'image (fractions de la largeur / hauteur), mesuré.
const LOGO_CENTER_X = 0.498;
const LOGO_CENTER_Y = 0.468;
// Teinte rouge de l'image : même couleur que l'écran natif (app.json).
const BASE_COLOR = "#E2052A";

// Durée totale ≈ 1,5 s : 50 + 1200 − 150 (zoom lancé pendant la fin du
// tour) + 400.
const INTRO_MS = 50; // image seule avant l'illumination
const SWEEP_MS = 1200; // un tour complet de la lumière autour du logo
const SWEEP_COUNT = 1; // un seul tour, assez lent pour être suivi
const ZOOM_OVERLAP_MS = 150; // le zoom démarre avant la fin du dernier tour
// Part d'un tour pour qu'un morceau s'allume (montée rapide) puis s'éteigne
// (traîne plus longue, effet de comète).
const SWEEP_RISE = 0.06;
const SWEEP_TAIL = 0.22;
// Intensité maximale du halo (0 à 1).
const GLOW_PEAK_OPACITY = 0.9;
const REDUCED_HOLD_MS = 1100; // "Réduire les animations" : image fixe puis fondu
const ZOOM_MS = 400; // plongée vers le logo
const FADE_MS = 250; // fondu vers l'application
const ZOOM_SCALE = 1.8;

interface SplashTransitionProps {
  children: React.ReactNode;
}

/**
 * Transition de démarrage, jouée une fois par lancement par-dessus
 * l'application : image plein écran → la lumière fait le tour du logo
 * (départ en haut à gauche) → zoom sur le logo et fondu vers l'app.
 * Toucher l'écran la passe ; avec "Réduire les animations", un simple fondu.
 */
export default function SplashTransition({ children }: SplashTransitionProps) {
  const { width, height } = useWindowDimensions();
  // Progression des tours : 0 → 1 pour un tour.
  const [sweep] = useState(() => new Animated.Value(0));
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

        const fadeOut = Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });

        // Tour(s) d'un seul mouvement : départ et arrivée en douceur.
        const laps = Animated.timing(sweep, {
          toValue: SWEEP_COUNT,
          duration: SWEEP_MS * SWEEP_COUNT,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });

        animation = reduceMotion
          ? Animated.sequence([Animated.delay(REDUCED_HOLD_MS), fadeOut])
          : Animated.sequence([
              Animated.delay(INTRO_MS),
              Animated.parallel([
                laps,
                Animated.sequence([
                  Animated.delay(SWEEP_MS * SWEEP_COUNT - ZOOM_OVERLAP_MS),
                  Animated.parallel([
                    Animated.timing(zoom, {
                      toValue: 1,
                      duration: ZOOM_MS,
                      easing: Easing.in(Easing.cubic),
                      useNativeDriver: true,
                    }),
                    // Fondu sur la fin du zoom (terminé avec lui).
                    Animated.sequence([Animated.delay(ZOOM_MS - FADE_MS), fadeOut]),
                  ]),
                ]),
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
  }, [imageReady, sweep, zoom, fade]);

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
  // Position d'un point de l'image (px) à l'écran, image affichée en "cover".
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;

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
              {/* Halo en morceaux, placés exactement sur l'image. */}
              {GLOW_SECTORS.map((sector, index) => (
                <Animated.View
                  key={index}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: offsetX + sector.x * coverScale,
                    top: offsetY + sector.y * coverScale,
                    width: sector.width * coverScale,
                    height: sector.height * coverScale,
                    opacity: sectorOpacity(sweep, index),
                  }}
                >
                  <Image source={sector.source} accessible={false} style={StyleSheet.absoluteFill} />
                </Animated.View>
              ))}
            </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * Opacité d'un morceau du halo selon la progression des tours : il s'allume
 * quand la lumière passe sur lui, à chaque tour, puis s'éteint en traînée.
 */
function sectorOpacity(sweep: Animated.Value, index: number) {
  const count = GLOW_SECTORS.length;
  // Instant de passage dans un tour : tous éteints au début et à la fin.
  const peak = SWEEP_RISE + ((1 - SWEEP_RISE - SWEEP_TAIL) * index) / (count - 1);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let lap = 0; lap < SWEEP_COUNT; lap += 1) {
    inputRange.push(lap + peak - SWEEP_RISE, lap + peak, lap + peak + SWEEP_TAIL);
    outputRange.push(0, GLOW_PEAK_OPACITY, 0);
  }
  return sweep.interpolate({ inputRange, outputRange, extrapolate: "clamp" });
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
