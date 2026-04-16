const express = require("express");
const axios = require("axios");
const Weather = require("../models/Weather");

const router = express.Router();
const PDFDocument = require('pdfkit');

const WMO_CODES = {
  0:  "Clear Sky",
  1:  "Mainly Clear",
  2:  "Partly Cloudy",
  3:  "Overcast",
  45: "Foggy",
  48: "Icy Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm + Hail",
  99: "Thunderstorm + Hail",
};


// CREATE 
router.post("/", async (req, res) => {
  try {
    const { location, startDate, endDate } = req.body;
    
    //data validatoin
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(400).json({ error: "Start date must be before end date" });
      }
    }
    //location validation
    if (!location || !location.trim()) {
      return res.status(400).json({ error: "Location is required" });
    }

    let lat, lon, name, country;

    // Detect coordinates
    const match = location.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);

    if (match) {
      lat = parseFloat(match[1]);
      lon = parseFloat(match[3]);

      name = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
      country = "Unknown";
    } else {
      const geoRes = await axios.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        {
          params: {
            name: location,
            count: 1,
            language: "en",
          },
        }
      );

      const result = geoRes.data.results?.[0];

      if (!result) {
        return res.status(404).json({ error: "Location not found" });
      }

      lat = result.latitude;
      lon = result.longitude;
      name = result.name;
      country = result.country;
    }

    const weatherRes = await axios.get(
      "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          latitude: lat,
          longitude: lon,
          current:
            "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weathercode,surface_pressure,visibility",
          daily:
            "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
          forecast_days: 5,
          timezone: "auto",
        },
      }
    );

    const { current, daily } = weatherRes.data;

    let filteredDaily = daily;

if (startDate && endDate) {
  const filteredIndexes = daily.time
    .map((date, i) => ({ date, i }))
    .filter(({ date }) => date >= startDate && date <= endDate)
    .map(({ i }) => i);

  filteredDaily = {
    ...daily,
    time: filteredIndexes.map(i => daily.time[i]),
    weathercode: filteredIndexes.map(i => daily.weathercode[i]),
    temperature_2m_max: filteredIndexes.map(i => daily.temperature_2m_max[i]),
    temperature_2m_min: filteredIndexes.map(i => daily.temperature_2m_min[i]),
    precipitation_probability_max: filteredIndexes.map(i => daily.precipitation_probability_max[i]),
    uv_index_max: filteredIndexes.map(i => daily.uv_index_max[i]),
  };
}
      await Weather.create({
      location: name,
      startDate: startDate || null,
      endDate: endDate || null,
      temperature: current.temperature_2m,
      condition: String(current.weathercode),
      date: new Date()
    });

    res.json({
      location: { name, country },
      current,
      daily: filteredDaily,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

// READ 
router.get("/", async (req, res) => {
  try {
    const data = await Weather.find().sort({ date: -1 });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE (optional)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Weather.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Weather.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

//  EXPORT  
router.get("/export", async (req, res) => {
  try {
    const data = await Weather.find().sort({ createdAt: -1 });
    const format = req.query.format || 'csv';

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=weather-history.pdf');
      doc.pipe(res);
    
      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Weather History Report', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown(1.2);
    
      // Table column definitions
      const columns = [
        { label: 'Location', width: 150 },
        { label: 'Temperature', width: 90 },
        { label: 'Condition', width: 100 },
        { label: 'Date Range', width: 140 },
        { label: 'Created', width: 90 }
      ];
    
      const startX = 40;
      let y = doc.y + 10;
      const rowHeight = 22;
    
      // Draw table header
      doc.rect(startX, y, 570, rowHeight).fill('#e5e7eb');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11);
    
      let x = startX + 8;
      columns.forEach(col => {
        doc.text(col.label, x, y + 6, { width: col.width });
        x += col.width;
      });
    
      y += rowHeight;
    
      // Reset font
      doc.font('Helvetica').fontSize(10);
    
      // Draw rows
      data.forEach((record, i) => {
        // Page break
        if (y > 760) {
          doc.addPage();
          y = 40;
        }
    
        // Alternating row color
        doc.fillColor(i % 2 ? '#f9fafb' : '#ffffff')
           .rect(startX, y, 570, rowHeight)
           .fill();
    
        doc.fillColor('#111827');
    
        let x = startX + 8;
    
        const range = record.startDate || record.endDate
          ? `${record.startDate ? new Date(record.startDate).toLocaleDateString() : ''} - ${record.endDate ? new Date(record.endDate).toLocaleDateString() : ''}`
          : '-';
    
          const created = record.date;

          const rowValues = [
            (record.location || 'N/A'),
            record.temperature ? `${record.temperature.toFixed(1)}°C` : 'N/A',
            WMO_CODES[record.condition] || record.condition,
            range,
            created ? new Date(created).toLocaleDateString() : 'N/A'
          ];
          
    
        rowValues.forEach((val, idx) => {
          doc.text(String(val), x, y + 6, { width: columns[idx].width });
          x += columns[idx].width;
        });
    
        y += rowHeight;
      });
    
      // Footer
      doc.fillColor('#6b7280')
         .fontSize(9)
         .text(`Total Records: ${data.length} | PM Accelerator Technical Assessment`,
               startX, 800, { width: 570, align: 'center' });
    
      doc.end();
    }
    else {
      // CSV (unchanged)
      const header = "location,temperature,condition,startDate,endDate,createdAt\n";
      const rows = data.map(d => 
        `"${d.location}",${d.temperature},"${d.condition}","${d.startDate}","${d.endDate}",${d.createdAt}`
      );
      const csv = header + rows.join("\n");
      res.header("Content-Type", "text/csv");
      res.attachment("weather-history.csv");
      res.send(csv);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
});

module.exports = router;