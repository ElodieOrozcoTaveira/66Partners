/**
 * Petits messages temporaires (remplacent les alert() du navigateur) :
 * toast.error("…"), toast.success("…"). Affichés par <Toaster />.
 */
export type ToastTone = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
}

export const TOAST_EVENT = "66partners-toast";
let counter = 0;

function show(tone: ToastTone, text: string) {
  counter += 1;
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: { id: counter, tone, text } }));
}

export const toast = {
  success: (text: string) => show("success", text),
  error: (text: string) => show("error", text),
  info: (text: string) => show("info", text),
};
