export {
  addProductToCart,
  calculateCartTotals,
  clearCart,
  getCartSnapshot,
  removeCartItem,
  updateCartQuantity,
} from '@/lib/cart';

// Supabase cart_items integration point:
// Replace the re-exports above with repository functions that query cart_items
// filtered by the authenticated user id when Supabase auth is fully enabled.
