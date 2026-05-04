# MediSync AI: Intelligent Health Assistant

**MediSync AI** is a comprehensive health assistant that provides personalized medical advice, BMI calculations, diet planning, and local healthcare provider recommendations. Built with modern React and powered by intelligent AI responses.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=flat-square)](https://healthcare-ai-five.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-cyan?style=flat-square)](https://github.com/kavitha0507/healthcare_ai)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-green?style=flat-square)](https://healthcare-ai-q3yl.vercel.app)

---

## Key Features

### AI Health Assistant
- **Intelligent Conversations**: Real-time health advice with evidence-based responses
- **Symptom Analysis**: Get recommendations for headaches, sleep issues, stress, and more
- **Personalized Nutrition**: Meal planning and dietary recommendations
- **Exercise Guidance**: Workout routines and fitness advice
- **Mental Health Support**: Stress management and wellness tips

### Health Calculators
- **BMI Calculator**: Calculate Body Mass Index with personalized insights
- **Diet Plans**: Personalized nutrition based on BMI category
- **Health Tracking**: Monitor your health journey with activity history

### Smart Features
- **Wake-up Alarms**: Daily health reminders with browser notifications
- **Activity History**: Track all your health queries and progress
- **Quick Actions**: Pre-built buttons for common health topics

### Local Healthcare
- **Austin Specialists**: Detailed information about local healthcare providers
- **Contact Information**: Phone numbers and specialties for Austin doctors
- **Insurance Info**: Details about insurance acceptance and telehealth options

---

## Design System
- **Modern Glassmorphism**: Translucent UI with blur effects for a calming experience
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Accessibility**: WCAG compliant with high contrast and semantic HTML
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Color Palette**: Trust-based Blue (#3b82f6) and Innovation-based Purple (#a855f7)

---

## Technology Stack

### Frontend
- **React 19.2.5** - Modern UI framework
- **Vite 8.0.10** - Fast build tool
- **Tailwind CSS 4.2.4** - Utility-first styling
- **Lucide React** - Beautiful icons
- **LocalStorage** - Persistent data storage

### Backend
- **FastAPI** - Modern Python web framework
- **Python** - Backend programming language
- **REST APIs** - Health data processing

### Deployment
- **Vercel** - Frontend hosting (https://healthcare-ai-five.vercel.app)
- **Render** - Backend hosting (https://healthcare-ai-q3yl.vercel.app)

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kavitha0507/healthcare_ai.git
   cd healthcare_ai
   ```

2. **Install frontend dependencies**
   ```bash
   cd medisync-frontend
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - The app will automatically reload when you make changes

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=https://healthcare-ai-q3yl.vercel.app
```

---

## Features in Detail

### Health Consultation
- Ask any health-related questions
- Get evidence-based medical advice
- Symptom analysis and recommendations
- Mental health and wellness support

### BMI Calculator
- Calculate BMI from weight and height
- Personalized diet recommendations
- Health category insights
- Visual feedback with color coding

### Wake-up Alarms
- Set daily health reminders
- Custom wake-up messages
- Browser notifications
- Persistent settings with LocalStorage

### Activity History
- Track all health queries
- Monitor progress over time
- Categorized health logs
- Timestamp and type tracking

### Austin Specialists
- Comprehensive provider directory
- Contact information and specialties
- Insurance and telehealth details
- Multiple hospital networks

---

## Development

### Project Structure
```bash
healthcare_ai/
├── medisync-frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # React entry point
│   │   └── App-test.jsx     # Test component
│   ├── public/
│   ├── package.json
│   └── vercel.json          # Vercel deployment config
├── medisync-mobile/         # Mobile app (if applicable)
└── README.md
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

### Deployment

#### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push to main branch

#### Backend (Render/FastAPI)
1. Deploy the FastAPI backend
2. Configure environment variables
3. Set up CORS for frontend access

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices
- Use semantic HTML5 elements
- Ensure accessibility compliance
- Test on multiple screen sizes
- Write clean, commented code

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **React Team** - For the amazing React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Vercel** - For seamless deployment
- **FastAPI** - For the modern Python backend
- **Lucide Icons** - For the beautiful icon library

---

## Contact

**Created by [Kavitha Mynala](https://github.com/kavitha0507)**

- Email: your-email@example.com
- GitHub: [kavitha0507](https://github.com/kavitha0507)
- Live Demo: [MediSync AI](https://healthcare-ai-five.vercel.app)

---

## Show Your Support

If you find this project helpful, please consider:

- Starring the repository
- Reporting issues and bugs
- Suggesting new features
- Sharing with others

---

**MediSync AI** - Your Intelligent Health Companion 
