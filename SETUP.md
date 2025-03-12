# Setting Up the Referral Platform

This document provides detailed instructions on how to set up and run the Referral Platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **npm** (usually comes with Node.js)
3. **MongoDB** (local installation or MongoDB Atlas account)
4. **OpenAI API Key** (for AI features)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/referral-platform.git
cd referral-platform
```

### 2. Install Dependencies

You can install all dependencies (root, server, and client) with a single command:

```bash
npm run install-all
```

Alternatively, you can install them separately:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

#### Server Configuration

Create or modify the `.env` file in the `server` directory:

```
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/referral-platform
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/referral-platform

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Client URL
CLIENT_URL=http://localhost:3000

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@referralplatform.com

# File Upload Limits
MAX_FILE_SIZE=5242880

# AI Settings
AI_MODEL=gpt-4
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

#### Client Configuration

The client `.env` file should already be set up, but you can modify it if needed:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=Referral Platform
```

### 4. Set Up MongoDB

If you're using a local MongoDB installation, make sure it's running:

```bash
# On most systems
sudo service mongod start

# On macOS with Homebrew
brew services start mongodb-community
```

If you're using MongoDB Atlas, ensure your connection string is correctly set in the `.env` file and that your IP address is whitelisted in the Atlas dashboard.

### 5. Running the Application

You can start both the server and client concurrently with:

```bash
npm start
```

Or run them separately:

```bash
# Start the server
npm run server

# In a separate terminal, start the client
npm run client
```

### 6. Accessing the Application

- The client will be available at: http://localhost:3000
- The server API will be available at: http://localhost:5000

## Initial Setup

When you first run the application, you'll need to:

1. Register a new user account
2. Set up your business profile
3. Create your first campaign

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check if MongoDB is running
   - Verify your connection string in the `.env` file
   - Ensure network connectivity to MongoDB Atlas (if using cloud)

2. **OpenAI API Issues**

   - Verify your API key is correct
   - Check if you have sufficient credits/quota
   - Ensure you have access to the specified model (e.g., GPT-4)

3. **Port Conflicts**

   - If port 3000 or 5000 is already in use, you can change them in the respective `.env` files

4. **Node.js Version Issues**
   - Ensure you're using Node.js v18 or higher
   - You can use nvm to manage multiple Node.js versions

### Getting Help

If you encounter any issues not covered here, please:

1. Check the project's GitHub issues
2. Consult the documentation
3. Reach out to the project maintainers

## Development Notes

- The server uses Nodemon for automatic restarts during development
- The client is built with Create React App and supports hot reloading
- Both server and client have separate test suites that can be run with `npm test`
