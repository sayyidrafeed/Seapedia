import { db } from '@/db';
import {
  simulationState,
  orders,
  orderItems,
  orderStatusHistory,
  products,
  wallets,
  walletTransactions,
} from '@/db/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { ConflictError } from '@/lib/errors';

const SIMULATION_STATE_ID = '00000000-0000-0000-0000-000000000001';

const OVERDUE_SLA_HOURS: Record<string, number> = {
  instant: 12,
  next_day: 24,
  regular: 72,
};

export class OverdueService {
  static async getDayOffset(): Promise<number> {
    const [state] = await db
      .select()
      .from(simulationState)
      .where(eq(simulationState.id, SIMULATION_STATE_ID))
      .limit(1);

    return state?.dayOffset ?? 0;
  }

  static async simulateDay(): Promise<number> {
    const existing = await db
      .select()
      .from(simulationState)
      .where(eq(simulationState.id, SIMULATION_STATE_ID))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(simulationState).values({
        id: SIMULATION_STATE_ID,
        dayOffset: 1,
      });
      return 1;
    }

    const newOffset = existing[0].dayOffset + 1;
    await db
      .update(simulationState)
      .set({ dayOffset: newOffset, updatedAt: new Date() })
      .where(eq(simulationState.id, SIMULATION_STATE_ID));

    return newOffset;
  }

  static async processOverdueOrders(): Promise<{
    processedCount: number;
    details: Array<{
      orderId: string;
      status: string;
      refundAmount: number;
      stockRestored: boolean;
    }>;
  }> {
    const dayOffset = await this.getDayOffset();
    const simulatedNow = sql`NOW() + ${dayOffset} * INTERVAL '1 day'`;

    const overdueOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          sql`${orders.status} NOT IN ('pesanan_selesai', 'dikembalikan')`,
          sql`CASE ${orders.deliveryMethod}
            WHEN 'instant' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '12 hours'
            WHEN 'next_day' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '24 hours'
            WHEN 'regular' THEN ${orders.createdAt} < ${simulatedNow} - INTERVAL '3 days'
            ELSE FALSE
          END`,
        ),
      );

    if (overdueOrders.length === 0) {
      return { processedCount: 0, details: [] };
    }

    const details: Array<{
      orderId: string;
      status: string;
      refundAmount: number;
      stockRestored: boolean;
    }> = [];

    for (const order of overdueOrders) {
      await db.transaction(async (tx) => {
        const [existingEntry] = await tx
          .select({ id: orderStatusHistory.id })
          .from(orderStatusHistory)
          .where(
            and(
              eq(orderStatusHistory.orderId, order.id),
              eq(orderStatusHistory.status, 'dikembalikan'),
            ),
          )
          .limit(1);

        if (existingEntry) {
          throw new ConflictError(`Order ${order.id} has already been returned`);
        }

        await tx
          .update(orders)
          .set({ status: 'dikembalikan', updatedAt: new Date() })
          .where(eq(orders.id, order.id));

        const refundAmount = order.totalAmount;

        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, order.buyerId))
          .limit(1);

        if (wallet) {
          await tx
            .update(wallets)
            .set({
              balance: sql`${wallets.balance} + ${refundAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, wallet.id));

          const reference = 'RFND-' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
          await tx.insert(walletTransactions).values({
            walletId: wallet.id,
            amount: refundAmount,
            type: 'refund',
            status: 'success',
            reference,
          });
        }

        let stockRestored = false;
        if (order.deliveryMethod === 'regular') {
          const orderItemRows = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          for (const item of orderItemRows) {
            if (item.productId) {
              await tx
                .update(products)
                .set({
                  stock: sql`${products.stock} + ${item.quantity}`,
                })
                .where(eq(products.id, item.productId));
              stockRestored = true;
            }
          }
        }

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          status: 'dikembalikan',
          note: `Pesanan melebihi batas waktu pengiriman. Refund sebesar Rp ${refundAmount.toLocaleString('id-ID')} telah dikembalikan ke dompet.${
            stockRestored ? ' Stok produk telah dikembalikan.' : ''
          }`,
        });

        details.push({
          orderId: order.id,
          status: 'dikembalikan',
          refundAmount,
          stockRestored,
        });
      });
    }

    return { processedCount: details.length, details };
  }
}
