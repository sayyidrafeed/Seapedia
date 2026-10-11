import { z } from 'zod';

/** The parts of a service's OpenAPI document the gateway merges. */
export const specSchema = z.object({
  paths: z.record(z.string(), z.unknown()).optional(),
  components: z.object({ schemas: z.record(z.string(), z.unknown()).optional() }).optional(),
});

type Spec = z.infer<typeof specSchema>;

/**
 * Merges the domain services' OpenAPI documents into the single public contract the frontend
 * generates its SDK from. Two services defining the same path or a schema name with a different
 * shape is a contract bug, so it fails loudly instead of letting one silently win.
 */
export function mergeSpecs(specs: Record<string, Spec>, serverUrl: string) {
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};
  const owners = new Map<string, string>();

  for (const [service, spec] of Object.entries(specs)) {
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
      if (path in paths)
        throw new Error(`OpenAPI path ${path} defined by ${owners.get(path)} and ${service}`);
      paths[path] = item;
      owners.set(path, service);
    }
    for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
      if (name in schemas && JSON.stringify(schemas[name]) !== JSON.stringify(schema)) {
        throw new Error(
          `OpenAPI schema ${name} differs between ${owners.get(`#${name}`)} and ${service}`,
        );
      }
      schemas[name] = schema;
      owners.set(`#${name}`, service);
    }
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Seapedia API',
      version: '1.0.0',
      description: 'Public API served by the Seapedia gateway (identity, catalog, commerce).',
    },
    servers: [{ url: serverUrl }],
    paths,
    components: {
      schemas,
      securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: '__session' } },
    },
  };
}
