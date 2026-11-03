import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import { ReportModal, type ReportTarget } from "../components/ReportModal";
import { haptics } from "../lib/haptics";
import { getApiErrorMessage } from "../services/api";
import { blockUser } from "../services/moderation.service";

interface MenuOptions {
  title?: string;
  /** Contenu à signaler (absent : pas d'option "Signaler"). */
  report?: ReportTarget & { label: string };
  /** Membre à bloquer (absent : pas d'option "Bloquer"). */
  block?: { userId: string; pseudo: string };
  /** Après un blocage réussi (ex. quitter l'écran du membre). */
  onBlocked?: () => void;
}

/**
 * Menu "Signaler / Bloquer" commun aux profils, messages, activités et photos.
 * Le composant renvoyé (`reportModal`) doit être rendu dans l'écran.
 */
export function useModeration() {
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const confirmBlock = (member: { userId: string; pseudo: string }, onBlocked?: () => void) =>
    Alert.alert(
      `Bloquer ${member.pseudo} ?`,
      "Vous ne verrez plus vos profils, activités, messages et photos respectifs, et ses demandes en cours pour tes prochaines activités seront retirées. Il n'en sera pas informé. Tu pourras le débloquer dans les paramètres.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bloquer",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(member.userId);
              haptics.success();
              Alert.alert(`${member.pseudo} est bloqué`, "Tu ne verras plus ses contenus.");
              onBlocked?.();
            } catch (err) {
              Alert.alert("Blocage impossible", getApiErrorMessage(err, "Réessaie dans un instant."));
            }
          },
        },
      ]
    );

  const showMenu = ({ title, report, block, onBlocked }: MenuOptions) => {
    const actions: { label: string; destructive?: boolean; run: () => void }[] = [];
    if (report) {
      actions.push({ label: report.label, run: () => setReportTarget({ context: report.context, targetId: report.targetId }) });
    }
    if (block) {
      actions.push({ label: `Bloquer ${block.pseudo}`, destructive: true, run: () => confirmBlock(block, onBlocked) });
    }
    if (actions.length === 0) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: ["Annuler", ...actions.map((action) => action.label)],
          cancelButtonIndex: 0,
          destructiveButtonIndex: actions.map((action, i) => (action.destructive ? i + 1 : -1)).filter((i) => i > 0),
        },
        (index) => {
          if (index > 0) actions[index - 1]?.run();
        }
      );
      return;
    }
    Alert.alert(title ?? "Options", undefined, [
      ...actions.map((action) => ({
        text: action.label,
        style: action.destructive ? ("destructive" as const) : ("default" as const),
        onPress: action.run,
      })),
      { text: "Annuler", style: "cancel" as const },
    ]);
  };

  return {
    showMenu,
    reportModal: <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />,
  };
}
