# COPO Management System

## Overview

This is a full-stack COPO (Course Outcome - Program Outcome) Management System designed for educational institutions to track and analyze student attainment. The application provides role-based access control for administrators, HODs, faculty, and students to manage academic data, course outcomes, and generate comprehensive reports.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database ORM**: Drizzle ORM
- **Session Store**: PostgreSQL session store with fallback to memory store
- **Password Security**: Node.js crypto module with scrypt hashing

### Database Schema
- **Users**: Role-based user management (admin, hod, faculty, student)
- **Departments**: Academic department organization
- **Subjects**: Course/subject management with faculty assignments
- **Course Outcomes**: Learning objectives and assessments
- **Program Outcomes**: Institution-wide learning goals
- **Attainments**: Performance tracking and analysis
- **Activity Logs**: System audit trail
- **Notifications**: User communication system

## Key Components

### Authentication & Authorization
- **Passport.js Strategy**: Local username/password authentication
- **Role-Based Access Control**: Four distinct user roles with specific permissions
- **Password Reset**: WhatsApp-based OTP system for secure password recovery
- **Session Management**: Secure session handling with PostgreSQL persistence

### WhatsApp Integration
- **Development Mode**: Mock WhatsApp service for testing (current configuration)
- **Production Mode**: Real WhatsApp Web integration using whatsapp-web.js
- **OTP Delivery**: Secure one-time password delivery for password resets
- **Switchable Implementation**: Scripts to toggle between dev/prod WhatsApp services

### Data Management
- **Subject Assignments**: Faculty-to-subject mapping system
- **Course Planning**: Comprehensive course outcome definition
- **Assessment Tracking**: Direct and indirect assessment management
- **Attainment Calculation**: Automated performance analysis

### Reporting & Analytics
- **Role-Specific Dashboards**: Customized views for each user type
- **Performance Charts**: Visual representation using Recharts
- **Export Capabilities**: Data export functionality for reports
- **Audit Trails**: Complete activity logging system

## Data Flow

1. **User Authentication**: Users log in through Passport.js local strategy
2. **Role-Based Routing**: Frontend routes protected based on user roles
3. **API Requests**: TanStack Query manages server state and caching
4. **Database Operations**: Drizzle ORM handles PostgreSQL interactions
5. **Real-time Updates**: Query invalidation ensures fresh data
6. **Session Persistence**: PostgreSQL session store maintains user state

## External Dependencies

### Production Dependencies
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **WhatsApp**: WhatsApp Web client for OTP delivery (production mode)
- **System Libraries**: Puppeteer dependencies for WhatsApp Web automation

### Development Dependencies
- **Node.js 20**: Runtime environment
- **TypeScript**: Type safety and development experience
- **ESBuild**: Fast bundling for production builds

### Key Libraries
- **Authentication**: passport, passport-local, express-session
- **Database**: drizzle-orm, @neondatabase/serverless
- **UI Components**: @radix-ui/* components, tailwindcss
- **Validation**: zod, @hookform/resolvers
- **Charts**: recharts for data visualization
- **WhatsApp**: whatsapp-web.js, qrcode-terminal (production mode)

## Deployment Strategy

### Environment Configuration
- **Development**: Mock WhatsApp service, memory session store fallback
- **Production**: Real WhatsApp Web integration, PostgreSQL session store
- **Database**: PostgreSQL via Neon serverless or similar provider

### Build Process
1. **Frontend Build**: Vite builds React application to dist/public
2. **Server Build**: ESBuild bundles server code to dist/index.js
3. **Database Migration**: Drizzle kit handles schema migrations
4. **Asset Management**: Static assets served from server/public

### Deployment Steps
1. Install system dependencies for Puppeteer/Chrome
2. Switch to production WhatsApp service using helper scripts
3. Configure PostgreSQL database connection
4. Run initial QR code authentication for WhatsApp
5. Deploy with npm run build && npm run start

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL and additional tools
- **Development**: npm run dev starts both frontend and backend
- **Production**: Autoscale deployment target with build/start scripts
- **Port Configuration**: Internal port 5000 mapped to external port 80

## Changelog

Changelog:
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.