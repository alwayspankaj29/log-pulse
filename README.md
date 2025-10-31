# log-pulse
Smart Log Analyser
BrowserStack Hackathon 2025

# How to Run the Node App on macOS

This guide will help you set up and run a LogPulse Node.js application with Express on macOS.

---

## Prerequisites

- **Node.js** and **npm** installed  
  - Install via [Homebrew](https://brew.sh/):
    ```sh
    brew install node
    ```
  - Or download from [nodejs.org](https://nodejs.org/).

---

## Steps to Run the App

### 1. Clone or Download the Repository

```sh
git clone https://github.com/alwayspankaj29/log-pulse.git
cd log-pulse
```

Or, if you've already created the project directory:

```sh
cd log-pulse
```

---

### 2. Install Dependencies

```sh
npm install
```

---

### 3. Start the Server

```sh
npm start
```

The application will start on [http://localhost:3000](http://localhost:3000).

---

### 4. Verify the Server

Open your browser and go to:

```
http://localhost:3000
```

You should see:

```
Bhai, Logs!
```

---

## Project Structure

```
my-node-app/
├── index.js
├── package.json
└── README.md
```

---

## Troubleshooting

- If you see an error about "command not found: node" or "npm", ensure Node.js is installed and available in your PATH.
- To check your Node.js and npm versions:
  ```sh
  node -v
  npm -v
  ```

---

## Useful Commands

- **Install dependencies:**  
  `npm install`
- **Start the app:**  
  `npm start`

---

## License

This project is open source and available under the [MIT License](LICENSE).
