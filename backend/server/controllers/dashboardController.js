const axios = require('axios');

// ─── 30-minute location-aware cache for AI advisories ───
const advisoryCache = {};
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes in ms



// Helper to fetch and cache soil/weather data
const getSoilAndWeatherData = async (lat, lon) => {
  let weatherData = null;
  let weatherCondition = null;
  let soilMoisture = null; 

  let airTemp = null; 

  // Open-Meteo
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current=temperature_2m,weathercode,soil_moisture_0_to_7cm&forecast_days=7&timezone=auto`;
    const meteoRes = await axios.get(meteoUrl, { timeout: 10000 });
    
    const current = meteoRes.data.current;
    const daily = meteoRes.data.daily;

    const getWeatherString = (code) => {
      if (code === null || code === undefined) return "Clear";
      if (code <= 3) return "Sunny";
      if (code <= 48) return "Cloudy";
      if (code <= 67) return "Rainy";
      if (code <= 77) return "Snow";
      if (code <= 99) return "Stormy";
      return "Clear";
    };

    weatherCondition = getWeatherString(current.weathercode);
    airTemp = Math.round(current.temperature_2m);
    
    if (current.soil_moisture_0_to_7cm !== undefined && current.soil_moisture_0_to_7cm !== null) {
      soilMoisture = Math.round(current.soil_moisture_0_to_7cm * 100);
    }

    if (daily && daily.time) {
      weatherData = daily.time.slice(0, 7).map((date, index) => ({
        date: date,
        temp_max: Math.round(daily.temperature_2m_max[index]),
        temp_min: Math.round(daily.temperature_2m_min[index]),
        temp: Math.round((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
        condition: getWeatherString(daily.weathercode[index])
      }));
    }
  } catch (err) {
    console.error("Open-Meteo fetch error:", err.message);
    weatherData = []; // ensure array not null
  }

  // SoilGrids
  let soilPh = null; 
  let nitrogenLevel = null; 
  
  try {
    const isricUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=nitrogen&depth=0-5cm&value=mean`;
    const isricRes = await axios.get(isricUrl, { timeout: 8000 }); // added timeout for chat responsiveness
    
    const layers = isricRes.data.properties.layers;
    layers.forEach(layer => {
      const value = layer.depths[0].values.mean; 
      if (value !== null && value !== undefined) {
        if (layer.name === 'phh2o') {
          soilPh = (value / 10).toFixed(1);
        } else if (layer.name === 'nitrogen') {
          if (value < 200) nitrogenLevel = "Low";
          else if (value < 400) nitrogenLevel = "Medium";
          else if (value < 600) nitrogenLevel = "Optimal";
          else nitrogenLevel = "High";
        }
      }
    });
  } catch (err) {
    console.error("SoilGrids fetch error:", err.message);
  }

  const soilMetrics = {
    moisture: soilMoisture,
    ph: soilPh !== null ? parseFloat(soilPh) : null,
    nitrogen: nitrogenLevel,
    phosphorus: null,
    potassium: null,
    temperature: airTemp,
    weather_condition: weatherCondition
  };

  return { soilMetrics, weatherData };
};

const getDashboardSoilData = async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 28.6139;
    const lon = req.query.lon ? parseFloat(req.query.lon) : 77.2090;

    const { soilMetrics } = await getSoilAndWeatherData(lat, lon);

    res.json({
      success: true,
      data: {
        soil_metrics: soilMetrics
      }
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard soil data" });
  }
};

const getDashboardAdvisories = async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 28.6139;
    const lon = req.query.lon ? parseFloat(req.query.lon) : 77.2090;
    const { soilMetrics } = await getSoilAndWeatherData(lat, lon);

    let aiAdvisories = [];
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const now = Date.now();

    if (advisoryCache[cacheKey] && (now - advisoryCache[cacheKey].timestamp) < CACHE_TTL) {
      aiAdvisories = advisoryCache[cacheKey].data;
      console.log(`📋 Advisories served from cache for location ${cacheKey}`);
    } else {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

        const prompt = `
        You are an expert agricultural AI. Based on the following REAL-WORLD satellite data for the farmer's location, 
        provide 2 to 3 short, actionable advisories.
        
        Soil Data:
        Topsoil Moisture: ${soilMetrics.moisture !== null ? soilMetrics.moisture + '%' : 'N/A'}
        pH: ${soilMetrics.ph !== null ? soilMetrics.ph : 'N/A'}
        Nitrogen: ${soilMetrics.nitrogen !== null ? soilMetrics.nitrogen : 'N/A'}
        Phosphorus: N/A
        Potassium: N/A
        
        Weather Data:
        Air Temperature: ${soilMetrics.temperature !== null ? soilMetrics.temperature + '°C' : 'N/A'}
        Current Weather: ${soilMetrics.weather_condition !== null ? soilMetrics.weather_condition : 'N/A'}
        
        Reply ONLY with a JSON array of objects. Each object must have:
        "title" (string, short e.g. "Water Crops Today"),
        "description" (string, 1 short sentence),
        "severity" (string, either "critical", "warning", or "info").
        `;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        aiAdvisories = JSON.parse(aiResponse.text.trim());

        advisoryCache[cacheKey] = {
          data: aiAdvisories,
          timestamp: now
        };
        console.log(`🤖 Fresh AI Advisories generated and cached for ${cacheKey}`);
      } catch (aiErr) {
        console.error("Gemini advisory error:", aiErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        ai_advisories: aiAdvisories
      }
    });

  } catch (err) {
    console.error("Dashboard AI error:", err);
    res.status(500).json({ error: "Failed to fetch AI advisories" });
  }
};

module.exports = { getDashboardSoilData, getDashboardAdvisories, getSoilAndWeatherData };

