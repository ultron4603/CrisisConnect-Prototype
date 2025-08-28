// --- V2 Configurations ---
const firebaseConfig = {
  apiKey: "AIzaSyDnRUIDKoANI3GJ_hyRf4VEmUcIXZceDTE",
  authDomain: "crisisconnect-application.firebaseapp.com",
  databaseURL: "https://crisisconnect-application-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crisisconnect-application",
  storageBucket: "crisisconnect-application.firebasestorage.app",
  messagingSenderId: "438935321367",
  appId: "1:438935321367:web:9cc201bc83a7ed2d775552"
};

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const OPENWEATHER_API_KEY = '30d4741c779ba94c470ca1f63045390a'; 

// --- Initialize Services ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// --- DOM Elements ---
const signinBtn = document.getElementById('signin-btn');
const userPic = document.getElementById('user-pic');
const sosBtn = document.getElementById('sos-btn');
const offerHelpBtn = document.getElementById('offer-help-btn');
const emergencyBtn = document.getElementById('emergency-btn');
const emergencyPanel = document.getElementById('emergency-panel');

// --- Map Initialization ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [85.8245, 20.2961],
    zoom: 10
});

map.on('load', () => {
    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        if (user) {
            signinBtn.style.display = 'none';
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            sosBtn.classList.remove('hidden');
            offerHelpBtn.classList.remove('hidden');
            updateWeather(user);
        } else {
            signinBtn.style.display = 'block';
            userPic.classList.add('hidden');
            sosBtn.classList.add('hidden');
            offerHelpBtn.classList.add('hidden');
            document.getElementById('weather-widget').classList.add('hidden');
        }
    });

    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut(); } });
    
    // --- UI Interactions ---
    emergencyBtn.addEventListener('click', () => {
        emergencyPanel.classList.remove('hidden');
    });
    
    emergencyPanel.querySelector('.cancel-btn').addEventListener('click', () => {
        emergencyPanel.classList.add('hidden');
    });
});

// --- Weather Widget ---
function updateWeather() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        
        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
                document.getElementById('weather-desc').textContent = data.weather[0].main;
                document.getElementById('weather-icon').textContent = getWeatherIcon(data.weather[0].id);
                document.getElementById('weather-widget').classList.remove('hidden');
            }).catch(error => console.error("Error fetching weather:", error));
    }, () => console.log("Could not get location for weather."));
}

function getWeatherIcon(weatherId) {
    if (weatherId < 300) return '⛈️'; // Thunderstorm
    if (weatherId < 600) return '🌧️'; // Rain/Drizzle
    if (weatherId < 700) return '❄️'; // Snow
    if (weatherId < 800) return '🌫️'; // Atmosphere
    if (weatherId === 800) return '☀️'; // Clear
    if (weatherId > 800) return '☁️'; // Clouds
    return '🌍';
}
