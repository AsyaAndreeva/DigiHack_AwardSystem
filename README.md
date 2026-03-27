# Дигитален маратон 🏆

A comprehensive, scalable, and dynamic hackathon evaluation and leaderboard system built with Next.js and Neon PostgreSQL.

## 🚀 Features

### 👑 Admin Console (`/admin`)
- **Real-time Team Management**: Create, edit, and assign passcodes to participating hackathon teams.
- **Jury Roster Control**: Provision access codes and monitor jury evaluation completion rates.
- **Hierarchical Rubric Builder**: Construct unlimited granular evaluation sub-criteria sorted by overarching Parent Categories. Supports HTML-rich descriptions inside evaluation constraint boxes.
- **Global Theme & Resource Injection**: Define the official hackathon thesis, context, and external resources. Pushes updates instantly to the centralized hub.
- **System Settings**: Control the global App Theme Color instantly via color-picker CSS variable injection, and rigidly enforce submission deadlines.

### ⚖️ Jury Portal (`/jury` & `/evaluate/[teamId]`)
- **Secure Access**: Passcode-protected entry for each authorized jury member.
- **Dynamic Grading Matrix**: Seamless mapping of up to 17+ granular assessment inputs spread across modular categories (Innovation, Design, Technical, Business, Presentation).
- **Responsive Points Scales**: Automatic maximum point constraints (`do N tocki`) assigned to individual criterion logic gates.
- **Real-Time Auto-Save**: Saves evaluation telemetry on every single action to prevent data loss.
- **Feedback & Remarks**: Dedicated HTML text areas for submitting constructive criticism.

### 📊 Live Dashboards
- **Global Leaderboard (`/dashboard`)**: Beautifully tracks live score cascades and final verdicts synced instantly from the jury. Visualizes point dispersion across all 5 evaluation dimensions.
- **Team Dashboard (`/team-dashboard`)**: Allows participants to view their official submission profiles, uploaded links, and live rank post-evaluation.

### 🎨 Design Aesthetic
- **Brand System**: Driven by a deep custom 7-color palette configured via Tailwind CSS. 
- **Glassmorphism & Gradients**: Heavy use of modern pseudo-states, animated ambient glows, frosted glass cards, and precise micro-interactions.
- **Fully Responsive**: Flawless scaling across Desktop, Tablet, and Mobile ecosystems.

---

## 🛠️ Tech Stack & Setup

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React Server Components)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/) (`@neondatabase/serverless`)
- **Icons**: [Lucide React](https://lucide.dev/)

### Getting Started

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` containing your Neon Database connection URL:
   ```env
   DATABASE_URL="postgres://<user>:<password>@<project>.neon.tech/neondb?sslmode=require"
   NEXT_PUBLIC_ADMIN_CODE="your_secure_admin_password"
   ```

3. **Initialize Database**
   The tables will auto-generate based on API queries, or you can populate the Rubric categories initially running:
   ```bash
   node seed-rubric.js
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   *The application will boot on `http://localhost:3000`.*

---

## 🗄️ Database Schema
Data propagates seamlessly through Neon Postgres without heavy ORMs. The core tables feature:
- `teams`: Participants and project metadata.
- `jury`: Accredited judges and secure access parameters.
- `rubric_criteria`: Hierarchical tree for dynamic categories mapping into isolated assessment blocks.
- `evaluations`: Intersecting records mapping a Jury Member -> Team -> Criterion -> Score.
- `settings`: Global configuration overrides (End Date, Primary Hex Color, Global Hackathon Prompt).

Crafted with pixel-precision and robust data integrity for competitive high-stakes Hackathon grading!
