# 🚀 G-Bax: Blockchain Space Exploration Game

<div align="center">

![G-Bax Logo](https://img.shields.io/badge/G--Bax-Space%20Explorer-blue?style=for-the-badge&logo=rocket)

**A cutting-edge 3D blockchain space exploration game powered by Solana, Honeycomb Protocol, and Verxio**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-purple?style=flat-square&logo=solana)](https://solana.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-orange?style=flat-square&logo=three.js)](https://threejs.org/)
[![HeroUI](https://img.shields.io/badge/HeroUI-Design%20System-pink?style=flat-square)](https://heroui.com/)

[🎮 Play Now](https://g-bax.vercel.app) • [📚 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

## 🌟 Overview

G-Bax is a revolutionary blockchain-powered space exploration game that combines immersive 3D gameplay with true digital ownership. Players explore procedurally generated space sectors, mine valuable resources, craft items, and build their legacy in a persistent universe where all progress is recorded on the Solana blockchain.

### ✨ Key Features

- **🌌 3D Space Exploration**: Navigate through beautifully rendered space environments with Three.js
- **⛏️ Resource Mining**: Extract energy, crystals, and metals from asteroids and resource nodes
- **🔗 Blockchain Integration**: True ownership of assets and progress via Solana blockchain
- **⭐ Loyalty System**: Earn points and climb tiers with Verxio's loyalty platform
- **🏛️ Guild System**: Join communities for enhanced bonuses and social gameplay
- **🎯 Mission System**: Complete objectives powered by Honeycomb Protocol
- **📊 Real-time Progress**: Live tracking of experience, resources, and achievements
- **🎨 Modern UI**: Clean, responsive interface built with HeroUI and Tailwind CSS

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.3.1 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS + HeroUI Design System
- **3D Graphics**: Three.js for immersive space environments
- **State Management**: Zustand with persistence

### Blockchain
- **Network**: Solana (Mainnet/Devnet)
- **Wallet Integration**: Multiple wallet support (Phantom, Solflare, Backpack)
- **Game Protocol**: Honeycomb Protocol for on-chain game mechanics (no API key required)
- **Loyalty System**: Verxio for player rewards and progression (no API key required)

### Development
- **Build Tool**: Turbopack for fast development
- **Package Manager**: npm
- **Code Quality**: ESLint + TypeScript strict mode
- **Deployment**: Netlify with static export and automatic CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Solana wallet (Phantom recommended)
- Small amount of SOL for transactions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/olubunmitosin/g-bax.git
   cd g-bax
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   ```

   **Note**: The `.env.local` file has been created with default values. Both blockchain integrations work out of the box:
   - **Honeycomb Protocol**: No API key required - works automatically
   - **Verxio**: No API key required - works out of the box

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

### Getting Started
1. **Connect Your Wallet**: Click the wallet button and connect your Solana wallet
2. **Explore Space**: Navigate the 3D environment using mouse controls
3. **Select Objects**: Click on asteroids or resource nodes to select them
4. **Start Mining**: Use the mining interface to extract resources
5. **Check Progress**: View your inventory, experience, and loyalty points

### Game Mechanics

#### Mining System
- **Asteroids**: Quick mining (~4 seconds) with basic yields
- **Resource Nodes**: Slower mining (~7.5 seconds) with higher yields
- **Resource Types**: Energy, Crystal, Metal with varying rarities
- **Concurrent Operations**: Mine up to 3 objects simultaneously

#### Progression
- **Experience**: Gain XP through mining, crafting, and missions
- **Loyalty Points**: Earn points for activities, climb tiers for bonuses
- **Guild Benefits**: Join guilds for mining speed, XP, and resource bonuses

#### Blockchain Features
- **True Ownership**: Your progress and items are yours forever
- **Verifiable Progress**: All achievements recorded on-chain
- **Cross-Platform**: Access your account from any device
- **Persistent Universe**: Your actions contribute to the game world

## 📁 Project Structure

```
g-bax/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page (3D game)
│   ├── how-to-play/      # Game guide
│   ├── inventory/        # Player inventory
│   ├── missions/         # Mission system
│   ├── guilds/          # Guild browser
│   ├── profile/         # Player profile
│   ├── leaderboard/     # Player rankings
│   └── settings/        # Game settings
├── components/            # React components
│   ├── three/           # 3D scene components
│   ├── ui/              # UI components
│   └── providers/       # Context providers
├── hooks/                # Custom React hooks
├── stores/               # Zustand state stores
├── systems/              # Game system logic
├── utils/                # Utility functions
├── types/                # TypeScript definitions
└── config/               # Configuration files
```
## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type Checking
npm run type-check   # Run TypeScript compiler check
```

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for Next.js and React best practices
- **Prettier**: Code formatting (configure in your editor)
- **Husky**: Git hooks for pre-commit checks (optional)

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network (mainnet/devnet) | Yes |

## 🏗️ Architecture

### State Management
- **Game Store**: Player data, inventory, experience
- **Verxio Store**: Loyalty points, tiers, guild membership
- **Honeycomb Store**: On-chain missions and traits

### Game Systems
- **Mining System**: Resource extraction logic
- **Crafting System**: Item creation mechanics
- **Mission System**: Objective tracking and rewards
- **Loyalty System**: Point earning and tier progression

### 3D Rendering
- **Scene Management**: Three.js scene setup and controls
- **Object Generation**: Procedural space object creation
- **Camera Controls**: Smooth navigation and interaction
- **Performance**: Optimized rendering for smooth gameplay

## 🚀 Deployment

### Netlify Deployment

This project is configured for easy deployment on Netlify:

1. **Quick Deploy**:
   ```bash
   # Connect your GitHub repo to Netlify
   # Build settings are auto-configured via netlify.toml
   ```

2. **Environment Variables**: Set in Netlify dashboard:
   - `NEXT_PUBLIC_SOLANA_NETWORK=devnet`

3. **Build Configuration**:
   - Build command: `npm run build`
   - Publish directory: `out`
   - Node version: 18

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md).
For a complete deployment checklist, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

### Alternative Deployments

The project can also be deployed on:
- **Vercel**: Change `output: 'export'` to `output: 'standalone'` in next.config.js
- **GitHub Pages**: Use the static export as-is
- **Any Static Host**: Deploy the `out/` directory after running `npm run build`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kesty Vickky (Tosin Victor Olubunmi)** - Sole Author & Lead Developer
- GitHub: [@olubunmitosin](https://github.com/olubunmitosin)
- Repository: [olubunmitosin/g-bax](https://github.com/olubunmitosin/g-bax)

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for detailed contribution information.

## 🙏 Acknowledgments

- **[Honeycomb Protocol](https://honeycomb.gg)**: On-chain game infrastructure
- **[Verxio](https://verxio.com)**: Loyalty and rewards platform
- **[Solana](https://solana.com)**: High-performance blockchain
- **[Three.js](https://threejs.org)**: 3D graphics library
- **[HeroUI](https://heroui.com)**: Modern React UI components
- **[Next.js](https://nextjs.org)**: React framework

---

<div align="center">

**Built with ❤️ by Kesty Vickky (Tosin Victor Olubunmi)**

[⭐ Star me on GitHub](https://github.com/olubunmitosin/g-bax) • [🐛 Report Bug](https://github.com/olubunmitosin/g-bax/issues) • [💡 Request Feature](https://github.com/olubunmitosin/g-bax/issues)

</div>
