# FacePass: AI Face Recognition Attendance System

FacePass is a modern, privacy-focused, and 100% offline face recognition application built with React and face-api.js. It allows organizations to manage attendance using biometric authentication without the need for a backend server.

![FacePass Dashboard](https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/media/face_detection.png) *(Placeholder for your project screenshot)*

## ✨ Features

- **🚀 100% Offline**: All face detection and recognition is performed locally in the browser. No face data is ever sent to a server.
- **🧠 AI-Powered**: Uses `face-api.js` (TensorFlow.js) with Tiny Face Detector for fast and accurate recognition.
- **📦 Scalable Storage**: Utilizes `IndexedDB` for robust, high-capacity local storage of user profiles and logs.
- **👥 User Management**: Dedicated interface to register, view, search, and delete user profiles.
- **📊 Records & Export**: View attendance history with advanced filtering and export logs to CSV.
- **🛡️ Privacy First**: Face data is stored as mathematical embeddings (128-float arrays), not actual photos.
- **🌗 Modern UI**: Glassmorphism design with Dark Mode support, built with Tailwind CSS and Framer Motion.
- **🔊 Audio Feedback**: Instant audio confirmation for successful attendance via Web Audio API.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI/ML**: face-api.js (SSD Mobilenet & Tiny Face Detector)
- **Database**: Browser IndexedDB

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Face-Recognition-Attendance-System.git
   cd Face-Recognition-Attendance-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173`

## 📂 Project Structure

- `src/pages/`: Main application modules (Dashboard, Register, Attendance, etc.)
- `src/utils/faceApi.js`: Core AI logic and model management.
- `src/utils/storage.js`: IndexedDB wrapper for local data persistence.
- `src/utils/sounds.js`: Web Audio API synthesizer for feedback.
- `public/models/`: Pre-trained neural network weights.

## 🔒 Security & Privacy

FacePass is designed with security in mind:
- **Zero Cloud**: No external API calls are made for face recognition.
- **Data Erasure**: Users can clear all records and profiles directly from the Settings page.
- **Local-Only**: Your biometric data remains within your browser's internal storage.

## 📄 License

This project is open-source. See the [LICENSE](LICENSE) file for details.

---
Built with ❤️ using React and AI.
