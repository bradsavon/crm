# CRM Application Architecture

This document provides a comprehensive overview of the CRM application's architecture, design decisions, and implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Schema](#database-schema)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Frontend Architecture](#frontend-architecture)
8. [File Structure](#file-structure)
9. [Key Design Decisions](#key-design-decisions)
10. [Data Flow](#data-flow)
11. [Security Considerations](#security-considerations)

## System Overview

The CRM application is a full-stack web application built with Next.js 14, providing a comprehensive customer relationship management system. It follows a modern, component-based architecture with server-side rendering and API routes.

### Core Capabilities

- **Contact & Company Management**: Store and manage customer information
- **Case Pipeline Management**: Track sales cases through various stages
- **Task Management**: Create, assign, and track tasks with due dates and priorities
- **Meeting Scheduling**: Schedule and manage meetings with calendar integration
- **Document Management**: Upload, store, and organize documents
- **User Management**: Multi-user support with role-based access control
- **Activity Tracking**: Comprehensive audit trail of all system activities
- **Global Search**: Search across all entities in the system

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **FullCalendar**: Calendar component library
- **React Hooks**: State management and side effects

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **bcrypt**: Password hashing
- **JWT**: JSON Web Tokens for authentication

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **PostCSS**: CSS processing

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React UI   │  │  Components  │  │   Pages      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │
┌─────────────────────────────────────────────────────────┐
│              Next.js Application Server                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Middleware  │  │  API Routes  │  │  SSR Pages   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth Lib   │  │ Activity Lib │  │  MongoDB    │ │
│  └──────────────┘  └──────────────┘  │  Connection │ │
│                                      └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ MongoDB Protocol
                          │
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Collections │  │   Indexes    │  │   Documents  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Request**: User interacts with the UI (clicks, form submissions, etc.)
2. **Client-Side Processing**: React components handle UI updates and state management
3. **API Call**: Frontend makes HTTP requests to Next.js API routes
4. **Middleware**: Authentication and authorization checks
5. **API Route Handler**: Business logic execution
6. **Database Operation**: Mongoose models interact with MongoDB
7. **Response**: JSON response sent back to client
8. **UI Update**: React components update based on response

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Contact   │      │   Company   │      │    Case     │
│             │      │             │      │             │
│ - _id       │      │ - _id       │      │ - _id       │
│ - firstName │      │ - name      │      │ - title     │
│ - lastName  │      │ - industry  │      │ - value     │
│ - email     │      │ - email     │      │ - stage     │
│ - phone     │      │ - phone     │      │ - probability│
│ - company   │      │ - address   │      │ - company   │
│ - createdBy │      │ - createdBy │      │ - contact   │
│ - assignedTo│      │ - assignedTo│      │ - createdBy │
└─────────────┘      └─────────────┘      │ - assignedTo│
                                            └─────────────┘
      │                      │                      │
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ┌───────▼──────┐  ┌───────▼──────┐
            │    Task      │  │   Meeting    │
            │              │  │              │
            │ - _id        │  │ - _id        │
            │ - title      │  │ - title      │
            │ - description│  │ - startTime  │
            │ - dueDate    │  │ - endTime    │
            │ - priority   │  │ - organizer  │
            │ - status     │  │ - attendees  │
            │ - assignedTo │  │ - location   │
            │ - relatedTo  │  │ - relatedTo  │
            └──────────────┘  └──────────────┘
                    │                 │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Document     │
                    │                 │
                    │ - _id           │
                    │ - filename      │
                    │ - filepath      │
                    │ - relatedTo     │
                    │ - uploadedBy    │
                    └─────────────────┘
```

### Models

#### User Model
```typescript
{
  firstName: string
  lastName: string
  email: string (unique)
  password: string (hashed)
  role: 'admin' | 'manager' | 'sales-rep'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Contact Model
```typescript
{
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  notes?: string
  createdBy?: ObjectId (ref: User)
  assignedTo?: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

#### Company Model
```typescript
{
  name: string
  industry?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  description?: string
  createdBy?: ObjectId (ref: User)
  assignedTo?: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

#### Case Model
```typescript
{
  title: string
  value: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number (0-100)
  expectedCloseDate?: Date
  company?: string
  contact?: string
  description?: string
  createdBy?: ObjectId (ref: User)
  assignedTo?: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

#### Task Model
```typescript
{
  title: string
  description?: string
  dueDate?: Date
  reminderDate?: Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: ObjectId (ref: User)
  createdBy?: ObjectId (ref: User)
  relatedEntityType?: 'contact' | 'company' | 'case'
  relatedEntityId?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Meeting Model
```typescript
{
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  meetingType: 'in-person' | 'video' | 'phone' | 'hybrid'
  videoLink?: string
  organizer: ObjectId (ref: User)
  attendees: ObjectId[] (ref: User)
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  relatedEntityType?: 'contact' | 'company' | 'case'
  relatedEntityId?: string
  reminderMinutes: number[]
  externalCalendarId?: string
  externalCalendarProvider?: 'google' | 'outlook'
  createdAt: Date
  updatedAt: Date
}
```

#### Document Model
```typescript
{
  filename: string
  originalFilename: string
  filepath: string
  mimeType: string
  size: number
  description?: string
  category?: string
  relatedEntityType: 'contact' | 'company' | 'case'
  relatedEntityId: string
  uploadedBy: ObjectId (ref: User)
  createdAt: Date
  updatedAt: Date
}
```

#### Activity Model
```typescript
{
  type: 'created' | 'updated' | 'deleted' | 'assigned' | 'status-changed'
  entityType: 'contact' | 'company' | 'case' | 'user' | 'task' | 'meeting' | 'document'
  entityId: string
  userId: ObjectId (ref: User)
  description: string
  metadata?: object
  createdAt: Date
}
```

#### UserAvailability Model
```typescript
{
  user: ObjectId (ref: User, unique)
  timeZone: string
  availableSlots: [{
    dayOfWeek: number (0-6)
    startTime: string (HH:mm)
    endTime: string (HH:mm)
  }]
  createdAt: Date
  updatedAt: Date
}
```

## API Architecture

### API Route Structure

All API routes follow RESTful conventions and are located in `app/api/`:

```
app/api/
├── auth/
│   ├── login/route.ts      # POST - User authentication
│   ├── logout/route.ts     # POST - User logout
│   └── me/route.ts          # GET - Current user info
├── contacts/
│   ├── route.ts            # GET, POST - List/Create contacts
│   └── [id]/route.ts        # GET, PUT, DELETE - Contact operations
├── companies/
│   ├── route.ts            # GET, POST - List/Create companies
│   └── [id]/route.ts        # GET, PUT, DELETE - Company operations
├── cases/
│   ├── route.ts            # GET, POST - List/Create cases
│   └── [id]/route.ts        # GET, PUT, DELETE - Case operations
├── tasks/
│   ├── route.ts            # GET, POST - List/Create tasks
│   ├── [id]/route.ts       # GET, PUT, DELETE - Task operations
│   └── my/route.ts         # GET - Current user's tasks
├── meetings/
│   ├── route.ts            # GET, POST - List/Create meetings
│   └── [id]/route.ts       # GET, PUT, DELETE - Meeting operations
├── documents/
│   ├── route.ts            # GET - List documents
│   ├── upload/route.ts     # POST - Upload document
│   └── [id]/route.ts       # GET, DELETE - Document operations
├── users/
│   ├── route.ts            # GET, POST - List/Create users
│   ├── [id]/route.ts       # GET, PUT, DELETE - User operations
│   └── [id]/password/route.ts # PUT - Change password
├── search/route.ts         # GET - Global search
├── stats/route.ts          # GET - Dashboard statistics
└── activities/route.ts     # GET - Activity log
```

### API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Error Handling

- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Validation errors are returned with detailed messages
- Database errors are caught and returned as user-friendly messages

## Authentication & Authorization

### Authentication Flow

1. **Login**: User submits credentials to `/api/auth/login`
2. **Validation**: Server validates credentials against database
3. **Token Generation**: JWT token is generated with user info
4. **Cookie Setting**: Token is stored in HTTP-only cookie
5. **Response**: User data is returned to client

### Authorization Levels

#### Route Protection
- Middleware (`middleware.ts`) checks authentication for protected routes
- Public routes: `/login`, `/api/auth/login`
- Protected routes: All other routes require authentication

#### Role-Based Access Control (RBAC)

**Admin:**
- Full access to all features
- User management (CRUD)
- View all entities regardless of assignment

**Manager:**
- View all entities
- Limited user management (view only)
- Cannot delete users or change roles

**Sales Rep:**
- View only assigned entities
- Cannot access user management
- Limited document access

### Permission Checks

Permissions are checked at multiple levels:
1. **Middleware**: Route-level protection
2. **API Routes**: Operation-level permission checks
3. **UI Components**: Conditional rendering based on permissions

## Frontend Architecture

### Component Structure

```
components/
├── Navigation.tsx          # Main navigation bar
├── FileUpload.tsx         # File upload component with drag-and-drop
├── DocumentList.tsx       # Document list display
└── DocumentPreview.tsx    # Document preview popover
```

### Page Structure

Pages are organized by feature:
- `/` - Dashboard
- `/contacts` - Contact list
- `/contacts/new` - Create contact
- `/contacts/[id]` - Contact detail/edit
- `/companies` - Company list
- `/companies/new` - Create company
- `/companies/[id]` - Company detail/edit
- `/cases` - Case list
- `/cases/new` - Create case
- `/cases/[id]` - Case detail/edit
- `/tasks` - Task list
- `/tasks/new` - Create task
- `/tasks/[id]` - Task detail/edit
- `/meetings` - Meeting list (via calendar)
- `/meetings/new` - Schedule meeting
- `/meetings/[id]` - Meeting detail
- `/meetings/[id]/edit` - Edit meeting
- `/calendar` - Calendar view
- `/documents` - Document library
- `/search` - Search results
- `/users` - User list (admin/manager only)
- `/users/new` - Create user (admin only)
- `/users/[id]` - User detail/edit
- `/settings/availability` - Availability settings

### State Management

- **Local State**: React `useState` for component-level state
- **Server State**: Data fetched from API routes
- **URL State**: Search params and route params for navigation state
- **No Global State Library**: Uses Next.js built-in features

### Data Fetching

- **Client-Side**: `fetch` API in `useEffect` hooks
- **Server-Side**: Direct database queries in API routes
- **Real-time Updates**: Manual refresh or navigation-based updates

## File Structure

### Complete Directory Structure

```
crm-nextjs/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── activities/
│   │   ├── auth/
│   │   ├── availability/
│   │   ├── calendar/
│   │   ├── cases/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── documents/
│   │   ├── meetings/
│   │   ├── search/
│   │   ├── stats/
│   │   ├── tasks/
│   │   └── users/
│   ├── calendar/
│   ├── cases/
│   ├── companies/
│   ├── contacts/
│   ├── documents/
│   ├── login/
│   ├── meetings/
│   ├── search/
│   ├── settings/
│   ├── tasks/
│   ├── users/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── DocumentList.tsx
│   ├── DocumentPreview.tsx
│   ├── FileUpload.tsx
│   └── Navigation.tsx
├── lib/                          # Utility libraries
│   ├── activity.ts               # Activity logging
│   ├── auth.ts                   # Authentication utilities
│   └── mongodb.ts                 # Database connection
├── models/                       # Mongoose models
│   ├── Activity.ts
│   ├── Case.ts
│   ├── Company.ts
│   ├── Contact.ts
│   ├── Document.ts
│   ├── Meeting.ts
│   ├── Task.ts
│   ├── User.ts
│   └── UserAvailability.ts
├── public/                       # Static files
│   └── uploads/                  # Uploaded documents
├── scripts/                      # Utility scripts
│   └── create-admin.js           # Admin user creation
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Project documentation
└── ARCHITECTURE.md               # This file
```

## Key Design Decisions

### 1. Next.js App Router
- **Decision**: Use Next.js 14 App Router instead of Pages Router
- **Rationale**: Modern routing, better TypeScript support, improved performance
- **Impact**: All routes are in `app/` directory with `route.ts` for API and `page.tsx` for pages

### 2. MongoDB with Mongoose
- **Decision**: Use MongoDB as the database with Mongoose ODM
- **Rationale**: Flexible schema, easy to scale, good TypeScript support
- **Impact**: All models defined in `models/` directory with Mongoose schemas

### 3. JWT Authentication with HTTP-only Cookies
- **Decision**: Store JWT tokens in HTTP-only cookies
- **Rationale**: More secure than localStorage, prevents XSS attacks
- **Impact**: Tokens are automatically sent with requests, no manual token management

### 4. Role-Based Access Control
- **Decision**: Three-tier role system (Admin, Manager, Sales Rep)
- **Rationale**: Flexible permission system, easy to extend
- **Impact**: Permission checks at API and UI levels

### 5. File Storage
- **Decision**: Store files locally in `public/uploads/`
- **Rationale**: Simple for development, easy to migrate to cloud storage later
- **Impact**: File paths stored in database, files served as static assets

### 6. Activity Logging
- **Decision**: Comprehensive activity tracking for all entities
- **Rationale**: Audit trail, user accountability, debugging
- **Impact**: Activity records created for all create/update/delete operations

### 7. Responsive Design
- **Decision**: Mobile-first responsive design with Tailwind CSS
- **Rationale**: Support for all device types, modern UX
- **Impact**: Conditional rendering and mobile-optimized layouts

### 8. TypeScript
- **Decision**: Full TypeScript implementation
- **Rationale**: Type safety, better IDE support, fewer runtime errors
- **Impact**: All files use TypeScript with strict type checking

## Data Flow

### Creating a Contact

```
1. User fills form in /contacts/new
2. Form submission triggers handleSubmit
3. POST request to /api/contacts
4. Middleware checks authentication
5. API route validates data
6. Mongoose model creates document
7. Activity log entry created
8. Response sent to client
9. Client redirects to /contacts/[id]
10. Contact detail page fetches data
11. UI updates with new contact
```

### Searching

```
1. User enters search query
2. Debounced search triggers API call
3. GET /api/search?q=query
4. API queries multiple collections
5. Results aggregated and returned
6. Search results page displays matches
7. User clicks result
8. Navigation to entity detail page
```

### File Upload

```
1. User selects file in FileUpload component
2. File stored in component state
3. User adds metadata (description, category)
4. User clicks "Save"
5. FormData created with file and metadata
6. POST /api/documents/upload
7. File saved to public/uploads/
8. Document record created in database
9. Activity log entry created
10. DocumentList component refreshes
11. New document appears in list
```

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens in HTTP-only cookies
- Token expiration handled by middleware
- Secure password requirements

### Authorization Security
- Role-based access control at API level
- Permission checks before data access
- User assignment validation
- Entity ownership verification

### Data Security
- Input validation and sanitization
- SQL injection prevention (NoSQL, but still validated)
- XSS prevention (React auto-escaping)
- File upload validation (type, size)
- Secure file storage paths

### API Security
- Authentication required for all protected routes
- Role-based permission checks
- Rate limiting (to be implemented)
- CORS configuration (if needed)

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Efficient queries with proper filtering
- Population of references only when needed
- Pagination for large datasets (to be implemented)

### Frontend Optimization
- React component memoization where beneficial
- Lazy loading for heavy components
- Image optimization (Next.js Image component)
- Code splitting via Next.js automatic splitting

### Caching Strategy
- Static page generation where possible
- API response caching (to be implemented)
- Browser caching for static assets

## Future Enhancements

### Planned Features
- Email notifications
- Real-time updates (WebSockets)
- Advanced reporting
- Google Calendar/Outlook sync
- Email integration
- Custom fields
- Workflow automation
- Mobile app
- API rate limiting
- Advanced search filters
- Bulk operations
- Export functionality

### Technical Improvements
- Database connection pooling
- Redis caching
- CDN for static assets
- Cloud file storage (S3, etc.)
- Background job processing
- CI/CD pipeline
- Docker containerization
- Kubernetes deployment

### Testing (Implemented)
- **Unit Tests**: Comprehensive unit tests using Jest and React Testing Library
  - API route tests with mocked dependencies
  - Component tests with user interaction simulation
  - Model tests for data validation
  - Coverage target: 80% for statements, branches, and functions
- **E2E Tests**: End-to-end tests using Playwright
  - Page component tests
  - User flow tests
  - Authentication and authorization tests
  - Responsive design tests
  - See `TESTING.md` and `e2e/README.md` for details

## Conclusion

This architecture provides a solid foundation for a modern CRM application. The use of Next.js, TypeScript, and MongoDB creates a scalable, maintainable, and secure system. The modular structure allows for easy extension and modification as requirements evolve.

