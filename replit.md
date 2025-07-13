# SalonPro - Multi-Store Salon Management System

## Overview

SalonPro is a comprehensive multi-store salon and nail studio billing application with QR/barcode scanning, loyalty management, and membership features. The system provides a modern web interface for managing customers, inventory, services, and billing across multiple store locations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Basic email/mobile + password authentication with Passport.js
- **Session Management**: Express sessions with PostgreSQL store
- **API Pattern**: RESTful API with structured error handling

### Database Architecture
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### 1. Multi-Store Management
- Store-specific data isolation
- Role-based access control (super_admin, store_manager, cashier)
- Store selection interface in header

### 2. Customer Management
- Customer profiles with contact information
- Visit history tracking
- Loyalty points system
- Membership status tracking

### 3. Billing System
- Service and product billing
- QR/barcode scanning support
- Automatic discount application
- PDF invoice generation
- Real-time calculation of taxes and totals

### 4. Inventory Management
- Product catalog with barcode support
- Stock level tracking
- Low stock alerts
- Category and brand organization

### 5. Service Management
- Service catalog with pricing
- Duration tracking
- Category-based organization

### 6. Membership & Loyalty
- Membership plan management
- Points-based loyalty system
- Automatic discount application
- Benefits tracking

### 7. Reporting & Analytics
- Sales reports with date filtering
- Dashboard with key metrics
- Transaction history
- Visual charts using Recharts

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Store Selection**: Users select active store, filters all subsequent data queries
3. **Billing Flow**: Items added to cart → customer selection → discount/points application → payment processing → PDF generation
4. **Inventory Updates**: Stock levels automatically updated during billing transactions
5. **Loyalty Processing**: Points calculated and awarded/redeemed during transactions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **recharts**: Chart visualization library
- **jspdf**: PDF generation for invoices

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Replit-specific plugins for error overlay and cartographer

### Production Build
- Vite builds client to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Static file serving via Express
- Environment variables for database and session configuration

### Database Management
- Schema defined in `shared/schema.ts`
- Migrations generated via `drizzle-kit push`
- Environment variable `DATABASE_URL` required

### Session Storage
- PostgreSQL-backed sessions for scalability
- Session table created automatically if missing
- Configurable TTL (default: 1 week)

## Changelog

```
Changelog:
- June 28, 2025. Initial setup with comprehensive salon management system
- June 28, 2025. Added barcode and QR code printing for inventory labels
- June 28, 2025. Added salon logo upload functionality and role-based authentication
- June 28, 2025. Enhanced barcode/QR labels with salon branding (logo + name)
- June 28, 2025. Fixed store settings permissions - updated user role to store_manager
- June 28, 2025. Added staff management with edit/delete roles functionality
- June 28, 2025. Added "Add Staff" feature to invite new staff members by email
- June 28, 2025. Replaced Replit Auth with basic email/password authentication for cPanel hosting
- June 28, 2025. Created comprehensive login/registration system with proper password hashing
- June 28, 2025. Updated database schema to support mobile numbers and password authentication
- June 28, 2025. Implemented complete store management system with role-based access control
- June 28, 2025. Added staff password creation and change functionality with secure hashing
- June 28, 2025. Created multi-store management page for super admins to create and view stores
- June 28, 2025. Fixed transaction creation validation issues and payment processing
- June 28, 2025. Enhanced customer search with dropdown selection in billing modal
- June 28, 2025. Implemented optional receipt printing workflow after payment completion
- June 28, 2025. Added thermal receipt printing with ESC/POS commands and cash drawer opening
- June 28, 2025. Changed currency symbol from ₹ to "Rs." in all PDF and print outputs
- June 28, 2025. Made entire application responsive for mobile and tablet devices with touch-friendly interface
- June 28, 2025. Fixed reports functionality with improved transaction fetching and type safety
- June 28, 2025. Resolved top services and products display issues in reports by removing restrictive date filtering
- June 28, 2025. Enhanced billing system with walk-in customer details form (name, mobile, DOB, gender)
- June 28, 2025. Removed payment amount display from receipt completion dialog
- June 28, 2025. Fixed currency symbol consistency to "Rs." throughout billing interface
- June 28, 2025. Added phone number validation - 10 digits only, cannot start with 0 or +
- June 28, 2025. Fixed customer profile view buttons with detailed customer modal
- June 28, 2025. Implemented complete image upload functionality for products and services with 5MB file size limits
- June 28, 2025. Added dynamic product category management system with add, edit, and delete functionality
- June 28, 2025. Created comprehensive service category management system with database-driven CRUD operations
- June 28, 2025. Implemented auto-generated barcodes for products to streamline inventory management
- June 28, 2025. Replaced hardcoded categories with dynamic category management for both products and services
- June 28, 2025. Redesigned New Bill interface with square box layout for products and services optimized for touch screens
- June 28, 2025. Added quantity increment logic - duplicate items now increase quantity instead of creating separate entries
- June 28, 2025. Enhanced bill item controls with +/- quantity buttons and price editing for both services and products
- June 28, 2025. Expanded services and products display area with 3-column grid layout and increased height for better visibility
- June 28, 2025. Fixed payment button text overflow with responsive design and vertical text stacking for better mobile display
- June 28, 2025. Reorganized Current Bill section with compact layout - reduced item height, smaller buttons, and better space utilization
- June 28, 2025. Major billing interface redesign - moved customer selection to horizontal top bar, reduced product/service boxes to 100x100px for optimal space usage
- June 28, 2025. iPad-optimized billing interface with proper margins, larger touch targets (120px min-height), enhanced spacing, and touch-friendly controls
- June 28, 2025. Fixed barcode scanning functionality - corrected API endpoint mismatch and enhanced error handling for reliable product scanning
- June 28, 2025. Implemented comprehensive store allocation system for staff members with role-based access control to restrict cashiers and managers to their assigned stores
- June 28, 2025. Added comprehensive WhatsApp Business API integration with settings, templates, message history, and campaign management
- June 28, 2025. Created WhatsApp database tables and API endpoints for automated messaging functionality
- June 28, 2025. Added "Back to Settings" button on WhatsApp page for improved navigation
- June 28, 2025. Enhanced billing system with discount options - added both percentage and amount discount functionality with real-time calculation preview
- June 28, 2025. Added comprehensive login page customization system with super admin controls for company branding, logo upload, content management, and "Designed by - My Internet" footer credit
- June 28, 2025. Implemented comprehensive advanced reports and analytics system with date range filtering, day-to-day sales trends, week-on-week and month-on-week comparisons, total discount tracking, tabbed interface (Overview/Analytics/Products/Services/Comparisons), product-wise and service-wise performance reports, revenue vs discount trend analysis, and visual charts with real data integration
- June 28, 2025. Fixed critical customer creation validation error by adding required storeId parameter to CustomerForm component
- June 28, 2025. Resolved authentication infinite loop causing 401 errors - improved session handling and query optimization
- June 28, 2025. Successfully debugged and tested complete salon management system - all major features now fully operational
- July 8, 2025. Enhanced billing system with payment method selection (Cash/Card/UPI), staff service tracking, daily sales reports with payment breakdown, staff performance analytics, and thermal receipt printing with payment method and staff information
- July 8, 2025. Fixed customer transaction history to show only actual bills with items and flushed/seeded database with realistic salon data for proper testing
- July 13, 2025. Created comprehensive appointment booking system with public embeddable booking page (/book-appointment) and internal appointment management page (/appointments) for staff - customers can select store, date/time, services, and enter personal details, while staff can view, confirm, and manage all appointments with real-time availability checking
- July 13, 2025. Fixed critical validation issues in service and product creation forms - updated insertServiceSchema and insertProductSchema to accept both string and number inputs for price fields, resolving "Invalid service data" and "Invalid product data" errors
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```