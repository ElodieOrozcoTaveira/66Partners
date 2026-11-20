import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "../constants/theme";

const MAIN_LOGO = require("../../assets/images/newLogo.webp");
// Proportions du fichier (600 x 307).
const RATIO = 307 / 600;

/** Fond chaud du logo principal : orange → rouge, liseré jaune (même rendu que le site). */
export const MAIN_LOGO_GRADIENT = "linear-gradient(120deg, #E8641A 0%, #D9381E 55%, #B71C1C 100%)";
export const MAIN_LOGO_YELLOW = "#FFC107";

/**
 * Logo principal de la plateforme (« 66 | PARTNERS » blanc), utilisé quand
 * aucun territoire n'est concerné : app avant toute connexion, espace admin.
 * Le logo étant blanc, il est posé sur un fond chaud (dégradé orange → rouge,
 * liseré jaune) pour ressortir. `bare` : sans pastille, quand le conteneur
 * porte déjà ce fond (ex. en-tête admin). Sinon, chaque territoire garde son logo.
 */
export function MainLogo({
  width = 200,
  style,
  bare = false,
}: {
  width?: number;
  style?: StyleProp<ViewStyle>;
  bare?: boolean;
}) {
  const padding = bare ? 0 : Math.round(width * 0.09);
  return (
    <View
      style={[
        !bare && styles.pill,
        { paddingHorizontal: padding, paddingTop: Math.round(padding * 0.7), paddingBottom: Math.round(padding * 0.7) + (bare ? 0 : 3) },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="66Partners"
    >
      <Image source={MAIN_LOGO} resizeMode="contain" style={{ width, height: Math.round(width * RATIO) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: "#D9381E",
    backgroundImage: MAIN_LOGO_GRADIENT,
    borderBottomWidth: 3,
    borderBottomColor: MAIN_LOGO_YELLOW,
  },
});
