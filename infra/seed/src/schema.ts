/**
 * Ops exception: the seed tool writes each service's store directly, so it imports their schemas.
 * Runtime services never do this; they only talk through Kong, events, and scoped internal calls.
 */
export { users, userRole } from '../../../services/identity/src/db/schema';
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
  userRefs,
  inventory,
} from '../../../services/commerce/src/db/schema';
