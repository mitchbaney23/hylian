# Hylian - Digital Document Signing Platform

A modern, full-stack digital signature and contract management platform built with React, Node.js, and PostgreSQL. Hylian provides a complete solution for uploading documents, creating contracts, and collecting digital signatures - similar to DocuSign.

## Features

- **Document Management**: Upload PDF documents securely
- **Contract Creation**: Create signing workflows with multiple signers
- **Digital Signatures**: Canvas-based signature pad for electronic signatures
- **Email Notifications**: Automated signing invitations and reminders
- **Real-time Tracking**: Monitor signing progress and document status
- **User Authentication**: Secure JWT-based authentication system
- **Audit Trail**: Complete history of document and signature activities

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **PDF-lib** for PDF processing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React PDF** for document viewing
- **Signature Pad** for digital signatures
- **React Hook Form** for form handling

## Project Structure

```
hylian/
├── server/                 # Backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── prisma/            # Database schema and migrations
│   └── uploads/           # File storage directory
│
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
│
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hylian
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   ```bash
   # Create a PostgreSQL database named 'hylian'
   createdb hylian
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your database and email configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/hylian"
   JWT_SECRET="your-super-secret-jwt-key"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-email-password"
   ```

5. **Run database migrations**
   ```bash
   cd server
   npm run migrate
   npm run generate
   ```

6. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the backend (port 3001) and frontend (port 5173) servers.

### Usage

1. **Register an Account**
   - Go to `http://localhost:5173/register`
   - Create a new user account

2. **Upload a Document**
   - Navigate to "Upload Document"
   - Select a PDF file to upload

3. **Create a Contract**
   - From your dashboard, click "Create Contract" on an uploaded document
   - Add signers with their names and email addresses
   - Click "Create Contract & Send Invitations"

4. **Sign Documents**
   - Signers will receive email invitations with signing links
   - Click the link to access the signing interface
   - Create a digital signature and place it on the document
   - Submit the signature to complete signing

5. **Track Progress**
   - Monitor signing progress from the contract view
   - See real-time updates as signers complete their signatures

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Documents
- `POST /api/documents/upload` - Upload a PDF document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/file` - Download document file

### Contracts
- `POST /api/contracts` - Create a new contract
- `GET /api/contracts` - Get user's contracts
- `GET /api/contracts/:id` - Get contract details
- `PATCH /api/contracts/:id/status` - Update contract status

### Signatures
- `POST /api/signatures` - Submit a signature
- `GET /api/signatures/contract/:contractId` - Get contract signatures

## Development

### Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm start` - Start the production server
- `npm run server:dev` - Start only the backend server
- `npm run client:dev` - Start only the frontend server

### Database Management
- `npm run migrate` - Run Prisma migrations
- `npm run generate` - Generate Prisma client

## Deployment

### Production Setup
1. Build the applications:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run database migrations in production:
   ```bash
   cd server && npm run migrate
   ```

4. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.