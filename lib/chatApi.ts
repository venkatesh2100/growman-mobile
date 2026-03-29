import { apiFetch } from './api';

export type ChatProductRec = {
  id: number;
  name: string;
  slug?: string;
  price: number;
  imageUrl?: string;
};

/**
 * POST /chat — priorMessages should not include the current user turn (sent as `message`).
 */
export async function sendChatMessage(
  message: string,
  priorMessages: { role: 'user' | 'dootha'; content: string }[]
): Promise<{ response: string; products: ChatProductRec[] }> {
  const res = await apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory: priorMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    }),
  });
  if (!res.ok) {
    throw new Error('Chat request failed');
  }
  const data = await res.json();
  const raw = data.recommendedProducts ?? data.products ?? [];
  const products: ChatProductRec[] = (Array.isArray(raw) ? raw : []).map((p: Record<string, unknown>) => ({
    id: Number(p.id),
    name: String(p.name ?? ''),
    slug: p.slug != null ? String(p.slug) : undefined,
    price: typeof p.price === 'number' ? p.price : Number(p.price ?? 0),
    imageUrl: (p.imageUrl ?? p.image_url) as string | undefined,
  }));
  return { response: String(data.response ?? ''), products };
}
