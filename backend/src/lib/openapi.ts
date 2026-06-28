import { resolver } from 'hono-openapi';
import { z } from 'zod';
import { errorSchema } from './schemas';

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

export function jsonContent(schema: z.ZodType, description: string) {
  return {
    content: { 'application/json': { schema: resolver(schema) } },
    description,
  };
}

export function errorResponse(status: number, description?: string) {
  return {
    ...jsonContent(errorSchema, description ?? STATUS_TEXT[status] ?? String(status)),
  };
}

export function errorResponses(...statuses: number[]) {
  return Object.fromEntries(statuses.map((s) => [s, errorResponse(s)]));
}

export function hoistDefs(
  spec: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!spec) return spec;
  const docs = JSON.parse(JSON.stringify(spec));
  if (!docs.components) docs.components = {};
  if (!docs.components.schemas) docs.components.schemas = {};

  const traverseAndHoist = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) return;
    const record = obj as Record<string, unknown>;

    if (record.$defs && typeof record.$defs === 'object') {
      for (const [key, value] of Object.entries(record.$defs as Record<string, unknown>)) {
        (docs.components.schemas as Record<string, unknown>)[key] = value;
      }
      delete record.$defs;
    }

    for (const key in record) {
      traverseAndHoist(record[key]);
    }
  };

  traverseAndHoist(docs);

  const replaceRefs = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) return;
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      if (typeof record[key] === 'string' && key === '$ref') {
        const ref = record[key] as string;
        if (ref.includes('$defs/')) {
          const parts = ref.split('$defs/');
          const schemaName = parts[parts.length - 1];
          record[key] = `#/components/schemas/${schemaName}`;
        }
      } else {
        replaceRefs(record[key]);
      }
    }
  };
  replaceRefs(docs);
  return docs;
}
