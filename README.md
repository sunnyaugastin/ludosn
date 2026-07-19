# Ludo Friends

A private, real-time multiplayer Ludo web application built for playing with up to 4 friends.

## Project Structure

* **`client/`**: React frontend built with Vite and Tailwind CSS.
* **`server/`**: Node.js, Express, and Socket.IO server.

## Installation & Running

### Prerequisites
* Node.js (v18 or higher recommended)
* npm

### Running the Server
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` (or create `.env`) and adjust settings:
   ```env
   PORT=3000
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```

### Running the Client
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
