// Unit tests never reach Elasticsearch or catalog; env only needs to pass validation.
process.env.INTERNAL_API_TOKEN ??= 'test-internal-token-0000';
process.env.CATALOG_SERVICE_URL ??= 'http://catalog.test';
process.env.ELASTICSEARCH_URL ??= 'http://elasticsearch.test:9200';
process.env.ELASTICSEARCH_PASSWORD ??= 'test';
