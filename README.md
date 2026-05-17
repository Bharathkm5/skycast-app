# SkyCast Backend

Node.js + Express + MongoDB + Nodemailer

## Setup
1. `npm install`
2. Edit `.env` with your MongoDB URI, Gmail App Password, JWT secret
3. `npm run dev` (development) or `npm start` (production)

## Gmail App Password
1. Enable 2FA on your Google account
2. Go: myaccount.google.com → Security → 2-Step Verification → App Passwords
3. Create password → select "Mail" + "Other device"  
4. Copy 16-char code → paste into `.env` as `EMAIL_PASS`

## First run
Admin account auto-created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`



## gpt 
````md
# 🌤️ SkyCast Backend

AI-powered weather backend built with Node.js, Express, MongoDB, OpenWeather API, and Groq AI.

---

# 🚀 Features

## 🔐 Authentication
- User Signup
- User Login
- JWT Authentication
- Protected Routes
- Admin Auto Creation

## 🌦️ Weather System
- Current Weather
- Dynamic City Weather
- Location-Based Weather
- Rain Prediction
- Humidity & Wind Data
- Temperature Details

## 🤖 AI Weather Assistant
- Human-like weather conversations
- Bike ride safety advice
- Travel suggestions
- Rain alerts
- Clothing suggestions
- Heat warnings
- Outdoor safety tips
- Natural language city detection

### Example Queries
- Will it rain in Delhi today?
- Can I ride bike in Bangalore now?
- How hot is Chennai?
- Weather near Goa

## 📧 Email System
- OTP Emails
- Password Reset Emails
- Gmail SMTP Integration

---

# 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer
- Groq AI API
- OpenWeather API
- Axios
- Render Hosting

---

# 📁 Project Structure

```txt
skycast-backend/
│
├── routes/
│   ├── auth.js
│   ├── weather.js
│   ├── ai.js
│
├── models/
│   ├── User.js
│
├── middleware/
│   ├── authMiddleware.js
│
├── utils/
│   ├── email.js
│
├── public/
│
├── server.js
├── package.json
├── .env
└── README.md
````

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Bharathkm5/skycast-app.git
```

---

## 2️⃣ Open Backend Folder

```bash
cd skycast-backend
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the root folder.

```env
PORT=10000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123

GROQ_API_KEY=your_groq_api_key

OPENWEATHER_API_KEY=your_openweather_api_key
```

---

# 📧 Gmail App Password Setup

## Step 1

Enable 2FA on your Google account.

## Step 2

Open:

[https://myaccount.google.com/security](https://myaccount.google.com/security)

## Step 3

Go to:

2-Step Verification → App Passwords

## Step 4

Create:

* App → Mail
* Device → Other

## Step 5

Copy generated 16-character password.

## Step 6

Paste into `.env`

```env
EMAIL_PASS=your_generated_password
```

---

# ▶️ Running Project

## Development Mode

```bash
npm run dev
```

## Production Mode

```bash
npm start
```

---

# 🤖 AI Chat API

## Endpoint

```http
POST /api/ai/chat
```

---

## Request Body

```json
{
  "message": "Will it rain in Delhi?",
  "city": "Hoskote",
  "weather": {}
}
```

---

# 🌍 Example AI Features

## Weather Questions

* Weather in Delhi
* Rain in Mumbai
* Humidity in Chennai

## Smart Suggestions

* Bike ride safety
* Outdoor activity advice
* Travel weather tips
* Heat alerts

---

# 🍃 MongoDB Setup

## MongoDB Atlas

Create a free cluster:

[https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

Add your IP address and get the connection string.

Paste into:

```env
MONGO_URI=your_connection_string
```

---

# ☁️ Render Deployment

## Create Web Service

Deploy backend on:

[https://render.com](https://render.com)

---

## Build Command

```bash
npm install
```

---

## Start Command

```bash
node server.js
```

---

## Add Environment Variables

* `MONGO_URI`
* `JWT_SECRET`
* `EMAIL_USER`
* `EMAIL_PASS`
* `GROQ_API_KEY`
* `OPENWEATHER_API_KEY`

---

# 👨‍💻 Default Admin

Admin account auto-creates using:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

# 🔌 APIs Used

## OpenWeather API

[https://openweathermap.org/api](https://openweathermap.org/api)

## Groq AI API

[https://groq.com](https://groq.com)

---

# 🔮 Future Improvements

* 7-day Forecast
* AI Voice Assistant
* Weather Maps
* Severe Storm Alerts
* Air Quality Index
* Multi-language Support
* Weather History Charts

---

# 👨‍💻 Author

Developed by **Bharath K M**

🌤️ SkyCast AI Weather Platform 🚀

```
```
