# Inventra - Modern Inventory Management System

Inventra is a powerful, modern inventory management system built with React and TypeScript. It provides a comprehensive solution for managing inventory, tracking stock levels, and generating reports.

![Inventra Dashboard](public/logo.svg)

## 🌟 Features

### Core Features
- 📊 Real-time inventory tracking
- 🔔 Low stock alerts and notifications
- 📈 Comprehensive reporting and analytics
- 🔍 Advanced search functionality
- 👥 Multi-user support with role-based access
- 🌙 Dark mode support
- 📱 Responsive design for all devices

### Inventory Management
- Add, edit, and delete inventory items
- Track stock levels and movements
- Set minimum stock thresholds
- Categorize items
- Bulk import/export functionality

### Reporting & Analytics
- Sales and inventory reports
- Stock movement history
- Low stock alerts
- Custom report generation
- Data visualization with charts

### User Experience
- Modern, intuitive interface
- Quick search functionality
- Real-time notifications
- Keyboard shortcuts
- Responsive design

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **State Management**: Custom stores with React Context
- **Database**: IndexedDB (Dexie.js)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Charts**: Chart.js
- **Routing**: React Router v6
- **Build Tool**: Vite

## 📁 Project Structure

```
inventra/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── auth/       # Authentication components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── inventory/  # Inventory management components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # UI components
│   ├── contexts/       # React contexts
│   ├── db/            # Database configuration
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── stores/        # State management
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com//inventra.git
   cd inventra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Application

### Running Backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the required environment variables (see Backend Environment Variables section)

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend server will start on http://localhost:5000

### Running Frontend

1. Open a new terminal and navigate to the project root directory:
   ```bash
   cd inventra
   ```

2. Install frontend dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the required environment variables (see Environment Variables section)

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend application will start on http://localhost:5174

### Running Both Together

You can run both the backend and frontend concurrently using the following command in the root directory:
```bash
npm run dev:all
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=Inventra
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:5000/api
```

### Backend Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS and security)
FRONTEND_URL=http://localhost:5174
API_URL=http://localhost:5000

# Database Configuration 
MONGODB_URI=your_mongdb_uri

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Dexie.js](https://dexie.org/)
- [Lucide Icons](https://lucide.dev/)
- [Chart.js](https://www.chartjs.org/)