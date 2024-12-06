# Collaborative Whiteboard

A real-time collaborative whiteboard application built with React, TypeScript, Socket.IO, and Express.

## Features

- Real-time drawing collaboration
- Multiple colors and brush sizes
- Undo/Redo functionality
- Save drawings as JSON and PNG
- Load previous drawings

## Prerequisites

- Node.js (v14+)
- npm (v6+)

## Installation

### Server Setup

```bash
git clone https://github.com/jaypatel0311/Collaborative-Whiteboard
cd whiteboard-server
npm install
mkdir drawings
npm start
```

### Client Setup

```bash
git clone https://github.com/jaypatel0311/Collaborative-Whiteboard
cd whiteboard-client
npm install
```

Update `src/components/Whiteboard.tsx`:

```typescript
const SOCKET_SERVER = "http://10.20.220.237:5001";
```

Start the client:

```bash
npm start
```

## Configuration

### Server
- Port: 5001
- CORS: Enabled for all origins
- Drawings directory: `./drawings`

### Client
- Default port: 3000
- Server connection: Update `SOCKET_SERVER` in `Whiteboard.tsx`

## Usage

1. Open browser to `http://localhost:3000`
2. Select color and brush size
3. Start drawing
4. Use undo/redo buttons to modify
5. Save drawing with a name
6. Load previous drawings

## Troubleshooting

- Ensure server IP is accessible
- Check firewall settings for port 5001
- Verify CORS settings in `index.js`
- Check drawings directory permissions

## Technologies

- React 18
- TypeScript 4
- Socket.IO 4
- Express
- Axios

## License

MIT
