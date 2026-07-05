import { apiFetch, resolveAuthToken } from './api';

export type ChatProductRec = {
  id: number;
  name: string;
  slug?: string;
  price: number;
  imageUrl?: string;
};

export type ChatOrderRec = {
  id: number;
  status: string;
  amount: number;
  createdAt: string;
  expectedDeliveryDate?: string;
  itemCount: number;
  itemPreview: string;
  imageUrl?: string;
};

function parseOrders(raw: unknown): ChatOrderRec[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o: Record<string, unknown>) => ({
    id: Number(o.id),
    status: String(o.status ?? ''),
    amount: typeof o.amount === 'number' ? o.amount : Number(o.amount ?? 0),
    createdAt: String(o.createdAt ?? o.created_at ?? ''),
    expectedDeliveryDate: (o.expectedDeliveryDate ?? o.expected_delivery_date) as string | undefined,
    itemCount: Number(o.itemCount ?? o.item_count ?? 0),
    itemPreview: String(o.itemPreview ?? o.item_preview ?? ''),
    imageUrl: (o.imageUrl ?? o.image_url) as string | undefined,
  }));
}

/**
 * POST /chat — priorMessages should not include the current user turn (sent as `message`).
 */
export async function sendChatMessage(
  message: string,
  priorMessages: { role: 'user' | 'dootha'; content: string }[]
): Promise<{ response: string; products: ChatProductRec[]; orders: ChatOrderRec[] }> {
  const token = await resolveAuthToken();
  const res = await apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      token: token ?? undefined,
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
  return {
    response: String(data.response ?? ''),
    products,
    orders: parseOrders(data.orders),
  };
}
