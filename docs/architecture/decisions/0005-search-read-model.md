# 0005: Product search as an Elasticsearch read model

Status: accepted (2026-10)

## Context

Product search was an ILIKE scan. Elasticsearch gives typo tolerance, language analysis
(Indonesian), and relevance ranking.

## Decision

The search service owns an Elasticsearch index fed by catalog's outbox and rebuilt with an alias
swap. It returns ranked product ids only. Catalog loads the rows from its own database in that
order and falls back to ILIKE when search is unconfigured, slow (500 ms), or down.

## Consequences

- Prices and stock in results are always current; deleted products drop out at load time.
- Search being down degrades ranking, not availability.
- Elasticsearch is the largest memory consumer (about 0.9 GB measured with a 512 MB heap).
