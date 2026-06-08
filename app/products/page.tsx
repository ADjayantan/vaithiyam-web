import { StorefrontPage } from '@/components/products/StorefrontPage';

export default function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string; tradition?: string; sort?: string };
}) {
  return <StorefrontPage mode="products" initialCategory={searchParams?.category} initialTradition={searchParams?.tradition as never} initialSort={searchParams?.sort as never} />;
}
