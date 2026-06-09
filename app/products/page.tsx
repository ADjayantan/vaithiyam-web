import { StorefrontPage } from '@/components/products/StorefrontPage';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; tradition?: string; sort?: string }>;
}) {
  const params = await searchParams;
  return <StorefrontPage mode="products" initialCategory={params?.category} initialTradition={params?.tradition as never} initialSort={params?.sort as never} />;
}
