import { failOrder, fulfillOrder } from "@/lib/billing";
import { paymentProviderById } from "@/lib/payments";

export async function POST(req: Request, ctx: RouteContext<"/api/payments/webhook/[provider]">) {
  const { provider: providerId } = await ctx.params;
  const provider = paymentProviderById(providerId);
  if (!provider) return new Response("Unknown provider", { status: 404 });

  let result;
  try {
    result = await provider.handleWebhook(req);
  } catch (err) {
    console.error(`[webhook:${providerId}] rejected`, err);
    return new Response("Invalid webhook", { status: 400 });
  }

  if (result.type === "paid") await fulfillOrder(result.orderId, result.providerRef);
  else if (result.type === "failed") await failOrder(result.orderId);
  return Response.json({ received: true });
}
