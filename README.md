# OnGrounds

A modern authentication system with email verification using OTP.

## Features

- User registration with email verification
- OTP-based email verification
- Secure login system
- Modern and responsive UI
- Session management
- MongoDB database integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on default port 27017)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd OnGrounds
```

2. Install dependencies:
```bash
npm install
```

3. Start MongoDB service (if not already running):
```bash
mongod
```

4. Start the application:
```bash
node server.js
```

The application will be available at `http://localhost:3000`

## Tech Stack

- Express.js - Web framework
- MongoDB - Database
- EJS - Templating engine
- Nodemailer - Email service
- Express-session - Session management
- SweetAlert2 - Beautiful alerts
- bcryptjs - Password hashing

## Color Theme

- Primary Color: `#331B3F`
- Accent Color: `#ACC7B4`

## Features

- Modern and responsive design
- Animated form inputs
- Error handling with visual feedback
- Secure password storage
- Session-based authentication
- Email verification with OTP
- 5-minute OTP expiry

## Security Features

- Password hashing using bcrypt
- Session-based authentication
- OTP expiration
- Protected routes
- Input validation

## License

MIT 