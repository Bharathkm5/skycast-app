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
