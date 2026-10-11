import { z } from 'zod';
import { customMsg } from '@seapedia/platform/schemas';

export const setStockSchema = z
  .object({
    stock: z
      .number(customMsg('Stok wajib diisi', 'Stok harus berupa angka'))
      .int('Stok harus berupa bilangan bulat')
      .nonnegative('Stok tidak boleh bernilai negatif'),
  })
  .meta({ id: 'SetStock' });

export const stockResponseSchema = z
  .object({
    productId: z.string(),
    stock: z.number().int(),
  })
  .meta({ id: 'StockResponse' });
