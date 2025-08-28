// --- V2 Configurations ---
const firebaseConfig = { apiKey: "AIzaSyDnRUIDKoANI3GJ_hyRf4VEmUcIXZceDTE", authDomain: "crisisconnect-application.firebaseapp.com", databaseURL: "https://crisisconnect-application-default-rtdb.asia-southeast1.firebasedatabase.app", projectId: "crisisconnect-application", storageBucket: "crisisconnect-application.firebasestorage.app", messagingSenderId: "438935321367", appId: "1:438935321367:web:9cc201bc83a7ed2d775552" };
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const OPENWEATHER_API_KEY = '523b9642cbc6302e87135954e076db46'; // Your new key

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
            updateWeather();
        } else {
            signinBtn.style.display = 'block';
            userPic.classList.add('hidden');
            sosBtn.classList.add('hidden');
            offerHelpBtn.classList.add('hidden');
            inboxBtn.classList.add('hidden');
            document.getElementById('weather-widget').classList.add('hidden');
        }
    });

    signinBtn.addEventListener('click', () => {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(error => {
            console.error("Sign-in error", error);
            alert("Could not sign in. Please try again.");
        });
    });
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut(); } });
    
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

    sosBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    offerHelpBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.panel').classList.add('hidden')));
});


// --- Helper Functions ---
function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
}

// --- Weather Widget ---
function updateWeather() {
    const weatherWidget = document.getElementById('weather-widget');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;

            fetch(weatherUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.cod !== 200) throw new Error(data.message);
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
            alert("Could not get your location for the weather forecast. Please enable location access.");
            weatherWidget.innerHTML = `<span>Location access denied</span>`;
            weatherWidget.classList.remove('hidden');
        }
    );
}

function getWeatherIcon(weatherId) {
    if (weatherId < 300) return '⛈️';
    if (weatherId < 600) return '🌧️';
    if (weatherId < 700) return '❄️';
    if (weatherId < 800) return '🌫️';
    if (weatherId === 800) return '☀️';
    if (weatherId > 800) return '☁️';
    return '🌍';
}
