# 🌦️ Weather App – Interactive Weather Forecasting Web Application  
**Product Manager Accelerator Technical Assessment**

**Weather App** is a modern, responsive, and interactive web application that provides **real-time weather data, dynamic visual effects, and user-friendly forecasting tools**.

The application combines a **React frontend**, a **Node.js/Express backend**, and the **Open-Meteo API** to deliver accurate weather insights with a visually engaging experience. It emphasizes **usability, responsiveness, clean UI design, and real-world product thinking**, simulating a **production-ready weather platform**.

---

## 👩‍💻 Author
| GitHub Username | Full Name      |
|-----------------|---------------|
| @nicoledesigns  | **Nicole Antoun** |

---

## ✨ Key Features

### 🌍 **Location-Based Weather Search**
- Search weather by:
  - **City name**  
  - **Postal code**  
  - **Geographic coordinates**  
- **Fast and responsive** query handling  
- Clean UI with **real-time updates**

---

### 📍 **Current Location Detection**
- Automatically fetch weather using **device geolocation**  
- Provides **instant local weather conditions**

---

### 🌦️ **Real-Time Weather Data**
- Powered by **Open-Meteo API**  
- Displays:
  - **Temperature**
  - **Wind speed**
  - **Weather conditions**

---

### 📊 **5-Day Forecast**
- Displays a **5-day forecast**
- Organized in a **clear and user-friendly layout**

---

### ⚠️ **Error Handling**
- Handles:
  - Invalid locations
  - API failures
- Displays **clear user-friendly messages**

---

### 📜 **Search History (CRUD)**
- Stores previous searches  
- Allows users to:
  - **Create** entries  
  - **Read** history  
  - **Delete** records  

---

### 📤 **Data Export**
- Export data as:
  - **CSV**
  - **PDF**

---

## 🧠 System Overview

- **Frontend (React)** → UI, animations, interaction  
- **Backend (Node.js / Express)** → API, CRUD, data handling  
- **External APIs** → Open-Meteo  

---

## ⚙️ Requirements

- **Node.js (v16+)**
- **npm**
- Create your .env file in the backend folder with:
   ```bash
   PORT=5050
   MONGO_URI= URL
   API_KEY= YOUR_API_KEY
---

## 📦 Dependencies

All project dependencies are managed through `package.json`.

---

## Running the Application

1. **Open two terminal windows**:
   - One for the frontend  
   - One for the backend  

2. **Backend Setup** (in the backend terminal):
   ```bash
   cd backend
   node server.js
3. **Frontend Setup** (in the frontend terminal):
   ```bash
   cd frontend
   npm run dev
4. **Access the App**
Frontend:
http://localhost:5173

Backend:
http://localhost:5050

### 📸 Demo Video

🎥 https://drive.google.com/file/d/1whvDi1ZEV0GmMICCAwwMu4-cT0T-d8Xe/view?usp=drive_link

### 📄 License

This project is for educational and assessment purposes only.
