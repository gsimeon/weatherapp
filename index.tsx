/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI, Type} from '@google/genai';
import React, {useState} from 'react';
import ReactDOM from 'react-dom/client';

// Define the structure for our weather data
interface HourlyForecast {
  time: string;
  temperature: string;
  temperatureUnit: string;
  conditions: string;
  precipitationProbability: string;
  precipitationType: string;
}

interface DailyForecast {
    day: string;
    highTemperature: string;
    lowTemperature: string;
    temperatureUnit: string;
    conditions: string;
    precipitationProbability: string;
    precipitationType: string;
}

interface WeatherData {
  city: string;
  temperature: string;
  temperatureUnit: string;
  conditions: string;
  windSpeed: string;
  windDirection: string;
  precipitationProbability: string;
  precipitationType: string;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  error?: string; // Add optional error field
}

// Helper function to map weather conditions to icons
const getWeatherIcon = (condition: string): string => {
  const lowerCaseCondition = condition.toLowerCase();
  if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) {
    return '☀️';
  } else if (lowerCaseCondition.includes('cloud') && lowerCaseCondition.includes('partly')) {
    return '⛅️';
  } else if (lowerCaseCondition.includes('cloud')) {
    return '☁️';
  } else if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('drizzle')) {
    return '🌧️';
  } else if (lowerCaseCondition.includes('thunder') || lowerCaseCondition.includes('storm')) {
    return '⛈️';
  } else if (lowerCaseCondition.includes('snow')) {
    return '❄️';
  } else if (lowerCaseCondition.includes('mist') || lowerCaseCondition.includes('fog')) {
    return '🌫️';
  } else {
    return '🌡️'; // Default icon
  }
};

// Helper function to convert wind speed to Beaufort scale description
const getBeaufortDescription = (speedStr: string): string => {
    const speed = parseInt(speedStr, 10);
    if (isNaN(speed)) return speedStr; // Return original string if not a number

    if (speed <= 1) return 'Calm';
    if (speed <= 3) return 'Light air';
    if (speed <= 7) return 'Light breeze';
    if (speed <= 12) return 'Gentle breeze';
    if (speed <= 18) return 'Moderate breeze';
    if (speed <= 24) return 'Fresh breeze';
    if (speed <= 31) return 'Strong breeze';
    if (speed <= 38) return 'High wind';
    if (speed <= 46) return 'Gale';
    if (speed <= 54) return 'Strong gale';
    return 'Storm';
};

// Helper function to get an icon for wind direction
const getWindDirectionIcon = (direction: string): string => {
    const d = direction.toUpperCase();
    if (d.includes('N')) {
        if (d.includes('E')) return '↗'; // NE
        if (d.includes('W')) return '↖'; // NW
        return '↑'; // N
    }
    if (d.includes('S')) {
        if (d.includes('E')) return '↘'; // SE
        if (d.includes('W')) return '↙'; // SW
        return '↓'; // S
    }
    if (d.includes('E')) return '→'; // E
    if (d.includes('W')) return '←'; // W
    return '↔️'; // Default
};


const WeatherSkeleton = () => (
  <div className="skeleton-loader" aria-label="Loading weather data">
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-icon"></div>
      <div className="skeleton skeleton-temp"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
    </div>
    <div className="skeleton-section">
      <div className="skeleton skeleton-subtitle"></div>
      <div className="skeleton-hourly-scroll">
        <div className="skeleton-hourly-card"></div>
        <div className="skeleton-hourly-card"></div>
        <div className="skeleton-hourly-card"></div>
        <div className="skeleton-hourly-card"></div>
        <div className="skeleton-hourly-card"></div>
      </div>
    </div>
    <div className="skeleton-section">
      <div className="skeleton skeleton-subtitle"></div>
      <div className="skeleton-daily-list">
        <div className="skeleton-daily-item"></div>
        <div className="skeleton-daily-item"></div>
        <div className="skeleton-daily-item"></div>
        <div className="skeleton-daily-item"></div>
      </div>
    </div>
  </div>
);


function App() {
  const [city, setCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) {
      setError('Please enter a city name.');
      return;
    }
    if (!selectedDate) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);
    setWeather(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a weather forecast for ${city} on ${selectedDate}. Include the main conditions for that day (average temperature, dominant condition, wind, etc.), an hourly forecast for that day, and a daily forecast starting from ${selectedDate} for a total of four days. Include temperature units, wind speed in mph, wind direction, precipitation probability, and precipitation type for all relevant sections. If the city is invalid or not found, respond with a JSON object containing only an "error" field with a message like "City not found."`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: {type: Type.STRING},
              temperature: {type: Type.STRING},
              temperatureUnit: { type: Type.STRING, description: "The unit for the temperature, e.g., C or F." },
              conditions: {type: Type.STRING},
              windSpeed: { type: Type.STRING, description: "The current wind speed, e.g., 10 mph." },
              windDirection: { type: Type.STRING, description: "The current wind direction, e.g., NW." },
              precipitationProbability: { type: Type.STRING, description: "The probability of precipitation, e.g., 30%." },
              precipitationType: { type: Type.STRING, description: "The type of precipitation, e.g., Rain, Snow, None." },
              hourlyForecast: {
                type: Type.ARRAY,
                description: "The hourly forecast for the selected date.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    temperature: { type: Type.STRING },
                    temperatureUnit: { type: Type.STRING, description: "The unit for the hourly temperature, e.g., C or F." },
                    conditions: { type: Type.STRING },
                    precipitationProbability: { type: Type.STRING, description: "The probability of precipitation for the hour." },
                    precipitationType: { type: Type.STRING, description: "The type of precipitation for the hour." },
                  },
                  required: ['time', 'temperature', 'temperatureUnit', 'conditions', 'precipitationProbability', 'precipitationType']
                }
              },
              dailyForecast: {
                type: Type.ARRAY,
                description: "The daily forecast for the next four days, starting from the selected date.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING },
                        highTemperature: { type: Type.STRING },
                        lowTemperature: { type: Type.STRING },
                        temperatureUnit: { type: Type.STRING, description: "The unit for the daily temperature, e.g., C or F." },
                        conditions: { type: Type.STRING },
                        precipitationProbability: { type: Type.STRING, description: "The probability of precipitation for the day." },
                        precipitationType: { type: Type.STRING, description: "The type of precipitation for the day." },
                    },
                    required: ['day', 'highTemperature', 'lowTemperature', 'temperatureUnit', 'conditions', 'precipitationProbability', 'precipitationType']
                }
              },
              error: { type: Type.STRING, description: "Error message if the city is not found." }
            },
          },
        },
      });

      let weatherData: WeatherData;
      try {
        weatherData = JSON.parse(response.text);
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError, "Response text:", response.text);
        throw new Error("The weather service returned an invalid response. Please try again.");
      }

      if (weatherData.error) {
        setError(weatherData.error);
      } else if (!weatherData.city) {
        setError(`Could not find weather data for "${city}". Please check the spelling.`);
      } else {
        setWeather(weatherData);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected API error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Weather Predictor</h1>
      <form onSubmit={getWeather} className="weather-form">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter a city..."
          aria-label="City Name"
          disabled={loading}
          required
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          aria-label="Select Date"
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading}>
          Get Weather
        </button>
      </form>
      
      {loading && <WeatherSkeleton />}
      {error && <p className="error">{error}</p>}

      {!loading && weather && (
        <div className="weather-results" aria-live="polite">
          <div className="weather-card">
            <h2>{weather.city}</h2>
            <p className="conditions">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="weather-icon">{getWeatherIcon(weather.conditions)}</div>
            <p className="temperature">{weather.temperature}&deg;{weather.temperatureUnit}</p>
            <p className="conditions">{weather.conditions}</p>
            <p className="wind-info">
              Wind: <span className="wind-arrow">{getWindDirectionIcon(weather.windDirection)}</span> 
              {getBeaufortDescription(weather.windSpeed)} ({weather.windSpeed})
            </p>
            <p className="precipitation-info">
              Precipitation: {weather.precipitationProbability} {weather.precipitationType !== "None" && weather.precipitationType}
            </p>
          </div>

          {weather.hourlyForecast && weather.hourlyForecast.length > 0 && (
            <div className="hourly-forecast">
              <h3>Hourly Forecast</h3>
              <div className="hourly-scroll">
                {weather.hourlyForecast.map((hour, index) => (
                  <div key={index} className="hourly-card">
                    <p className="hourly-time">{hour.time}</p>
                    <div className="hourly-icon">{getWeatherIcon(hour.conditions)}</div>
                    <p className="hourly-temp">{hour.temperature}&deg;{hour.temperatureUnit}</p>
                    <p className="hourly-conditions">{hour.conditions}</p>
                    <p className="hourly-precipitation">
                      {hour.precipitationProbability} {hour.precipitationType !== "None" && hour.precipitationType}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weather.dailyForecast && weather.dailyForecast.length > 0 && (
            <div className="daily-forecast">
                <h3>Daily Forecast</h3>
                <div className="daily-list">
                    {weather.dailyForecast.map((day, index) => (
                        <div key={index} className="daily-card">
                            <div className="daily-left">
                              <div className="daily-icon">{getWeatherIcon(day.conditions)}</div>
                              <div className="daily-info">
                                  <p className="daily-day">{day.day}</p>
                                  <p className="daily-conditions">{day.conditions}</p>
                                  <p className="daily-precipitation">
                                    Precip: {day.precipitationProbability} {day.precipitationType !== "None" && day.precipitationType}
                                  </p>
                              </div>
                            </div>
                            <p className="daily-temp">
                                {day.highTemperature}&deg; / {day.lowTemperature}&deg;{day.temperatureUnit}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Oops! Something went wrong.</h2>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
