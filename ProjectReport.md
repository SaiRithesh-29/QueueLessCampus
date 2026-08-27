# QueueLess Campus

## Digital Queue/Token Management System for College Campuses

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Proposed Solution](#2-proposed-solution)
3. [Key Features](#3-key-features)
4. [Technologies Used](#4-technologies-used)
5. [Implementation Details](#5-implementation-details)
6. [Future Scope](#6-future-scope)
7. [References / Bibliography](#7-references--bibliography)

---

## 1. Problem Statement

In most college campuses, students are required to physically stand in queues for basic services such as canteen orders, library counter operations, and administrative office work. This traditional approach leads to several persistent problems:

- **Long and unpredictable waiting times:** Students have no way of knowing how long they will have to wait, often spending 20–40 minutes standing in line for a task that takes only a few minutes to complete.
- **Wasted productive time:** Time spent standing in queues is time taken away from attending lectures, studying, completing assignments, or participating in campus activities.
- **Crowded spaces and discomfort:** Physical queues lead to overcrowding in hallways and common areas, creating an uncomfortable and sometimes chaotic environment, especially during peak hours.
- **No visibility into queue status:** Students cannot determine their position in the queue, how many people are ahead of them, or when their turn will arrive. This uncertainty adds to frustration.
- **Difficulty in queue management for staff:** Staff members at service counters lack tools to efficiently manage and track the queue. They rely on manual token systems or first-come-first-served verbal coordination, which is error-prone and difficult to scale.
- **No historical data:** There is no way to track how many students use a service on a given day, average wait times, or peak hours — data that could be used to optimize campus operations.

These issues collectively result in a poor campus experience for students and an inefficient workflow for staff.

---

## 2. Proposed Solution

**QueueLess Campus** is a web-based digital queue and token management system designed to eliminate the need for physical queues in a college campus environment.

The system allows students to generate a digital token from their phone or laptop, view their position in the queue in real time, receive an estimated wait time, and get notified when their turn arrives — all without physically standing in line.

On the other side, staff members at each service counter get a dedicated dashboard where they can view the current queue, see all waiting tokens, and mark tokens as completed with a single click. When a token is completed, the next student in line is automatically moved to the "serving" state, and all connected student screens update in real time.

The system is built as a full-stack MERN (MongoDB, Express.js, React.js, Node.js) application with real-time communication powered by Socket.IO. It is designed to be simple, fast, and reliable — making it ideal for a hackathon project and easily extendable for real campus deployment.

**Core idea:** Replace the physical queue with a digital one. Students wait virtually. Staff manage digitally. Everyone saves time.

---

## 3. Key Features

### For Students
- **Remote Virtual Queue Joining:** Students can join a queue digitally without physically standing at the service counter. After generating a token, they can leave the area and monitor remotely.
- **Service Selection:** Students can choose from available campus services (Canteen, Library, Counter, Office) on a clean, card-based home screen with live status indicators.
- **Token Generation:** A single tap generates a unique token (e.g., `L-027`) and adds the student to the queue.
- **Real-Time Queue Position:** Students see their token, currently serving token, people ahead, people behind, estimated wait time, and queue status — all updating automatically.
- **Near-Turn Notifications:** When 2 or fewer people are ahead, students receive an in-app "Your turn is approaching!" notification. When their token becomes SERVING, they receive "It's your turn!" via browser Notification API or in-app banner.
- **Token Cancellation:** Students can cancel a waiting token if they no longer need the service.
- **Live Service Status:** The home page shows which services are open/closed with current serving token and waiting count.
- **Clear State Indicators:** Visual indicators and colored banners show when a token is WAITING, SERVING, COMPLETED, or CANCELLED.

### For Staff
- **Service-Specific Dashboard:** Staff can select and manage queues for their assigned service via a dropdown selector.
- **Current Token Display:** The currently serving token is prominently displayed in a hero card.
- **Waiting Queue View:** All waiting tokens are listed in order with position numbers.
- **One-Click Token Completion:** Clicking "Complete Current Token" marks the current token as done and auto-advances the next token.
- **Staff Analytics Dashboard:** Tokens served today, currently waiting, currently serving, average wait time, and average service time — calculated from real database data.
- **Service Status Control:** Staff can open/close each service. When closed, students cannot generate new tokens.
- **Service Overview Panel:** All services with their open/closed status, current serving token, and waiting count visible at a glance.

### System Features
- **Independent Queues per Service:** Each service maintains its own separate queue with independent token numbering (C-001, L-001, O-001, etc.).
- **Configurable Average Service Time:** Wait time calculations use a per-service configurable average (e.g., 3 min for Library, 5 min for Canteen, 7 min for Office).
- **Auto-Seeding:** Services are automatically created on first server start — no manual database setup required.
- **Real-Time Synchronization:** Socket.IO powers instant updates across all connected student and staff interfaces. No manual refresh needed.
- **Responsive Design:** The UI works on mobile phones, tablets, and desktops.
- **Error Handling:** User-friendly error messages for network failures, invalid operations, and empty queues.
- **Security:** Backend validates all inputs, controls queue state server-side, and prevents invalid operations (double-serving, completing completed tokens, creating tokens for closed services).

---

## 4. Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **React.js (v19)** | Component-based UI library for building the student and staff interfaces |
| **React Router (v7)** | Client-side routing between Home, Student, and Staff pages |
| **Axios** | HTTP client for making REST API calls to the backend |
| **Socket.IO Client** | WebSocket client for receiving real-time queue updates |
| **Vite (v8)** | Modern build tool and development server for fast HMR and production builds |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for the server |
| **Express.js (v4)** | Web framework for building REST API endpoints |
| **Socket.IO (v4)** | WebSocket library for real-time bidirectional communication |
| **Mongoose (v8)** | MongoDB ODM for schema definition and database operations |
| **dotenv** | Environment variable management from `.env` files |
| **cors** | Cross-Origin Resource Sharing middleware for API security |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB (v8)** | NoSQL document database for storing services and tokens |
| **MongoDB Atlas** | Cloud-hosted MongoDB for production deployment |

### Deployment
| Platform | Purpose |
|---|---|
| **Netlify** | Frontend static site hosting with SPA routing support |
| **Render** | Backend API hosting with automatic environment variable management |
| **MongoDB Atlas** | Managed cloud database |

---

## 5. Implementation Details

### 5.1 Project Structure

```
QueueLessCampus/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection setup
│   ├── controllers/
│   │   ├── serviceController.js  # Service CRUD + toggle status + live queue enrichment
│   │   └── tokenController.js    # Token CRUD + queue logic + analytics + cancel
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handling middleware
│   ├── models/
│   │   ├── Service.js            # Service schema (name, code, avgTime, isOpen)
│   │   └── Token.js              # Token schema (number, status, timestamps)
│   ├── routes/
│   │   ├── serviceRoutes.js      # /api/services routes (incl. toggle)
│   │   └── tokenRoutes.js        # /api/tokens routes (incl. cancel, analytics)
│   ├── seed.js                   # Auto-seeds Canteen, Library, Counter, Office
│   ├── server.js                 # Express + Socket.IO entry point
│   ├── .env.example              # Environment variable template
│   ├── render.yaml               # Render deployment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useQueue.js       # Custom hooks: useTokenStatus, useQueueStatus, useAnalytics, useServices
│   │   ├── pages/
│   │   │   ├── HomePage.jsx/css  # Landing page with live services dashboard
│   │   │   ├── StudentPage.jsx/css   # Token generation, real-time status, notifications
│   │   │   └── StaffDashboard.jsx/css # Staff control + analytics + service status
│   │   ├── services/
│   │   │   ├── api.js            # Axios API client (all endpoints)
│   │   │   ├── socket.js         # Socket.IO connection manager
│   │   │   └── notifications.js  # Browser + in-app notification utility
│   │   ├── App.jsx               # Router setup
│   │   └── main.jsx              # React entry point
│   ├── netlify.toml              # Netlify SPA routing config
│   ├── .env.example              # Frontend env template
│   └── package.json
│
├── .gitignore
├── package.json                  # Root scripts (dev, build, start)
└── ProjectReport.md
```

### 5.2 Database Design

**Service Schema:**
```json
{
  "name": "Library",
  "code": "L",
  "description": "College Library Counter",
  "averageServiceTime": 3,
  "isOpen": true
}
```

**Token Schema:**
```json
{
  "tokenNumber": "L-027",
  "service": "ObjectId (ref: Service)",
  "status": "WAITING | SERVING | COMPLETED | CANCELLED",
  "position": 5,
  "createdAt": "2026-08-27T...",
  "servingAt": null,
  "completedAt": null
}
```

### 5.3 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | Fetch all services with live queue info (serving token, waiting count) |
| `GET` | `/api/services/:id` | Fetch a single service by ID |
| `POST` | `/api/services/:id/toggle` | Toggle service open/close status |
| `POST` | `/api/tokens` | Generate a new queue token (rejects if service is closed) |
| `GET` | `/api/tokens/:id` | Fetch token details by ID |
| `GET` | `/api/tokens/:id/status` | Get token status with people ahead, behind, estimated wait |
| `POST` | `/api/tokens/:id/cancel` | Cancel a waiting token |
| `GET` | `/api/tokens/queue/:serviceId` | Get full queue status for a service |
| `POST` | `/api/tokens/queue/:serviceId/complete` | Complete current token, auto-advance queue |
| `GET` | `/api/tokens/analytics/:serviceId` | Get today's analytics (served, waiting, avg wait, avg service) |
| `GET` | `/api/health` | Health check endpoint |

### 5.4 Queue Logic

1. When a student requests a token, the backend first checks if the service is open (`isOpen`). If closed, the request is rejected.
2. The backend checks if any token is currently in `SERVING` state for that service.
3. If no token is being served, the new token immediately becomes `SERVING`.
4. If a token is already being served, the new token is placed in `WAITING` state at the end of the queue.
5. When staff clicks "Complete Token", the current `SERVING` token is marked `COMPLETED`, and the oldest `WAITING` token is promoted to `SERVING`.
6. A Socket.IO `queue:update` event is emitted after every state change, pushing updates to all connected clients in real time.
7. If a student cancels their token, it is marked `CANCELLED` and removed from the active queue.
8. The backend prevents invalid operations: completing already-completed tokens, having two SERVING tokens, creating tokens for closed services.

### 5.5 Estimated Wait Time Calculation

```
Estimated Wait = Number of People Ahead × Average Service Time (per service)
```

Example:
- Library average time = 3 minutes
- 5 people ahead → Estimated wait = 15 minutes
- If student is currently being served → Display: "Now Serving"

### 5.6 Real-Time Updates & Notifications

Socket.IO is used for real-time communication:
- **Backend** emits `queue:update`, `token:serving`, `token:completed`, and `service:update` events.
- **Frontend** hooks (`useTokenStatus`, `useQueueStatus`, `useAnalytics`) subscribe to these events and automatically refetch data.
- Students see their queue position update without refreshing. Staff sees the queue advance immediately after completing a token.
- **Near-Turn Notifications:** When a student has 2 or fewer people ahead, they receive an in-app "Your turn is approaching!" banner. When their token becomes SERVING, they receive "It's your turn! Please proceed to the counter." Browser Notification API is used when permission is granted; otherwise an in-app banner is displayed.

### 5.7 Deployment Architecture

```
[Student/Staff Browser]
        │
        ▼
  [Netlify - Frontend]
  React SPA (static files)
        │
        │ REST API + WebSocket
        ▼
  [Render - Backend]
  Express + Socket.IO
        │
        │ Mongoose
        ▼
  [MongoDB Atlas]
  Cloud Database
```

---

## 6. Future Scope

The current implementation covers the core queue management flow with remote joining, real-time updates, notifications, analytics, and service status. The following enhancements can be considered for future development:

1. **QR Code Tokens:** Generate a scannable QR code for each token that students can show at the counter for quick verification.

2. **Multi-Campus Support:** Extend the system to support multiple campus locations with separate admin panels and analytics.

3. **Admin Dashboard:** Build an administrative panel for campus authorities to view analytics (peak hours, average wait times, service usage), manage services, and configure system settings.

4. **Authentication & Role Management:** Add user login with role-based access (student, staff, admin) so that tokens are tied to specific students and staff can only manage their assigned service.

5. **Booking/Scheduling:** Allow students to pre-book a time slot for services like the office, reducing queue congestion during peak hours.

6. **Rating & Feedback:** After a token is served, prompt the student to rate the service experience, providing data for continuous improvement.

7. **Mobile App:** Wrap the web application in a React Native or Flutter shell to create a native mobile experience with background notifications.

8. **AI-Based Wait Time Prediction:** Use historical data to predict wait times more accurately based on time of day, day of week, and seasonal patterns.

9. **Offline Support:** Implement service workers and PWA capabilities so the app works in low-connectivity campus environments.

---

## 7. References / Bibliography

1. **MongoDB Documentation** — https://docs.mongodb.com/
   MongoDB manual covering schemas, queries, aggregation, and Mongoose ODM usage.

2. **Express.js Documentation** — https://expressjs.com/
   Official Express.js guide for routing, middleware, and API design.

3. **React.js Documentation** — https://react.dev/
   Official React documentation covering hooks, components, and routing.

4. **Socket.IO Documentation** — https://socket.io/docs/v4/
   Socket.IO v4 guide for real-time WebSocket communication setup.

5. **Node.js Documentation** — https://nodejs.org/en/docs/
   Official Node.js documentation for runtime and module system.

6. **Vite Documentation** — https://vite.dev/
   Vite build tool documentation for frontend bundling and development server.

7. **MongoDB Atlas** — https://www.mongodb.com/atlas
   Cloud database service documentation for production deployment.

8. **Render Documentation** — https://render.com/docs
   Deployment platform documentation for hosting Node.js backends.

9. **Netlify Documentation** — https://docs.netlify.com/
   Static site hosting and SPA routing configuration.

10. **MDN Web Docs** — https://developer.mozilla.org/
    Web technology references for HTTP, REST APIs, and CORS configuration.

---

*QueueLess Campus — Eliminating physical queues, one token at a time.*
