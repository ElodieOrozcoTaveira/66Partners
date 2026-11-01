import * as Haptics from "expo-haptics";

/**
 * Retours haptiques des actions importantes. Jamais bloquant : un appareil
 * sans moteur de vibration (ou le web) ignore simplement l'appel.
 */
const safe = (run: () => Promise<void>) => {
  run().catch(() => undefined);
};

export const haptics = {
  /** Sélection d'une option (filtre, favori, onglet). */
  selection: () => safe(() => Haptics.selectionAsync()),
  /** Geste léger (envoi d'un message). */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Action réussie (participation envoyée, activité publiée…). */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Formulaire incomplet ou action refusée. */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
