# Clothing Store — Stock & Warehouse Manager Portal (`stock_manager_front`)

Dedicated Nuxt 3 + `@nuxt/ui` + Pinia frontend for Warehouse & Stock Managers (`WAREHOUSE`, `MANAGER`, and `ADMIN` roles).

## Features
- **Stock Dashboard (`/dashboard`)**: Real-time low-stock alerts, stock dispatch metrics, and quick warehouse workflows.
- **Warehouse & Stock (`/inventory`)**:
  - Multi-warehouse stock levels (`/inventory`)
  - Auditable stock movement ledger (`/inventory/movements`)
  - Inter-warehouse stock transfers (`/inventory/transfers`)
  - Stock adjustments (`/inventory/adjustments`)
- **Catalog & Labels (`/products`, `/labels`)**:
  - Product & variant SKU management (`/products`)
  - Printable barcode & QR sticker labels (`/labels`, `/labels/generate`)
- **Purchasing & Receiving (`/purchases`, `/suppliers`)**:
  - Purchase orders & goods receiving (`/purchases`)
  - Supplier directory (`/suppliers`)
- **Reports (`/reports/inventory`, `/reports/purchases`)**:
  - Inventory valuation & low-stock report
  - Purchase analytics

## Setup & Development

```bash
npm install
npm run dev       # Starts on http://localhost:3003
npm run typecheck # Runs vue-tsc type checking
npm run build     # Builds production bundle
```
