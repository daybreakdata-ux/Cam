# Cam Project

This project is a web application for discovering and managing camera devices. It provides a user-friendly interface for interacting with cameras, retrieving snapshots, and exporting configuration files.

## Project Structure

```
Cam
├── api
│   ├── discover.js        # API endpoint for discovering cameras
│   └── snapshot.js        # API endpoint for retrieving camera snapshots
├── public
│   ├── index.html         # Main HTML file for the web application
│   ├── app.js             # Client-side JavaScript for managing interactions
│   └── style.css          # Styles for the web application
├── package.json           # npm configuration file
├── vercel.json            # Vercel deployment configuration
├── .vercelignore          # Files to ignore during deployment
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/daybreakdata-ux/Cam.git
   cd Cam
   ```

2. **Install Dependencies**
   Make sure you have Node.js installed. Then run:
   ```bash
   npm install
   ```

3. **Run the Application**
   You can start the application locally using:
   ```bash
   npm start
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000` to access the application.

## Usage

- Enter your camera credentials in the provided fields and click the "Discover" button to find available cameras.
- Click on a camera to view its details, copy the RTSP URL, or download its configuration.
- Use the export options to download configurations for various platforms like Blue Iris, Frigate, and Home Assistant.

## Deployment

This project is configured for deployment on Vercel. To deploy, simply push your changes to the `main` branch, and Vercel will automatically build and deploy the application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.