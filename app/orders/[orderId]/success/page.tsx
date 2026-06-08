import { redirect } from 'next/navigation';

export default async function LegacyOrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  redirect(`/order/success?orderId=${encodeURIComponent(orderId)}`);
}
