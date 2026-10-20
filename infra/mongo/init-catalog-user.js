// Runs once on an empty data volume: the catalog service's own least-privilege user.
db.getSiblingDB('catalog').createUser({
  user: 'catalog',
  pwd: process.env.CATALOG_DB_PASSWORD,
  roles: [{ role: 'readWrite', db: 'catalog' }],
});
