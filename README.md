# Campus Find - Lost & Found Management System

> A modern, cross-platform mobile and web application for managing lost and found items on campus.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [Features Details](#features-details)
- [Project Architecture](#project-architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Overview

**Campus Find** is a comprehensive lost and found management system designed for college and university campuses. It enables students, staff, and administrators to report lost items, find claimed items, track claims, and manage announcements through an intuitive interface available on iOS, Android, and Web platforms.

The application uses an intelligent matching system to connect lost items with found items, streamlining the recovery process and reducing the administrative burden on campus staff.

**Project Name:** Campus Find  
**Version:** 1.0.0  
**Owner:** Arcada Labs  
**Application ID:** com.aadi2404.campusfind

---



## 📁 Project Structure

```
campusfind/
├── assets/                      # Static assets (icons, images, fonts)
├── components/                  # Reusable React components
│   ├── ClaimCard.tsx           # Card component for displaying claims
│   ├── ItemCard.tsx            # Card component for displaying items
│   └── StatsCard.tsx           # Card component for displaying statistics
├── screens/                     # Application screens/pages
│   ├── AdminScreen.tsx         # Admin dashboard
│   ├── AnnouncementsScreen.tsx # Announcements view
│   ├── AuthScreen.tsx          # Authentication (login/signup)
│   ├── ClaimsScreen.tsx        # User's claims management
│   ├── HomeScreen.tsx          # Main home/dashboard
│   ├── ItemDetailScreen.tsx    # Detailed item view
│   ├── NotificationsScreen.tsx # User notifications
│   ├── ProfileScreen.tsx       # User profile management
│   ├── ReportScreen.tsx        # Report new lost/found item
│   ├── SearchScreen.tsx        # Search and browse items
│
├── lib/                         # Core library and utilities
│   ├── data.ts                 # Mock or static data
│   ├── store.ts                # Application state management
│   ├── supabase.ts             # Supabase client initialization
│   ├── theme.ts                # Design tokens and styling
│   ├── types.ts                # TypeScript type definitions
│
├── android/                     # Android native configuration
│   ├── build.gradle            # Android build configuration
│   └── gradle.properties        # Gradle properties
│
├── dist2/                       # Web distribution build output
│
├── App.tsx                      # Root application component
├── app.json                     # Expo application configuration
├── eas.json                     # Expo Application Services config
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project dependencies
├── vercel.json                 # Vercel deployment configuration
├── init.sql                    # Database schema initialization
├── metro-error.json            # Metro bundler configuration
├── index.ts                    # Entry point
└── README.md                   # This file
```

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd campusfind
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Database Setup
Run the SQL schema initialization:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query and paste the contents of `init.sql`
4. Execute the query to set up tables, RLS policies, and constraints

### Step 5: iOS Setup (Mac only)
```bash
expo run:ios
```

### Step 6: Android Setup
```bash
expo run:android
```

---

## 📱 Running the Application

### Development Server
```bash
npm start
# or
yarn start
```

This starts the Expo development server. You'll see a QR code to scan with Expo Go app.

### Run on Specific Platform

**iOS (Mac only):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

### Build for Production

Using Expo Application Services (EAS):
```bash
eas build --platform ios
eas build --platform android
```

---



## 🏗 Project Architecture

### Navigation Structure

```
App Root
├── Auth Stack (Unauthenticated Users)
│   └── AuthScreen
│
└── Main App Stack (Authenticated Users)
    ├── Admin Stack (If role === 'admin')
    │   ├── AdminScreen
    │   └── MainTabs
    │
    └── User Tabs (Regular Users)
        ├── HomeScreen
        ├── SearchScreen
        ├── ReportScreen
        ├── ClaimsScreen
        ├── NotificationsScreen
        ├── ProfileScreen
        └── Detail Screens
            ├── ItemDetailScreen
            └── AnnouncementsScreen
```

### Data Flow

```
User Action
    ↓
Component/Screen
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
RLS Policies (Security Check)
    ↓
Response to Client
    ↓
Update UI/State
```

### Authentication Flow

1. User opens app
2. App checks for existing session (AsyncStorage)
3. If authenticated → Load main app
4. If not authenticated → Show AuthScreen
5. User logs in/signs up via Supabase Auth
6. Session stored securely in AsyncStorage/Secure Store
7. Auto-refresh tokens for persistent sessions

---

## 📝 Type Definitions

### Main Types

```typescript
// User
type UserRole = 'student' | 'staff' | 'admin'

// Items
type ItemCategory = 'Electronics' | 'Documents' | 'Clothing' | 'Accessories' | 'Books' | 'Keys' | 'Bags' | 'Sports' | 'Other'
type ItemStatus = 'active' | 'claimed' | 'returned' | 'expired'
type ItemType = 'lost' | 'found'
type Priority = 'urgent' | 'normal'

// Claims
type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'resolved'
```

---

## 🔧 Configuration Files

### app.json (Expo Configuration)
```json
{
  "expo": {
    "name": "Campus Find",
    "slug": "campusfind",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "owner": "arcadalabs"
  }
}
```

### eas.json (Expo Application Services)
Manages builds for iOS and Android through Expo's cloud infrastructure.

### tsconfig.json (TypeScript)
Strict mode enabled for type safety.

### vercel.json (Deployment)
Configuration for deploying web version to Vercel.

---

## 📚 Development Workflow

### Adding a New Screen
1. Create new file in `screens/` directory
2. Define component with navigation prop
3. Add to navigation stack in `App.tsx`
4. Import necessary types from `lib/types.ts`

### Adding a New Component
1. Create reusable component in `components/` directory
2. Import styling from `lib/theme.ts`
3. Use TypeScript for type safety
4. Export and use in screens

### Updating Database
1. Modify `init.sql` with new tables/columns
2. Run updated SQL in Supabase dashboard
3. Update TypeScript interfaces in `lib/types.ts`
4. Update Supabase queries as needed

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Supabase connection error**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure network connectivity

**Issue: Auth token expired**
- Clear AsyncStorage and reconnect
- Verify token refresh is enabled in supabase.ts

**Issue: Platform-specific build errors**
- Clear node_modules and reinstall: `npm install`
- Clear Expo cache: `expo start --clear`

---

## 📖 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation Guide](https://reactnavigation.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'Add AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow React component best practices
- Use meaningful variable and function names
- Add comments for complex logic

---

## 📄 License

This project is private and proprietary software. All rights reserved.

---

## 👥 Team

- **Owner**: Arcada Labs
- **Project Coordinator**: aadi2404

---

## 📞 Support

For issues, questions, or feature requests, please reach out to the project team or create an issue in the repository.

---

**Last Updated**: April 2026  
**Version**: 1.0.0
