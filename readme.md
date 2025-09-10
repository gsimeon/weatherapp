# Weather Predictor App

A modern, responsive, and visually appealing weather application that provides current weather conditions, hourly forecasts, and daily forecasts for any city. This app leverages the power of the Google Gemini API to generate structured weather data from a natural language prompt.

## Features

- **Current Weather:** Get real-time data including temperature, conditions, wind speed, wind direction, and precipitation probability.
- **Hourly Forecast:** A horizontally scrollable view of the weather for the next few hours.
- **Daily Forecast:** A multi-day forecast showing high/low temperatures and expected conditions.
- **Dynamic Icons:** Visual emoji icons for weather conditions make the UI scannable and user-friendly.
- **Human-Readable Data:**
    - Wind speed is converted to the Beaufort scale (e.g., "Gentle breeze").
    - Wind direction is shown with a clear arrow icon.
- **Sleek UI/UX:**
    - Clean, modern design with a glassmorphism effect.
    - A visual skeleton loader mimics the content layout for a smooth loading experience.
- **Robust Error Handling:**
    - Displays specific error messages (e.g., "City not found," "API error").
    - An Error Boundary is implemented to prevent the entire app from crashing due to JavaScript errors.
- **Responsive Design:** Looks great on both desktop and mobile devices.

## Tech Stack

- **Frontend:** React with TypeScript
- **AI Model:** Google Gemini API (`@google/genai`)
- **Styling:** CSS3 (with Flexbox for layout)
- **Module System:** ES Modules with `importmap` (no build step required)

## How It Works

1.  **User Input:** The user enters a city name into the input field.
2.  **API Call:** The application sends a request to the Gemini API (`gemini-2.5-flash` model).
3.  **Structured Prompting:** The prompt is carefully crafted to ask for detailed weather information. Crucially, it includes a `responseSchema` which forces the Gemini model to return the data in a predictable JSON format.
4.  **Error Handling in Prompt:** The prompt also instructs the model to return a specific JSON object with an `error` field if the city cannot be found, allowing for more intelligent error handling on the client side.
5.  **Data Parsing & State Update:** The app parses the JSON response from the API.
6.  **Rendering:** The React components update with the new weather data, displaying it in a structured and visually appealing format. If the API returns an error or data fetching is in progress, the UI displays the appropriate message or skeleton loader.

## File Structure

```
.
├── index.html      # Main HTML entry point, contains the importmap and root div.
├── index.css       # All CSS styles for the application.
├── index.tsx       # The core React application logic, components, state management, and API calls.
├── metadata.json   # Project metadata.
└── readme.md       # This documentation file.
```

This project is set up to run directly in a browser that supports ES modules, without needing a separate build step like Webpack or Vite.
