/** Wired by `<Chatbot />` on mount; tab bar calls `openChatbot()`. */
let openFn: (() => void) | null = null;

export function setChatbotOpener(fn: (() => void) | null) {
  openFn = fn;
}

export function openChatbot() {
  openFn?.();
}
