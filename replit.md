# SalonPro - Multi-Store Salon Management System

## Overview
SalonPro is a comprehensive multi-store salon and nail studio billing application. It offers QR/barcode scanning, loyalty management, and membership features. The system provides a modern web interface for managing customers, inventory, services, and billing across multiple store locations, aiming to streamline salon operations and enhance customer engagement.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **UI**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Authentication**: Basic email/mobile + password authentication with Passport.js
- **Session Management**: Express sessions with PostgreSQL store (initial design) / MemoryStore (current implementation for SQLite)
- **API Pattern**: RESTful API
- **Security**: Role-based access control (RBAC) with granular permissions
- **Validation**: Input validation middleware with Zod schemas

### Database
- **Database**: PostgreSQL (Neon serverless - initial design) / SQLite (current implementation)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit (for PostgreSQL)
- **Connection**: @neondatabase/serverless (for PostgreSQL)

### Key Features
- **Multi-Store Management**: Store-specific data isolation, role-based access.
- **Customer Management**: Profiles, visit history, loyalty points, membership tracking.
- **Billing System**: Service/product billing, QR/barcode scanning, discount application, PDF invoice generation, real-time calculations.
- **Inventory Management**: Product catalog, stock tracking, low stock alerts, categorization.
- **Service Management**: Service catalog, pricing, duration tracking.
- **Membership & Loyalty**: Plan management, points system, automatic discounts.
- **Reporting & Analytics**: Sales reports, dashboard metrics, transaction history, visual charts.
- **Security & Access Control**: Three-tier RBAC (Super Admin, Store Manager, Executive), granular permissions, input validation, store isolation, password hashing.
- **Appointment System**: Public booking page, internal management, real-time availability, dynamic time slot generation, automatic confirmations (SMS, Email, WhatsApp).
- **Communication System**: Multi-channel integration (SMS, Email, WhatsApp) with customizable templates and message history.

## External Dependencies

### Core
- **@neondatabase/serverless** (for PostgreSQL connection, if used)
- **drizzle-orm**
- **@tanstack/react-query**
- **express**
- **passport**

### UI
- **@radix-ui/**
- **tailwindcss**
- **recharts**
- **jspdf**

### Communication Gateways
- **MSG91/SMS Gateway Hub** (SMS)
- **SMTP/SendGrid/Gmail** (Email)
- **Ultramsg** (WhatsApp Business API)