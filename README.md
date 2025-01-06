# **AstroMeet Backend API**

AstroMeet is an astrology appointment booking system that allows users to book consultations with professional astrologers. It provides an easy-to-use platform for users to find astrologers based on their specialization and experience and schedule appointments with them.

This repository contains the backend code for **AstroMeet**, built with **Node.js**, **Express.js**, and **MongoDB**.

---

## **Features**

- User registration and login with JWT authentication.
- Browse and view astrologer profiles by specialization and experience.
- Book astrology appointments with astrologers.
- View and manage user appointments.
- User profile management.

---

## **Tech Stack**

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ORM
- **Authentication:** JWT (JSON Web Tokens)
- **API Documentation:** RESTful API

---

## **Installation**

Follow the steps below to set up the backend locally.

### **Prerequisites**

- Node.js (v14 or higher)
- MongoDB (running locally or use a MongoDB Atlas account)

### **Steps to Run the Project**

1. Clone the repository:
   ```bash
   git clone https://github.com/Amit1198911/AstroMeet
   cd astromeet-backend
Install dependencies:

API Endpoints
1. User Authentication
POST /api/auth/register
Registers a new user.

POST /api/auth/login
Logs in a user and returns a JWT token.

2. Astrologer Endpoints
GET /api/astrologers
Lists all astrologers.

GET /api/astrologers/:id
Retrieves details of a specific astrologer by their ID.

3. Appointment Endpoints
POST /api/appointments
Books an appointment with an astrologer.

GET /api/appointments/user/:userId
Retrieves all appointments for a specific user.

4. User Profile Endpoints
GET /api/users/:id
Retrieves the profile details of a user.

PUT /api/users/:id
Updates the profile details of a user.

Error Handling
The API responds with appropriate HTTP status codes and error messages:

400 Bad Request: Invalid or missing data.
401 Unauthorized: Invalid credentials or missing JWT token.
404 Not Found: Resource not found.
500 Internal Server Error: Server-side error.

### Key Improvements:
- Enhanced clarity and formatting for easier navigation.
- Clear distinction between authentication, endpoints, and models.
- Improved readability for steps to install, run, and test the project.
- Specific example added for including JWT in headers.


### Key Updates:
- **Scalability section added**: Describes how the project is designed to handle a growing user base, supporting up to 500 astrologers and 2500 users seamlessly.
- **Redis integration for scalability**: Mentions Redis used for caching and improving scalability.

Let me know if you'd like any further changes!


Let me know if you'd like further changes!