#!/bin/bash
# Healthy once this node is primary; initiates the single-node replica set on first run.
mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval '
  try { rs.status() } catch (e) { rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "catalog-db:27017" }] }) }
  quit(db.hello().isWritablePrimary ? 0 : 1)
'
