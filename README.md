# Groupo - One-Stop AI Manufacturing Platform

A modern, responsive platform for Groupo, an AI-powered manufacturing platform that connects buyers with verified manufacturers worldwide. Features a complete landing page and integrated buyer portal with AI chatbot.

## 🚀 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **React 19** - Latest React features

## 🎨 Features

### 🏠 Landing Page
Complete responsive landing page with all sections

1. **Navbar**
   - Fixed responsive navigation
   - Groupo logo with brand text
   - Mobile hamburger menu
   - Smooth animations

2. **Hero Section**
   - Eye-catching headline and CTAs
   - Real manufacturing images (hero1.jpeg, hero2.jpeg)
   - Statistics cards (10K+ orders)
   - Feature badges (No Commission, Instant Quotes, QC Verified)

3. **Live Manufacturing**
   - Real-time transaction counter
   - Animated route indicators (5 global routes)
   - Sequential fade-in/out animations
   - World map visualization

4. **Product Categories**
   - 3 category cards with real images
   - T-Shirts & Tops, Denim & Jeans, Custom Apparel
   - Hover effects and animations
   - Reduced card heights for better UX

5. **AI Features**
   - "Intelligent Manufacturing Made Simple"
   - 4 stats grid (99.9% Accuracy, <30s Response, 24/7 Monitoring, 10K+ Manufacturers)
   - AI matching visualization
   - Feature cards (Neural Network, Predictive Analytics, Quality Control)

6. **Platform Features**
   - 7 feature cards in responsive grid
   - Smart Quote Calculator, Real-Time Chat, QC Video Verification
   - Design Marketplace, AI Assistant, Auto-Translation, Secure Platform

7. **How It Works**
   - 4-step process visualization
   - Benefits grid (Save Time, Stay Secure, Scale Fast)
   - Translation demo (18+ languages)
   - Interactive elements

8. **Testimonials**
   - 3 customer success stories
   - 5-star ratings
   - Stats counter (1000+ clients, 50+ countries, 99% satisfaction)

9. **CTA Section**
   - Full-width hero with hero1.jpeg background
   - Dark overlay for readability
   - Dual CTA buttons
   - Bottom stats

10. **Footer**
    - Groupo logo integration
    - 4-column layout (Platform, Resources, Company)
    - Legal links
    - Global/Fast badges

### 🛒 Buyer Portal
Complete buyer dashboard with multiple tabs and AI integration

1. **Authentication**
   - Phone number login with OTP verification
   - Secure session management
   - User profile management

2. **Dashboard Tabs**
   - **Designs** - Browse design marketplace
   - **Instant Quote** - AI-powered quote generation
   - **Custom Quote** - Detailed requirement submission
   - **My Orders** - Order tracking and management
   - **Chats** - Manufacturer communication
   - **Requirements** - Requirement management
   - **Cart** - Shopping cart functionality
   - **Profile** - User profile and settings

3. **AI Chatbot Integration**
   - Floating chat button (bottom-right)
   - Centered modal interface
   - Interactive suggestion chips
   - Manufacturer discovery
   - Order form integration
   - Real-time chat simulation

### 🤖 AI Chatbot Features

1. **Smart Responses**
   - Cotton t-shirts → Manufacturer A (Mumbai, India)
   - Denim/Jeans → Manufacturer B (Guangzhou, China)
   - Order guidance → Helpful action examples

2. **Interactive Components**
   - Clickable suggestion chips
   - Manufacturer cards with ratings
   - Order forms with validation
   - Real-time chat simulation

3. **Responsive Design**
   - Mobile-first approach
   - Adaptive sizing across devices
   - Touch-friendly interactions

## 🎭 Custom Animations

- **Popup Animation** - Route indicators with scale and bounce
- **FadeInOut Animation** - Sequential appearance of route pills
- Hover effects throughout
- Smooth transitions

## 📁 Project Structure

```
groupo-prototype/
├── app/
│   ├── buyer-portal/
│   │   └── page.tsx              # Buyer portal dashboard
│   ├── components/
│   │   ├── Navbar.tsx           # Landing page navigation
│   │   ├── Hero.tsx             # Landing page hero
│   │   ├── LiveManufacturing.tsx
│   │   ├── ProductCategories.tsx
│   │   ├── AIFeatures.tsx
│   │   ├── PlatformFeatures.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Testimonials.tsx
│   │   ├── CTA.tsx
│   │   ├── Footer.tsx
│   │   ├── AIChatbot.tsx        # AI chatbot component
│   │   ├── ManufacturerCard.tsx # Manufacturer display card
│   │   └── OrderForm.tsx        # Order form component
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing page
├── public/
│   ├── groupo-logo.png
│   ├── hero1.jpeg
│   ├── hero2.jpeg
│   └── hero3.jpg
└── README.md
```

## 🚦 Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Key Highlights

- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Complete buyer portal with 8 dashboard tabs
- ✅ AI chatbot with manufacturer discovery
- ✅ Interactive order forms and manufacturer cards
- ✅ Phone-based authentication system
- ✅ Real-time chat simulation
- ✅ Professional UI/UX design
- ✅ Clean, maintainable code structure

## 📝 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌟 Brand Colors

- **Primary Blue**: `#2563eb` (blue-600)
- **Background**: White to gray gradients
- **Dark Sections**: Gray-900/Blue-900 combinations

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
