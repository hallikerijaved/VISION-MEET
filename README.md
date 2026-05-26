# VISION MEET - AI-Powered Group Discussion Platform

A complete web platform for conducting group discussions with video conferencing, real-time AI evaluation, NLP analysis, and moderator controls.

## Features

- **🔐 User Authentication** - Secure register/login system
- **📊 Enhanced Dashboard** - Statistics, quick actions, and trending discussions
- **🎥 Video Conferencing** - Browser-based video/audio with WebRTC
- **💬 Real-time Chat** - Text messaging during discussions
- **🤖 AI Evaluation** - Gemini-powered personalized feedback after each session
- **🧠 NLP Analysis** - Semantic similarity, keyword matching, grammar, confidence scoring
- **📝 GD Transcript** - Auto-generated transcript of the entire discussion
- **📈 Results Dashboard** - Detailed performance breakdown per participant
- **👨‍💼 Moderator Controls** - Session management and participant control
- **🔗 Shareable Links** - Easy sharing of GD sessions
- **⚡ Auto-close Sessions** - Automatic cleanup when no participants
- **🛡️ Admin Panel** - Monitor all sessions and users
- **📱 Responsive Design** - Works on desktop and mobile
- **🚀 Scalable** - Multiple concurrent GD sessions

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Video**: WebRTC (getUserMedia API)
- **AI**: Google Gemini API
- **NLP Microservice**: Python + FastAPI + sentence-transformers + KeyBERT + LanguageTool

## Project Structure

```
VISION-MEET/
├── backend/
│   ├── models/              # MongoDB schemas (User, GD, GDSession, Participant, Evaluation)
│   ├── routes/              # API endpoints (auth, gd, evaluation, realtimeInterview, admin)
│   ├── middleware/          # Authentication middleware
│   ├── services/
│   │   └── aiAnalysis.js    # Gemini AI + NLP microservice integration
│   └── server.js            # Main server with Socket.IO
├── frontend/
│   ├── src/
│   │   ├── components/      # Navigation, GDTranscript
│   │   ├── pages/           # Dashboard, GDRoom, Evaluations, ResultsDashboard, etc.
│   │   └── utils/           # API utilities
│   └── public/
├── nlp-service/
│   ├── app.py               # FastAPI app
│   ├── evaluator.py         # NLP scoring engine
│   └── requirements.txt
└── package.json
```

## Quick Start

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key

### Installation

1. **Install Node dependencies**:
   ```bash
   npm run install-all
   ```

2. **Install Python dependencies**:
   ```bash
   cd nlp-service
   pip install -r requirements.txt
   ```

3. **Configure environment** — create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/gd-platform
   JWT_SECRET=your_secret_key
   PORT=5001
   GEMINI_API_KEY=your_gemini_api_key
   NLP_SERVICE_URL=http://localhost:8000
   ```

4. **Start all services**:

   **MongoDB**:
   ```bash
   net start MongoDB
   ```

   **NLP Service**:
   ```bash
   cd nlp-service
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

   **Backend**:
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend**:
   ```bash
   cd frontend
   npm start
   ```

This will start:
- NLP Service on http://localhost:8000
- Backend on http://localhost:5001
- Frontend on http://localhost:3000

## Usage

### Regular Users
1. **Register/Login** - Create account or login
2. **Main Dashboard** - View statistics and trending discussions
3. **Create GD** - Start new discussions with custom settings
4. **Join Sessions** - One-click join or use shareable links
5. **Video Controls** - Toggle video/audio during session
6. **Real-time Chat** - Text messaging alongside video
7. **View Results** - Get AI + NLP evaluation after the session

### Admin Access
1. Login with `admin@gd.com` (register this email first)
2. **Admin Panel** - Monitor all ongoing GDs and users
3. **Force End GDs** - Terminate any active discussion

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Group Discussions
- `GET /api/gd` - Get all active GDs
- `POST /api/gd` - Create new GD
- `POST /api/gd/:id/join` - Join existing GD
- `PATCH /api/gd/:id/end` - End GD (moderator only)

### Evaluations
- `POST /api/evaluation` - Submit transcript for AI + NLP evaluation
- `GET /api/evaluation/:gdId` - Get evaluation results for a session

## Deployment on Render

### 1. Database — MongoDB Atlas
- Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Get connection string for `MONGODB_URI`

### 2. NLP Service — Web Service
| Field | Value |
|---|---|
| Root Directory | `nlp-service` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app:app --host 0.0.0.0 --port 8000` |
| Plan | Standard ($25/mo) — requires ~2GB RAM |

### 3. Backend — Web Service
| Field | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |

Environment variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `NLP_SERVICE_URL` = your NLP service Render URL
- `PORT` = `5001`

### 4. Frontend — Static Site
| Field | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `build` |

Environment variable:
- `REACT_APP_API_URL` = your backend Render URL

## Troubleshooting

### MongoDB Issues
- Ensure MongoDB is running: `net start MongoDB`
- Check port 27017 is available
- For Atlas, verify connection string in `.env`

### NLP Service Issues
- Ensure Python 3.9+ is installed
- First startup is slow — models download on first run (~500MB)
- Requires minimum 2GB RAM in production

### Port Conflicts
- Backend: `5001`, Frontend: `3000`, NLP: `8000`
- Update `.env` if ports are busy

### Browser Permissions
Camera and microphone access is required for video conferencing. Users will be prompted when joining a room.

## License

MIT License - feel free to use for educational or commercial purposes.
