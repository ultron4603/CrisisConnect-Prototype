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

// OpenWeatherMap API Key (This is a free, public key for now)
const OPENWEATHER_API_KEY = '30d4741c779ba94c470ca1f63045390a'; 

// --- Initialize Services ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// --- Map Initialization ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12', // More detailed map
    center: [85.8245, 20.2961], // Centered on Bhubaneswar
    zoom: 10
});

// --- App State ---
let currentUser = null;

// --- DOM Elements ---
const signinBtn = document.getElementById('signin-btn');
const userPic = document.getElementById('user-pic');
const sosBtn = document.getElementById('sos-btn');
const offerHelpBtn = document.getElementById('offer-help-btn');
const emergencyBtn = document.getElementById('emergency-btn');
const emergencyPanel = document.getElementById('emergency-panel');

// --- Core App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Authentication
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            signinBtn.style.display = 'none';
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            sosBtn.classList.remove('hidden');
            offerHelpBtn.classList.remove('hidden');
        } else {
            // Show signin button prominently if not logged in
            signinBtn.style.display = 'block';
            userPic.classList.add('hidden');
            sosBtn.classList.add('hidden');
            offerHelpBtn.classList.add('hidden');
        }
    });

    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut(); } });
    
    // Emergency Panel Logic
    emergencyBtn.addEventListener('click', () => {
        emergencyPanel.classList.toggle('hidden');
    });

    // Fetch and display weather
    updateWeather();
});


// --- Weather Widget Functionality ---
function updateWeather() {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;

        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                const weatherIconEl = document.getElementById('weather-icon');
                const weatherTempEl = document.getElementById('weather-temp');
                const weatherDescEl = document.getElementById('weather-desc');

                weatherTempEl.textContent = `${Math.round(data.main.temp)}°C`;
                weatherDescEl.textContent = data.weather[0].main;
                weatherIconEl.textContent = getWeatherIcon(data.weather[0].id);
                
                document.getElementById('weather-widget').classList.remove('hidden');
            })
            .catch(error => console.error("Error fetching weather:", error));
    });
}

function getWeatherIcon(weatherId) {
    if (weatherId >= 200 && weatherId < 300) return '⛈️'; // Thunderstorm
    if (weatherId >= 300 && weatherId < 500) return '🌧️'; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return '🌧️'; // Rain
    if (weatherId >= 600 && weatherId < 700) return '❄️'; // Snow
    if (weatherId >= 700 && weatherId < 800) return '🌫️'; // Atmosphere (Fog, Mist, etc.)
    if (weatherId === 800) return '☀️'; // Clear
    if (weatherId > 800) return '☁️'; // Clouds
    return '🤔';
}
