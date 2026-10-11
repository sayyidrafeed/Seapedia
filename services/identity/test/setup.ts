// Unit tests mock the database and peers; env only needs to pass validation.
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.INTERNAL_API_TOKEN ??= 'test-internal-token-0000';
