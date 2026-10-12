# Grupo - Apparel Manufacturing for Global Brands

Marketing site and wholesale shop for Grupo.

## 🚀 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **React 19** - Latest React features

## 🎨 Features

### Landing Page
- Hero, global reach, about, product range, process, testimonials, why Grupo, Instagram
- "Request For Quotation" CTA linking to the Google Form

### Shop (`/shop`)
- Product listing with search, filters and sorting
- Product detail, checkout (Razorpay) and order tracking
- Shop admin (`/shop/admin`) and manufacturer dashboard (`/shop/manufacturer`)

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

### Shop backend
The shop uses the separate shop backend at [https://shop-backend-eih5.onrender.com](https://shop-backend-eih5.onrender.com). Override it with `NEXT_PUBLIC_SHOP_API_URL` in `.env.local`.

## 📝 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

Built with Next.js, TypeScript, and Tailwind CSS
