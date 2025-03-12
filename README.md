# AI-Powered Referral Marketing Platform

A comprehensive referral marketing platform built with the MERN stack (MongoDB, Express, React, Node.js) and enhanced with AI capabilities.

## Features

### For Businesses

- **User Authentication**: Secure login and registration system
- **Business Profile Management**: Manage business details and settings
- **Campaign Management**: Create, edit, and manage referral campaigns
- **Customer CRM**: Manage customer data and interactions
- **Referral Tracking**: Track referrals and their status
- **Reward Management**: Create and manage rewards for successful referrals
- **Analytics Dashboard**: Visualize referral program performance
- **AI-Powered Features**: Get intelligent insights and recommendations

### For Referrers

- **Referral Links**: Generate and share personalized referral links
- **Reward Tracking**: Track earned rewards and their status
- **Sharing Tools**: Easy sharing via email, SMS, and social media
- **AI-Powered Suggestions**: Get personalized sharing suggestions

## AI Features

- **Sharing Suggestions**: AI-generated personalized messages for different platforms
- **Follow-up Messages**: Smart follow-up messages for pending referrals
- **Performance Analysis**: In-depth analysis of referral program performance
- **Campaign Ideas**: AI-generated campaign ideas based on business data
- **Reward Optimization**: Intelligent recommendations for reward strategies
- **Chat Assistant**: AI-powered chat to help users with the referral process

## Tech Stack

### Backend

- **Node.js & Express**: Server framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **OpenAI API**: AI capabilities
- **Multer**: File uploads
- **Nodemailer**: Email functionality

### Frontend

- **React**: UI library
- **Material-UI**: Component library
- **React Router**: Navigation
- **Axios**: API requests
- **Recharts**: Data visualization
- **Formik & Yup**: Form handling and validation
- **Date-fns**: Date manipulation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- OpenAI API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/referral-platform.git
cd referral-platform
```

2. Install server dependencies

```bash
cd server
npm install
```

3. Install client dependencies

```bash
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourcompany.com
```

### Running the Application

1. Start the server (development mode)

```bash
cd server
npm run dev
```

2. Start the client (in a new terminal)

```bash
cd client
npm start
```

3. Access the application at `http://localhost:3000`

## Project Structure

```
referral-platform/
├── client/                 # React frontend
│   ├── public/             # Public assets
│   └── src/                # Source files
│       ├── components/     # React components
│       ├── utils/          # Utility functions
│       └── App.js          # Main App component
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── server.js           # Entry point
└── README.md               # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Business

- `GET /api/business` - Get business profile
- `PUT /api/business` - Update business profile
- `POST /api/business/logo` - Upload business logo

### Campaigns

- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create a campaign
- `GET /api/campaigns/:id` - Get a campaign
- `PUT /api/campaigns/:id` - Update a campaign
- `DELETE /api/campaigns/:id` - Delete a campaign

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a customer
- `GET /api/customers/:id` - Get a customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer
- `POST /api/customers/import` - Import customers

### Referrals

- `GET /api/referrals` - Get all referrals
- `POST /api/referrals` - Create a referral
- `GET /api/referrals/:id` - Get a referral
- `PUT /api/referrals/:id` - Update a referral
- `DELETE /api/referrals/:id` - Delete a referral
- `PUT /api/referrals/:id/approve` - Approve a referral
- `PUT /api/referrals/:id/reject` - Reject a referral

### Rewards

- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create a reward
- `GET /api/rewards/:id` - Get a reward
- `PUT /api/rewards/:id` - Update a reward
- `DELETE /api/rewards/:id` - Delete a reward
- `PUT /api/rewards/:id/approve` - Approve a reward
- `PUT /api/rewards/:id/reject` - Reject a reward

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/export` - Export analytics data

### AI

- `POST /api/ai/sharing-suggestions` - Generate sharing suggestions
- `POST /api/ai/follow-up` - Generate follow-up message
- `GET /api/ai/recommendations` - Get AI recommendations
- `POST /api/ai/chat` - Get chat response
- `POST /api/ai/email-content` - Generate email content
- `POST /api/ai/analyze-performance` - Analyze referral performance
- `POST /api/ai/campaign-ideas` - Generate campaign ideas
- `POST /api/ai/optimize-rewards` - Optimize reward strategy

## License

This project is licensed under the MIT License - see the LICENSE file for details.
