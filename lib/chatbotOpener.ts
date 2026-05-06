/** Wired by `<Chatbot />` on mount; tab bar calls `openChatbot()`. */
let openFn: ((message?: string) => void) | null = null;

export function setChatbotOpener(fn: ((message?: string) => void) | null) {
  openFn = fn;
}

export function openChatbot(message?: string) {
  openFn?.(message);
}
