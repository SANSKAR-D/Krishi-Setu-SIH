const axios = require('axios');

// Helper to simulate slight variations in soil metrics
const generateSimulatedSoilData = () => {
  const baseMoisture = 40;
  const basePh = 6.5;
  const baseTemp = 22;

  // Add random variation
  const moisture = Math.floor(baseMoisture + (Math.random() * 10 - 5)); // 35 to 45
  const ph = (basePh + (Math.random() * 0.4 - 0.2)).toFixed(1); // 6.3 to 6.7
  const temperature = Math.floor(baseTemp + (Math.random() * 6 - 3)); // 19 to 25

  return {
    moisture,
    ph: parseFloat(ph),
    nitrogen: moisture < 40 ? "Low" : "Optimal",
    phosphorus: "Optimal",
    potassium: "Optimal",
    temperature,
  };
};

const getDashboardData = async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const location = process.env.DEFAULT_LOCATION || "Delhi,IN";

    let weatherData = null;
    let weatherCondition = "Sunny"; // default

    if (apiKey && apiKey !== "your_openweather_api_key") {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&cnt=5&appid=${apiKey}`;
        const response = await axios.get(weatherUrl);
        weatherData = response.data.list.map(item => ({
          date: item.dt_txt,
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main
        }));
        weatherCondition = weatherData[0].condition;
      } catch (weatherErr) {
        console.error("Error fetching weather:", weatherErr.message);
      }
    }

    const soilMetrics = generateSimulatedSoilData();
    soilMetrics.weather_condition = weatherCondition;

    // Fetch AI advisories
    let aiAdvisories = [];
    try {
      const aiResponse = await axios.post("http://localhost:8000/analyze-soil", soilMetrics);
      aiAdvisories = aiResponse.data.advisories || [];
    } catch (aiErr) {
      console.error("Error fetching AI advisories:", aiErr.message);
    }

    res.json({
      success: true,
      data: {
        soil_metrics: soilMetrics,
        weather_forecast: weatherData,
        ai_advisories: aiAdvisories
      }
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

module.exports = { getDashboardData };
