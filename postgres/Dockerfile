FROM postgres:16-alpine

COPY mbg-frontend-git/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY mbg-frontend-git/database/auth-schema.sql /docker-entrypoint-initdb.d/02-auth-schema.sql
COPY mbg-frontend-git/database/seed.sql /docker-entrypoint-initdb.d/03-seed.sql
COPY mbg-frontend-git/database/migrations/001_add_supplier_management.sql /docker-entrypoint-initdb.d/04-add-supplier-management.sql
COPY mbg-frontend-git/database/migrations/001_add_stock_and_sales_system.sql /docker-entrypoint-initdb.d/05-add-stock-and-sales-system.sql
COPY mbg-frontend-git/database/migrations/002_add_sppg_is_active.sql /docker-entrypoint-initdb.d/06-add-sppg-is-active.sql
COPY mbg-frontend-git/database/migrations/003_add_offtaker_management.sql /docker-entrypoint-initdb.d/07-add-offtaker-management.sql
COPY mbg-backend-git/src/db/migrations/001_user_profiles_unique_user_id.sql /docker-entrypoint-initdb.d/08-user-profiles-unique-user-id.sql
COPY mbg-backend-git/src/db/migrations/002_menu_items_nullable_nutrition.sql /docker-entrypoint-initdb.d/09-menu-items-nullable-nutrition.sql
COPY mbg-backend-git/src/db/migrations/003_laporan_pesan_tujuan.sql /docker-entrypoint-initdb.d/10-laporan-pesan-tujuan.sql
COPY mbg-backend-git/src/db/migrations/004_sppgs_add_is_active.sql /docker-entrypoint-initdb.d/11-sppgs-add-is-active.sql

RUN chmod 0644 /docker-entrypoint-initdb.d/*.sql
