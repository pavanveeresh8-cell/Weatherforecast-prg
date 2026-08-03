// Ensure this API key is active. It can take up to 2 hours for a new key to work.
const apiKey = '88574f16da6350c8300ac3c84738246e';

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityinput").value.trim();
    if (city) {
        fetchWeatherAndForecast(`q=${city}`);
    } else {
        getLocationWeather();
    }
});

document.getElementById("locateBtn").addEventListener("click", getLocationWeather);

window.onload = () => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) document.body.classList.add("dark");
    updateThemeIcon();

    const lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
        fetchWeatherAndForecast(`q=${lastCity}`);
    } else {
        getLocationWeather();
    }
};

function updateThemeIcon() {
    const btn = document.getElementById("themeToggle");
    btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", isDark);
    updateThemeIcon();
});

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            // Fetch by coordinates to bypass city name errors
            fetchWeatherAndForecast(`lat=${latitude}&lon=${longitude}`);
        }, () => alert("Location access denied. Please search manually."));
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Main Fetch Logic
function fetchWeatherAndForecast(query) {
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${apiKey}`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?${query}&units=metric&appid=${apiKey}`;

    fetch(weatherURL)
        .then(response => {
            if (response.status === 401) throw new Error("API Key is invalid or not activated yet.");
            if (response.status === 404) throw new Error("Location not found.");
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const main = data.weather[0].main;
            document.getElementById("cityName").innerText = data.name;
            document.getElementById("temp").innerText = `🌡️ Temp: ${data.main.temp}°C`;
            document.getElementById("condition").innerText = `☁️ Condition: ${data.weather[0].description}`;
            document.getElementById("humidity").innerText = `💧 Humidity: ${data.main.humidity}%`;
            document.getElementById("wind").innerText = `💨 Wind: ${data.wind.speed} m/s`;
            document.body.style.background = pickBackground(main);
            setWeatherIcon(main);

            // Save valid city searches, clear input field
            if (query.startsWith('q=')) {
                localStorage.setItem("lastCity", data.name);
            }
            document.getElementById("cityinput").value = "";

            // Chain the forecast fetch to ensure weather succeeds first
            return fetch(forecastURL);
        })
        .then(res => res.json())
        .then(data => {
            const forecastEl = document.getElementById("forecast");
            forecastEl.innerHTML = "";
            const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
            
            daily.slice(0, 5).forEach(day => {
                const date = new Date(day.dt_txt);
                const iconMap = {
                    Clear: "wi-day-sunny",
                    Clouds: "wi-cloudy",
                    Rain: "wi-rain",
                    Snow: "wi-snow",
                    Thunderstorm: "wi-thunderstorm",
                    Drizzle: "wi-sprinkle",
                    Mist: "wi-fog"
                };
                const iconClass = iconMap[day.weather[0].main] || "wi-na";
                const html = `
                <div class="forecast-day">
                    <p><strong>${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong></p>
                    <i class="wi ${iconClass}" style="font-size:32px;"></i>
                    <p>🌡️ ${day.main.temp.toFixed(1)}°C</p>
                    <p>☁️ ${day.weather[0].description}</p>
                    <p>💧 ${day.main.humidity}%</p>
                </div>`;
                forecastEl.innerHTML += html;
            });
        })
        .catch(err => {
            alert(err.message);
            if (query.startsWith('q=')) localStorage.removeItem("lastCity");
        });
}

function pickBackground(condition) {
    switch (condition) {
        case "Clear": return "linear-gradient(to right, #f9d423, #ff4e50)";
        case "Clouds": return "linear-gradient(to right, #bdc3c7, #2c3e50)";
        case "Rain": return "linear-gradient(to right, #00c6ff, #0072ff)";
        case "Snow": return "linear-gradient(to right, #83a4d4, #b6fbff)";
        case "Thunderstorm": return "linear-gradient(to right, #141E30, #243B55)";
        default: return "linear-gradient(to right, #89f7fe, #66a6ff)";
    }
}

function setWeatherIcon(condition) {
    const icon = document.getElementById("weathericon");
    const map = {
        Clear: "wi-day-sunny",
        Clouds: "wi-cloudy",
        Rain: "wi-rain",
        Snow: "wi-snow",
        Thunderstorm: "wi-thunderstorm",
        Drizzle: "wi-sprinkle",
        Mist: "wi-fog"
    };
    icon.className = `wi ${map[condition] || "wi-na"}`;
}