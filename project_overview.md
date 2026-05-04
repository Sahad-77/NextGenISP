# Project Overview: NextGenISP

NextGenISP is a comprehensive Internet Service Provider (ISP) Management System designed to handle the end-to-end lifecycle of internet fiber/wireless services. It integrates customer onboarding, subscription management, billing, technical support, and inventory tracking into a unified platform.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Headless UI / Heroicons |
| **Backend** | Python (Django), Django REST Framework (DRF) |
| **Database** | SQLite (Default), scalable to PostgreSQL/MySQL |
| **Auth** | JWT (JSON Web Tokens) via `rest_framework_simplejwt` |
| **Payments** | Razorpay Integration (Test Mode) |
| **Infrastructure** | Vite dev server, Django development server |

---

## Core Concepts

### 1. Unified Operations
The system bridges the gap between customer requests and field operations. When a customer signs up, the system automatically creates installation tasks for staff, tracks hardware assets, and starts the billing cycle once activated.

### 2. Geographic Zone Management
Services are defined by **Areas**. Admins can draw polygons (coordinates) to define service zones, track network health per zone, and show maintenance warnings to specific clusters of users.

### 3. Role-Based Access Control (RBAC)
- **Customers**: Manage their own connection, pay bills, and raise support tickets.
- **Field Staff**: Handle physical installations and wire repairs.
- **Technical Staff**: Handle configuration and logical network issues.
- **Admins**: Full control over business data, staff assignments, and financial reporting.

---

## Module Descriptions

### 🛡️ User & Identity Management
- **Role Management**: Dynamic roles for Admin, Technical Staff, Field Staff, and Customers.
- **Onboarding Pipeline**: Tracks prospective users from "Lead" status through "Installation" to "Active" status.
- **Profile Security**: Secure login, registration, and password reset flows.

### 💰 Billing & Finance
- **Automated Invoicing**: Generates monthly bills based on active subscriptions.
- **Payment Gateway**: Integrated with Razorpay for online payments.
- **Plan Upgrades**: Supports seamless transition between different speed/data tiers.
- **Promo System**: Discount codes for marketing campaigns.

### 🛠️ Service & Operations (CRM)
- **Smart Ticketing**: Distinguishes between "Logical" (speed/access) and "Physical" (line cut/device failure) issues.
- **Installation Workflow**: Multi-step assignment flow ensuring both field staff (physical) and technical staff (activation) are involved.
- **Real-time Updates**: Status tracking for open issues and installation requests.

### 📦 Inventory & Asset Management
- **Warehouse Tracking**: Monitors stock levels of routers, fiber cables, and connectors.
- **Asset Assignment**: Tracks exactly which device (by Serial Number/MAC) is assigned to which customer.
- **Low Stock Alerts**: Notifies admins when inventory reaches defined thresholds.

### 🗺️ Network Visualization
- **Live Coverage Map**: Visual representation of service areas using coordinates.
- **User Distribution**: Plotting customer locations on a map for better capacity planning.
- **Maintenance Overlays**: Visual indicators for zones currently under repair.

---

## Main Features

- **Responsive Dashboard**: Tailored views for all 4 user roles.
- **Usage Statistics**: Customers can view their plan details and status.
- **Broadcast System**: Admins can send announcements to specific areas or all users.
- **Workload Monitoring**: Tracking staff productivity and pending task density.
- **Diagnostic Terminal**: (Feature in progress) For simulated network troubleshooting.
- **Public Product Catalog**: Marketing site showing plans and hardware to visitors.
