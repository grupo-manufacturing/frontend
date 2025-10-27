# Groupo - AI Manufacturing Platform

An AI-powered platform connecting buyers with verified manufacturers worldwide.

## 🚀 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **React 19** - Latest React features

## 🎨 Features

### Landing Page
- Responsive navigation and hero section
- Product categories and AI features showcase
- Platform features and testimonials
- Call-to-action sections

### Buyer Portal
- Phone-based authentication with OTP
- Dashboard with multiple tabs (Designs, Quotes, Orders, Chat, etc.)
- AI chatbot integration for manufacturer discovery
- Interactive order forms and manufacturer cards

### Backend Authentication
- Twilio SMS OTP verification
- JWT token management
- Secure session handling

## 🚦 Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Start frontend:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Backend
The frontend is configured to use the production backend at [https://grupo-backend.onrender.com/](https://grupo-backend.onrender.com/).

For local backend development:
```bash
cd backend
npm install
npm run dev
```

Then create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

Built with Next.js, TypeScript, and Tailwind CSS
