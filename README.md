# Questionnaire NestJS • 1–10 Rating System

A lightweight, modern fullstack web application built with **NestJS** and **Tailwind CSS**. Featuring a clean **1-to-10 rating score system** for questionnaires and surveys, styled with a minimalist light theme using **black, slate-grey, vibrant lime, and white**.

The project is fully pre-configured to be shared on **GitHub** and deployed on the **Render Portal** ([render.com](https://render.com)) in seconds.

---

## ✨ Features

- **NestJS Core Backend**: Structured modular backend with validation (`class-validator`), serving both the REST API and the frontend from a single performant service.
- **Tailwind CSS Light Theme**: Aesthetic palette with deep black typography (`#09090b`), soft grey surfaces and cards, crisp white, and energetic lime accents (`#84cc16`).
- **Interactive 1–10 Rating Scale**: 
  - Accessible touch-friendly and keyboard-navigable score buttons.
  - Real-time progress bar.
  - Validation ensuring all questions receive a 1–10 rating.
  - Optional respondent name and textual feedback comments.
- **Live Score Analytics**:
  - Instant score submission and acknowledgment.
  - Live average score calculation across respondents.
  - Visual 1–10 score distribution charts for each question.
- **Render Portal Ready**:
  - Contains `render.yaml` Blueprint for 1-click Render deployment.
  - Binds properly to `0.0.0.0` and dynamic `process.env.PORT`.

---

## 📁 Project Structure

```text
Questionnaire/
├── public/                 # Static web assets served by NestJS
│   ├── css/
│   │   └── style.css       # Minified Tailwind CSS output
│   ├── js/
│   │   └── app.js          # Interactive rating logic & API calls
│   └── index.html          # Questionnaire single-page view
├── src/
│   ├── client/
│   │   └── input.css       # Tailwind CSS input file & utilities
│   ├── survey/
│   │   ├── dto/
│   │   │   └── submit-survey.dto.ts  # Validation DTO (score 1-10)
│   │   ├── survey.controller.ts      # REST endpoints
│   │   ├── survey.module.ts          # Survey module
│   │   └── survey.service.ts         # In-memory store & calculation
│   ├── app.module.ts       # Main app module with static file provider
│   └── main.ts             # Entrypoint with 0.0.0.0 & dynamic port
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Scripts & dependencies
├── render.yaml             # Render.com Blueprint deployment spec
├── tailwind.config.js      # Tailwind CSS configuration & palette
├── tsconfig.json           # TypeScript configuration
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v24)
- **npm** v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Build & Compile Assets
Compiles Tailwind CSS into `public/css/style.css` and compiles NestJS TypeScript into `dist/`:
```bash
npm run build
```

### 4. Run Development Server
Runs both Tailwind CSS watcher and the NestJS dev server simultaneously:
```bash
npm run start:dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🌐 Deploy to Render Portal (render.com)

This repository includes everything needed to run as a free Web Service on Render.

### Option A: Using Render Blueprints (Recommended)
1. Push this repository to your **GitHub** account (see instructions below).
2. Log into your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](./render.yaml) and configure:
   - **Service Name**: `questionnaire-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Port**: Handled automatically via `PORT` environment variable.
6. Click **Apply**. Your app will build and deploy with a public `.onrender.com` URL.

### Option B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your connected GitHub repository.
3. Fill in the service settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: `Free`
4. Click **Create Web Service**.

---

## 🐙 Sharing on GitHub

To push this project to a new GitHub repository:

```bash
# Initialize git repository (if not already initialized)
git init

# Stage all files
git add .

# Commit changes
git commit -m "feat: initial NestJS questionnaire with Tailwind CSS and Render setup"

# Rename branch to main
git branch -M main

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# Push to GitHub
git push -u origin main
```

---

## 🔌 REST API Reference

The NestJS backend provides the following endpoints:

### 1. Get Questionnaire Items
- **Method**: `GET`
- **Path**: `/api/survey/questions`
- **Response**: List of questions with title, category, description, and min/max score labels.

### 2. Submit Rating Scores
- **Method**: `POST`
- **Path**: `/api/survey/submit`
- **Body**:
  ```json
  {
    "answers": [
      { "questionId": "satisfaction", "score": 9 },
      { "questionId": "recommendation", "score": 10 },
      { "questionId": "usability", "score": 8 },
      { "questionId": "performance", "score": 9 }
    ],
    "respondentName": "Jane Doe",
    "feedback": "Super fast and responsive interface!"
  }
  ```
- **Validation**: Enforces integer scores between `1` and `10` inclusive.

### 3. Get Aggregated Score Analytics
- **Method**: `GET`
- **Path**: `/api/survey/results`
- **Response**: Total submissions count, overall average score (out of 10), per-question averages, and full 1–10 score distribution percentages.

---

## 🎨 Design System

- **Background**: `#fafafa` (Light minimal canvas)
- **Cards & Surfaces**: `#ffffff` with subtle slate borders (`#e2e8f0`)
- **Primary Text & Headings**: Deep Black `#09090b`
- **Muted Text**: Slate `#64748b`
- **Accent & Active Rating**: Lime `#84cc16` / `#a3e635` / `#65a30d`
- **Theme**: Pure Light Theme
