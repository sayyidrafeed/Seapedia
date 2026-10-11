// Unit tests mock the database and peers; env only needs to pass validation.
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.INTERNAL_API_TOKEN ??= 'test-internal-token-0000';
process.env.IDENTITY_SERVICE_URL ??= 'http://identity.test';
process.env.COMMERCE_SERVICE_URL ??= 'http://commerce.test';
