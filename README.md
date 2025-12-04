# CRM Next.js Application

A modern, full-featured Customer Relationship Management (CRM) system built with Next.js 14, TypeScript, and MongoDB. This application provides comprehensive tools for managing contacts, companies, cases, tasks, meetings, documents, and more.

## Features

### Core CRM Features
- **Contacts Management**: Create, view, update, and delete contacts with detailed information
- **Companies Management**: Manage company information and relationships
- **Cases Pipeline**: Track cases through different stages (lead, qualified, proposal, negotiation, closed-won, closed-lost)
- **Dashboard**: Overview of key metrics, pipeline value, and recent activity
- **Global Search**: Search across contacts, companies, and cases with real-time results

### User Management & Security
- **Multi-User Support**: Multiple users can work simultaneously
- **Role-Based Access Control (RBAC)**: Three roles - Admin, Manager, and Sales Rep
- **User Assignment**: Assign contacts, companies, and cases to specific users
- **Activity Tracking**: Comprehensive audit trail of all user activities and changes
- **Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Password Management**: Secure password hashing with bcrypt

### Task Management
- **Task Creation**: Create tasks with priorities, due dates, and reminders
- **Task Assignment**: Assign tasks to users
- **Task Status Tracking**: Track task status (pending, in-progress, completed, cancelled)
- **Overdue Detection**: Automatic flagging of overdue tasks
- **Task Linking**: Link tasks to contacts, companies, or cases
- **My Tasks Widget**: Dashboard widget showing overdue, due today, and upcoming tasks

### Calendar & Meetings
- **Calendar View**: Full calendar integration with FullCalendar (month, week, day views)
- **Meeting Scheduling**: Schedule meetings with attendees, location, and video links
- **Meeting Types**: Support for in-person, video, phone, and hybrid meetings
- **Meeting Management**: Edit, cancel, and reschedule meetings
- **Meeting Linking**: Link meetings to contacts, companies, or cases
- **Reminders**: Configurable meeting reminders (5min, 15min, 30min, 1hr, 1day)
- **Availability Management**: Users can set their weekly availability preferences
- **Calendar Sync**: Infrastructure for Google Calendar/Outlook integration (placeholder)

### Documents & Attachments
- **File Uploads**: Upload contracts, proposals, and documents
- **Document Library**: Central document library with filtering and search
- **Document Linking**: Attach files to contacts, companies, and cases
- **Document Categories**: Organize documents by category
- **Document Preview**: Hover preview for documents (images and PDFs)
- **Document Metadata**: Store descriptions and categories with documents

### User Interface
- **Responsive Design**: Fully responsive for mobile, tablet, and desktop
- **Modern UI**: Beautiful, modern interface with Tailwind CSS
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Card Views**: Mobile-friendly card layouts for lists
- **Real-time Updates**: Dynamic updates without page refreshes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud like MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
```bash
npm install
```

3. **Set up MongoDB**:

   **Option A: MongoDB Atlas (Recommended - Free Cloud Database)**
   
   1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   2. Sign up for a free account (or log in if you have one)
   3. Create a new cluster (choose the FREE tier)
   4. Wait for the cluster to be created (takes a few minutes)
   5. Click "Connect" on your cluster
   6. Choose "Connect your application"
   7. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   8. Replace `<password>` with your database user password
   9. Add a database name at the end (e.g., `crm-nextjs`): 
      ```
      mongodb+srv://username:yourpassword@cluster.mongodb.net/crm-nextjs?retryWrites=true&w=majority
      ```
   10. Before connecting, you need to:
       - Go to "Network Access" in the left sidebar
       - Click "Add IP Address"
       - Click "Allow Access from Anywhere" (for development) or add your specific IP
       - Go to "Database Access" and create a database user if you haven't already

   **Option B: Local MongoDB**
   
   1. Download MongoDB Community Server from [mongodb.com/download](https://www.mongodb.com/try/download/community)
   2. Install MongoDB on your machine
   3. Start MongoDB service (usually runs automatically after installation)
   4. Use connection string: `mongodb://localhost:27017/crm-nextjs`

4. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your-secret-key-change-in-production
   ```
   
   Replace `your_mongodb_connection_string` with the connection string from step 3.
   Replace `your-secret-key-change-in-production` with a secure random string (for JWT token signing).
   
   You can generate a secure JWT secret using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Create the first admin user**:
   
   Use the provided script:
   ```bash
   node scripts/create-admin.js
   ```
   
   Or manually create via API (after starting the server):
   ```bash
   # Start the server first, then:
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Admin","lastName":"User","email":"admin@crm.com","password":"admin123","role":"admin"}'
   ```

6. **Run the development server**:
```bash
npm run dev
```

7. **Open [http://localhost:3000](http://localhost:3000)** in your browser and log in with your admin credentials.

## Tech Stack

- **Next.js 14**: React framework with App Router for server-side rendering and API routes
- **TypeScript**: Type-safe development with full type checking
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: MongoDB object modeling and validation
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **FullCalendar**: Calendar component for meeting and task visualization
- **bcrypt**: Password hashing for secure authentication
- **JWT**: JSON Web Tokens for authentication

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── cases/         # Case management endpoints
│   │   ├── companies/     # Company management endpoints
│   │   ├── contacts/      # Contact management endpoints
│   │   ├── documents/     # Document management endpoints
│   │   ├── meetings/      # Meeting management endpoints
│   │   ├── search/        # Global search endpoint
│   │   ├── stats/         # Dashboard statistics endpoint
│   │   ├── tasks/         # Task management endpoints
│   │   └── users/         # User management endpoints
│   ├── calendar/          # Calendar view page
│   ├── cases/             # Case pages
│   ├── companies/         # Company pages
│   ├── contacts/          # Contact pages
│   ├── documents/         # Document library page
│   ├── login/             # Login page
│   ├── meetings/          # Meeting pages
│   ├── search/            # Search results page
│   ├── settings/          # Settings pages
│   ├── tasks/             # Task pages
│   └── users/             # User management pages
├── components/            # Reusable React components
│   ├── DocumentList.tsx   # Document list component
│   ├── DocumentPreview.tsx # Document preview popover
│   ├── FileUpload.tsx     # File upload component
│   └── Navigation.tsx     # Main navigation component
├── lib/                   # Utility functions
│   ├── activity.ts        # Activity logging utilities
│   ├── auth.ts            # Authentication utilities
│   └── mongodb.ts         # MongoDB connection
├── models/                # Mongoose models
│   ├── Activity.ts        # Activity log model
│   ├── Case.ts            # Case model
│   ├── Company.ts         # Company model
│   ├── Contact.ts         # Contact model
│   ├── Document.ts        # Document model
│   ├── Meeting.ts         # Meeting model
│   ├── Task.ts            # Task model
│   ├── User.ts            # User model
│   └── UserAvailability.ts # User availability model
├── public/                # Static assets
│   └── uploads/           # Uploaded documents
├── scripts/               # Utility scripts
│   └── create-admin.js    # Admin user creation script
├── middleware.ts          # Next.js middleware for route protection
└── package.json           # Dependencies and scripts
```

## User Roles & Permissions

### Admin
- Full access to all features
- User management (create, edit, delete users)
- View all contacts, companies, cases, tasks, and meetings
- Manage all documents

### Manager
- View and manage all contacts, companies, cases, tasks, and meetings
- View all documents
- Limited user management (view users)
- Cannot delete users or change user roles

### Sales Rep
- View and manage only assigned contacts, companies, and cases
- View and manage only assigned tasks
- View and manage only meetings they organize or attend
- Cannot access user management
- Cannot view all documents (only documents they uploaded or are related to their entities)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get company
- `PUT /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/[id]` - Get case
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `GET /api/tasks/my` - Get current user's tasks

### Meetings
- `GET /api/meetings` - List meetings (with date range filtering)
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/[id]` - Get meeting
- `PUT /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Cancel meeting

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/[id]` - Get/download document
- `DELETE /api/documents/[id]` - Delete document

### Users
- `GET /api/users` - List users (admin/manager only)
- `POST /api/users` - Create user (admin only)
- `GET /api/users/[id]` - Get user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)
- `PUT /api/users/[id]/password` - Change password

### Other
- `GET /api/search?q=query` - Global search
- `GET /api/stats` - Dashboard statistics
- `GET /api/activities` - Activity log
- `GET /api/availability` - Get user availability
- `PUT /api/availability` - Update user availability

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing

## Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens are stored in HTTP-only cookies
- API routes are protected by middleware authentication checks
- Role-based access control enforced at API and UI levels
- File uploads are validated and stored securely
- User input is sanitized and validated

## Future Enhancements

- Email notifications for tasks and meetings
- Advanced reporting and analytics
- Google Calendar/Outlook integration
- Email integration
- Custom fields and workflows
- Mobile app
- API rate limiting
- Advanced search filters
- Bulk operations
- Export functionality (CSV, PDF)

## License

This project is open source and available for use and modification.

## Support

For issues, questions, or contributions, please refer to the project repository or contact the development team.
