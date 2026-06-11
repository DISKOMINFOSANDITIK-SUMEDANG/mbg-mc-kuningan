FROM postgres:16-alpine

COPY mbg-frontend-git/database/db_mbg_local_export_20260510_063517.sql /docker-entrypoint-initdb.d/01-db-mbg-local-export.sql

RUN chmod 0644 /docker-entrypoint-initdb.d/*.sql
