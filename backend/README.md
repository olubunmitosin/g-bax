# G-Bax Backend API

A Node.js/Express backend service for the G-Bax blockchain gaming platform, providing Honeycomb Protocol integration and game-related API endpoints.

## Features

- **Honeycomb Protocol Integration**: Full integration with Honeycomb Protocol for blockchain operations
- **Player Profile Management**: Create and retrieve player profiles
- **RESTful API**: Clean REST API design with proper error handling
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Morgan for HTTP request logging
- **Environment Configuration**: Dotenv for environment variable management

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Access to Solana network (Honeynet for development)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Environment setup:
   - The `.env` file is automatically copied from the main project
   - Verify environment variables are correctly set


## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **Honeycomb connection failed**: Verify RPC URL and network configuration
3. **Profile creation failed**: Check project address and profile tree configuration
4. **Transaction signing failed**:
   - Verify NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY is set correctly
   - Ensure the admin keypair has sufficient SOL for transaction fees
   - Check that the admin has proper permissions for the Honeycomb project
5. **"No signer available" error**: Configure NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY in environment variables

### Logs

The server provides detailed logging for debugging:
- HTTP requests (Morgan)
- Honeycomb operations
- Error details in development mode

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Update documentation for new features
4. Test thoroughly before submitting changes

## License

MIT License - see the main project LICENSE file for details.
