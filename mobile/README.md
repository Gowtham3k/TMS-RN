# TMS Mobile App (Expo Go)

Cross-platform mobile application for TMS (Complaint Raising & Ticket Management System) built with Expo and React Native.

## Features
- **Role-Based Access**: Specialized interfaces for Admin, Staff, Super Admin, and Users.
- **Complaint Management**: Raise issues, track real-time resolution, review audit logs, and manage tickets.
- **Live Support**: In-app live support assistant.
- **Dark/Light Mode & Multi-language Support**: English and Tamil language localization.
- **Smooth Form Inputs & Keyboard Handling**: Keyboard-avoiding views and smooth scrolling across Android and iOS.

## Prerequisites
- Node.js (v18+ recommended)
- **Expo Go** app installed on your physical mobile device (Android from Google Play Store or iOS from App Store), or an Android/iOS emulator.
- Backend server running (from `backend/` directory on port 5000).

## Quick Start

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start the Expo development server**:
   ```bash
   npm start
   ```
   Or to start with tunnel mode (useful if your mobile device is on a different Wi-Fi network):
   ```bash
   npm run tunnel
   ```

3. **Open on your device**:
   - Open the **Expo Go** app on your phone.
   - Scan the QR code displayed in the terminal / Metro bundler web page.

## Demo Credentials
- **Admin**: `admin@tms.com` / `password123`
- **Staff**: `staff@tms.com` / `password123`
- **User**: `user@tms.com` / `password123`
