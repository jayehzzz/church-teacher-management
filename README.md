# Church Teacher Management System

A comprehensive web application designed to help churches manage their teaching staff, track attendance, and analyze ministry effectiveness.

## 🚀 Features

- **Central Members Management**: Organize and manage church members efficiently
- **Dashboard Analytics**: Visual insights into church activities and member engagement
- **Evangelism Tracking**: Monitor outreach efforts and track new member acquisition
- **First-Timers Management**: Special tracking for new visitors and their journey
- **Import/Export Functionality**: Easy data migration and backup capabilities
- **Sunday Service Logging**: Comprehensive service tracking and attendance management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2 with React 19.1.0
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Backend**: Firebase integration
- **Language**: TypeScript

## 📁 Project Structure

```
church-teacher-management/
├── web/                    # Next.js application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
├── docs/                  # Documentation
│   ├── modules/           # Feature documentation
│   ├── overview/          # System overview
│   ├── user-guides/       # User documentation
│   └── technical/         # Technical documentation
└── conterxt files/        # Sample data files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/church-teacher-management.git
cd church-teacher-management
```

2. Navigate to the web directory:
```bash
cd web
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase configuration
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Application Overview](docs/overview/application-overview.md)
- [Getting Started Guide](docs/overview/getting-started.md)
- [System Architecture](docs/overview/system-architecture.md)
- [User Guides](docs/user-guides/)
- [Module Documentation](docs/modules/)

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love for church communities
- Inspired by the need for better ministry management tools
- Thanks to all contributors and the open-source community

## 📞 Support

For support and questions, please open an issue in this repository or contact the development team.

---

**Made with ❤️ for the church community**