// --- V2 Configurations ---
const firebaseConfig = { apiKey: "AIzaSyDnRUIDKoANI3GJ_hyRf4VEmUcIXZceDTE", authDomain: "crisisconnect-application.firebaseapp.com", databaseURL: "https://crisisconnect-application-default-rtdb.asia-southeast1.firebasedatabase.app", projectId: "crisisconnect-application", storageBucket: "crisisconnect-application.firebasestorage.app", messagingSenderId: "438935321367", appId: "1:438935321367:web:9cc201bc83a7ed2d775552" };
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const OPENWEATHER_API_KEY = '30d4741c779ba94c470ca1f63045390a'; 

// --- Initialize Services ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// --- Map Initialization ---
const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [85.8245, 20.2961], zoom: 10 });

// --- App State ---
let currentUser = null;

// --- Main Logic ---
map.on('load', () => {
    // Get all DOM elements
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');
    const sosBtn = document.getElementById('sos-btn');
    const offerHelpBtn = document.getElementById('offer-help-btn');
    const emergencyBtn = document.getElementById('emergency-btn');
    const mapStyleBtn = document.getElementById('map-style-btn');
    const inboxBtn = document.getElementById('inbox-btn');

    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            signinBtn.style.display = 'none';
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            sosBtn.classList.remove('hidden');
            offerHelpBtn.classList.remove('hidden');
            inboxBtn.classList.remove('hidden');
            updateWeather(); // Fetch weather after user logs in
        } else {
            signinBtn.style.display = 'block';
            userPic.classList.add('hidden');
            sosBtn.classList.add('hidden');
            offerHelpBtn.classList.add('hidden');
            inboxBtn.classList.add('hidden');
            document.getElementById('weather-widget').classList.add('hidden');
        }
    });

    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut().then(() => window.location.reload()); } });
    
    // --- UI Interactions ---
    emergencyBtn.addEventListener('click', () => {
        hideAllPanels();
        document.getElementById('emergency-panel').classList.remove('hidden');
    });

    mapStyleBtn.addEventListener('click', () => {
        const currentStyle = map.getStyle().name;
        if (currentStyle.includes('Satellite')) {
            map.setStyle('mapbox://styles/mapbox/outdoors-v12');
            mapStyleBtn.innerHTML = '🛰️';
        } else {
            map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
            mapStyleBtn.innerHTML = '🗺️';
        }
    });

    // ... (Add back other panel button listeners here if they are missing)
    sosBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    offerHelpBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.panel').classList.add('hidden')));
});


// --- Helper Functions ---
function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
}

// --- Weather Widget Functionality (IMPROVED) ---
function updateWeather() {
    const weatherWidget = document.getElementById('weather-widget');
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported.");
        weatherWidget.innerHTML = "<span>Location not supported</span>";
        weatherWidget.classList.remove('hidden');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;

            fetch(weatherUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Weather data not available');
                    return response.json();
                })
                .then(data => {
                    document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
                    document.getElementById('weather-desc').textContent = data.weather[0].main;
                    document.getElementById('weather-icon').textContent = getWeatherIcon(data.weather[0].id);
                    weatherWidget.classList.remove('hidden');
                })
                .catch(error => {
                    console.error("Error fetching weather:", error);
                    weatherWidget.innerHTML = `<span>Weather unavailable</span>`;
                    weatherWidget.classList.remove('hidden');
                });
        },
        (error) => {
            console.error(`Geolocation error: ${error.message}`);
            // Display a user-friendly alert
            alert("Could not get your location for the weather forecast. Please ensure you have allowed location access for this site in your browser settings.");
            weatherWidget.innerHTML = `<span>Location access denied</span>`;
            weatherWidget.classList.remove('hidden');
        }
    );
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
// (All other functions for chat, pins, etc. should be here as well)
