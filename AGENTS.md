# AGENTS.md — LAWMA Mobile App

## Project Overview

The LAWMA Mobile App is a resident-facing waste management platform for Lagos State residents.

The app helps residents:
- Track waste collection schedules
- Report sanitation-related issues
- Pay waste bills digitally
- Receive real-time notifications
- Access recycling and environmental education resources

This application is designed as a lightweight, mobile-first MVP optimized for:
- Low-friction onboarding
- Low-tech users
- Poor network conditions
- Fast interactions
- Scalability across Lagos State

The application is NOT a social platform.
The application is NOT a marketplace.
The application is NOT a complex enterprise dashboard.

The focus is operational simplicity, trust, transparency, and usability.

---

# Product Principles

The agent MUST follow these principles at all times.

## Core UX Principles
- Mobile-first always
- Minimal onboarding friction
- Extremely clear user flows
- Avoid cognitive overload
- Fast interactions
- Clear feedback states
- Trust-building UI
- Accessible for low-tech users
- Lightweight UI architecture
- Offline-tolerant experience

## Design Philosophy
The UI should feel:
- Clean
- Functional
- Modern
- Calm
- Government-trusted
- Operationally reliable

Avoid:
- Over-designed interfaces
- Heavy animations
- Cluttered screens
- Complex navigation
- Fancy but unnecessary interactions

---

# Primary Users

## Residents
- Apartment tenants
- Landlords
- Estate residents
- Market traders
- Small business owners

## Secondary Users
- PSP Operators
- LAWMA operational staff

---

# MVP Scope

## Included Features
- Resident onboarding
- OTP authentication
- Address setup
- Waste collection schedule
- Collection reminders
- Complaint reporting
- Photo uploads
- GPS/location capture
- Digital payments
- Push notifications
- Recycling education hub
- Resident profile
- Complaint tracking
- Payment history

## Excluded Features
DO NOT BUILD:
- Community/social systems
- Gamification
- AI route optimization
- Marketplace features
- Real-time truck tracking
- In-app chat systems
- Complex admin dashboards

---

# Tech Stack (STRICT)

The agent MUST NOT deviate from this stack unless explicitly instructed.

## Frontend Framework
- Next.js

## Backend/API Layer
- Next.js Route Handlers / API Routes

## ORM
- Prisma

## Database
- PostgreSQL

---

# Architecture Rules

## Code Quality
- Use reusable components
- Avoid duplicated logic
- Prefer modular architecture
- Keep components small
- Use strict typing
- Avoid unnecessary abstractions

## API Layer
- Centralize API calls
- Use service-based architecture
- Validate all API responses
- Handle network failures gracefully

## Database
- Use Prisma schema management
- Normalize relational data properly
- Use indexed queries for performance-sensitive operations

---

# Recommended Folder Structure

```txt
src/
├── app/
│   ├── api/
│   ├── onboarding/
│   ├── complaints/
│   ├── payments/
│   ├── schedules/
│   ├── profile/
│   ├── notifications/
│   └── recycling/
│
├── components/
├── services/
├── lib/
├── prisma/
├── hooks/
├── utils/
├── constants/
├── types/
├── styles/
└── middleware/