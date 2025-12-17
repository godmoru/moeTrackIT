# MOETrackIT Mobile App

A React Native mobile application for the Ministry of Education Revenue Tracking System.

## Features

- **Authentication**: Secure login with JWT token storage
- **Dashboard**: Real-time overview of collections, assessments, and LGA performance
- **Payments**: View and record payment transactions
- **Assessments**: Browse and filter assessments by status
- **Profile**: User profile management and settings

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **Storage**: Expo SecureStore for token management
- **Icons**: Expo Vector Icons (Ionicons)
- **Charts**: React Native SVG for progress rings

## Project Structure

```
mobile/
├── App.tsx                 # App entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── StatCard.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── PaymentItem.tsx
│   │   └── AssessmentItem.tsx
│   ├── screens/            # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── PaymentsScreen.tsx
│   │   ├── AssessmentsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/           # API services
│   │   └── api.ts
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── utils/              # Utility functions
│       └── format.ts
├── package.json
├── tsconfig.json
├── babel.config.js
└── app.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL in `src/services/api.ts`:
   ```typescript
   const API_BASE = 'http://your-backend-url/api/v1';
   ```

   For local development with a physical device, use your computer's IP address:
   ```typescript
   const API_BASE = 'http://192.168.x.x:5000/api/v1';
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your device:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## API Configuration

The app connects to the same backend API as the web frontend. Make sure the backend server is running and accessible from your device.

For development on a physical device:
1. Ensure your phone and computer are on the same network
2. Find your computer's local IP address
3. Update `API_BASE` in `src/services/api.ts`

## Building for Production

### Android APK
```bash
expo build:android -t apk
```

### iOS IPA
```bash
expo build:ios -t archive
```

### EAS Build (Recommended)
```bash
npx eas build --platform android
npx eas build --platform ios
```

## Screens Overview

### Login Screen
- Email and password authentication
- Forgot password link
- MOE branding

### Dashboard
- Total collections summary
- Assessment status breakdown
- Progress rings for targets
- Top LGAs by remittance
- Recent payments list

### Payments
- Paginated payment list
- Filter and search options
- FAB for recording new payments
- Payment details view

### Assessments
- Status filter chips (All, Pending, Partial, Paid, Overdue)
- Paginated assessment list
- Assessment details with payment history

### Profile
- User information display
- Quick stats
- Settings menu
- Logout functionality

## Color Scheme

- **Primary**: `#059669` (Green)
- **Background**: `#f3f4f6` (Light Gray)
- **Card**: `#ffffff` (White)
- **Text Primary**: `#1f2937` (Dark Gray)
- **Text Secondary**: `#6b7280` (Medium Gray)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## License

This project is part of the MOETrackIT system for the Ministry of Education.
