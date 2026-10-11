/**
 * Ops exception: the seed tool writes each service's tables directly, so it imports their
 * schemas. Runtime services never do this; they only talk over HTTP and the outbox.
 */
export { users, userRole, activeSession } from '../../../services/identity/src/db/schema';
export {
  stores,
  products,
  productReviews,
  appReview,
} from '../../../services/catalog/src/db/schema';
export {
  wallets,
  walletTransactions,
  addresses,
  carts,
  cartItems,
  orders,
  orderItems,
  orderStatusHistory,
  vouchers,
  promos,
  deliveryJobs,
  systemTimeOffset,
  productRefs,
  storeRefs,
  inventory,
} from '../../../services/commerce/src/db/schema';
