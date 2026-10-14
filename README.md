# Stitch PIM & WooCommerce Hub

An enterprise-grade Product Information Management (PIM) system featuring centralized catalogue management, Code 128 barcode generation and printing, Excel batch workflows, role-based access control, and bi-directional WooCommerce REST API synchronization.

---

## 🗂 Project Structure

```
repository-root/
├── README.md
├── .env.example
├── package.json
├── server.ts                       # Integrated Full-Stack Express Server (port 3000)
├── database/
│   └── schema.sql                  # Production MySQL DDL script with full seeds
├── backend/                        # Standalone Backend Project
│   ├── package.json                # Dedicated backend dependencies & scripts
│   ├── .env.example                # Backend environment configuration
│   └── src/
│       ├── server.js               # Standalone Express Server (port 5000)
│       ├── config/
│       │   └── db.config.js        # MySQL connection pool (mysql2/promise)
│       ├── database/
│       │   ├── schema.sql          # MySQL database schema
│       │   └── initScript.js       # CLI database initialization runner
│       ├── models/
│       │   ├── Product.js          # Product data queries & filtering
│       │   └── Category.js         # Categories & Attributes models
│       ├── controllers/
│       │   ├── productController.js
│       │   ├── categoryController.js
│       │   ├── wooCommerceController.js
│       │   ├── excelController.js
│       │   ├── authController.js
│       │   └── reportController.js
│       ├── middleware/
│       │   ├── auth.js             # JWT authentication & RBAC authorization
│       │   └── errorHandler.js     # Centralized error handler
│       └── routes/
│           ├── productRoutes.js
│           ├── categoryRoutes.js
│           ├── wooCommerceRoutes.js
│           ├── excelRoutes.js
│           ├── authRoutes.js
│           └── reportRoutes.js
└── src/                            # React + Vite Frontend
    ├── api/client.ts               # Axios API client (uses VITE_API_BASE_URL)
    ├── components/
    │   ├── barcode/                # JsBarcode Code 128 & label printing
    │   └── products/               # Product modals & variant builder
    ├── context/                    # AuthContext & ToastContext
    ├── layouts/                    # AppLayout with collapsible sidebar
    └── pages/                      # Dashboard, Catalogue, Barcodes, Woo, Excel, Reports, DB
```

---

## 🚀 Running the Project

You can run the project in **two ways**:

### Option 1: Integrated Full-Stack Mode (Port 3000) — Default
Runs both the Express API routes (`/api/*`) and the React Vite client together seamlessly on port 3000:
```bash
npm install
npm run dev
```
Open: `http://localhost:3000`

### Option 2: Standalone Backend Mode (Port 5000)
If you prefer running the backend in its own terminal or separate container:
```bash
cd backend
npm install
npm start
```
The API server will listen on `http://localhost:5000`. You can point your frontend to it by setting `VITE_API_BASE_URL="http://localhost:5000/api"` in `.env`.

---

## 🗄 MySQL Database Setup

The production DDL schema script is located at:
`backend/src/database/schema.sql` (or `database/schema.sql`)

### Manual MySQL Import:
```bash
mysql -u root -p < database/schema.sql
```

### Automated Node.js Runner:
```bash
cd backend
npm run db:init
```

### Configure Connection in `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=stitch_admin
DB_PASSWORD=your_password
DB_NAME=stitch_pim
```
*Note: If no MySQL credentials are provided, the system automatically uses the internal Unified Store pre-populated with sample products, categories, variants, and logs, making it 100% testable out of the box.*

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login & JWT token issuance |
| `GET` | `/api/auth/me` | Fetch authenticated session |
| `POST` | `/api/auth/switch` | Instant role switch for evaluator demonstration |
| `GET` | `/api/products` | Filter, search, paginate product catalogue |
| `GET` | `/api/products/:id` | Get product details & variants |
| `POST` | `/api/products` | Create product (validates SKU, barcode, price) |
| `PUT` | `/api/products/:id` | Update product fields |
| `DELETE` | `/api/products/:id` | Delete product (admin only) |
| `POST` | `/api/products/bulk` | Bulk delete, status change, or sync queue |
| `GET` | `/api/products/lookup/barcode/:barcode` | Rapid Code 128 barcode search |
| `GET` | `/api/categories` | List categories with product counts |
| `POST` | `/api/categories` | Add category |
| `DELETE` | `/api/categories/:id` | Delete category with reference protection |
| `GET` | `/api/attributes` | List reusable attributes & terms |
| `GET` | `/api/woocommerce/config` | Retrieve store connection configuration |
| `POST` | `/api/woocommerce/config` | Save store URL & API credentials |
| `POST` | `/api/woocommerce/test-connection` | Verify handshake with store REST API |
| `POST` | `/api/woocommerce/sync/product/:id` | Push product to WooCommerce |
| `POST` | `/api/woocommerce/sync/all` | Batch sync pending catalogue items |
| `POST` | `/api/woocommerce/import` | Import products from store |
| `GET` | `/api/woocommerce/logs` | View synchronization audit logs |
| `POST` | `/api/woocommerce/logs/:id/retry` | Re-execute failed sync job |
| `GET` | `/api/excel/template` | Download `.xlsx` sample template |
| `POST` | `/api/excel/validate` | Validate rows for duplicates & schema errors |
| `POST` | `/api/excel/import` | Commit validated batch rows |
| `GET` | `/api/excel/export` | Export catalogue as `.xlsx` or `.csv` |
| `GET` | `/api/reports/overview` | Dashboard KPI metrics |
| `GET` | `/api/reports/categories-distribution` | Valuation breakdown per category |
| `GET` | `/api/reports/activity` | Administrative audit trail |
| `GET` | `/api/reports/database-status` | Database engine diagnostics |
