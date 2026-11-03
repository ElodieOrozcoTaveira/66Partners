import { createContext, useContext, type ComponentProps } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextStyle,
} from "react-native";

import { Fonts, interForWeight } from "../../constants/theme";

/**
 * Text et TextInput de l'app : mêmes props que ceux de React Native, avec les
 * polices de la charte (Inter, Manrope pour les titres).
 *
 * Les polices personnalisées n'ont qu'une graisse par fichier : on remplace
 * donc `fontWeight` par la police de la bonne graisse (sinon Android
 * simulerait un faux gras). Un style qui fixe déjà sa police est respecté.
 */

// Texte imbriqué (<Text>a <Text>b</Text></Text>) : sans graisse propre, il
// hérite de la police du parent, comme en natif.
const InsideText = createContext(false);

function withAppFont(style: TextProps["style"], nested: boolean): TextProps["style"] {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, fontFamily } = flat;

  if (fontFamily?.startsWith("Manrope_")) {
    if (fontWeight === undefined) return style;
    const heavy = fontWeight === "800" || fontWeight === "900";
    return [style, { fontFamily: heavy ? Fonts.headingExtraBold : Fonts.heading, fontWeight: undefined }];
  }
  if (fontFamily) return style;
  if (nested && fontWeight === undefined) return style;
  return [style, { fontFamily: interForWeight(fontWeight), fontWeight: undefined }];
}

export function Text({ style, ...props }: ComponentProps<typeof NativeText>) {
  const nested = useContext(InsideText);
  const text = <NativeText {...props} style={withAppFont(style, nested)} />;
  return nested ? text : <InsideText.Provider value>{text}</InsideText.Provider>;
}

export function TextInput({ style, ...props }: ComponentProps<typeof NativeTextInput>) {
  return <NativeTextInput {...props} style={withAppFont(style, false)} />;
}
