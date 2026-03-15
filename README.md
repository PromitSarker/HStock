# HomeoStock - Simple Inventory Management

A lightweight web application for managing medicine company product stock, deliveries, and employees. Built with Vanilla HTML, CSS, and JavaScript.

## How to Run

Since this is a static web application, you have a few options to run it:

### 1. Simple Open (No installation)
Double-click the `index.html` file in your file manager or open it directly in your browser:
```bash
# On Linux
xdg-open index.html
```

### 2. Local Development Server (Recommended)
Running a local server is better for handling file paths and potential CORS issues. You can use any of the following:

**Using Python:**
```bash
python3 -m http.server 8000
```
Then visit: `http://localhost:8000`

**Using Node.js (npx):**
```bash
npx serve .
```
Then visit: `http://localhost:3000`

## Configuration

The application supports optional cloud synchronization via **Supabase**. To configure it:
1. Open the application.
2. Navigate to the **Settings** tab.
3. Enter your Supabase URL and API Key.

If no configuration is provided, the application will store data locally in your browser's `localStorage`.
