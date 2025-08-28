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

// --- Map Initialization ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Detailed satellite view
    center: [85.8245, 20.2961], // Bhubaneswar
    zoom: 10
});

// --- App State ---
let currentUser = null;
let activeChatListener = null;

// --- DOM Elements (defined globally for access) ---
let signinBtn, userPic, sosBtn, offerHelpBtn, emergencyBtn, emergencyPanel, mapStyleBtn, inboxBtn, notificationDot, allPanels;

// --- Main App Logic ---
map.on('load', () => {
    // Assign all DOM elements once the map is ready
    signinBtn = document.getElementById('signin-btn');
    userPic = document.getElementById('user-pic');
    sosBtn = document.getElementById('sos-btn');
    offerHelpBtn = document.getElementById('offer-help-btn');
    emergencyBtn = document.getElementById('emergency-btn');
    emergencyPanel = document.getElementById('emergency-panel');
    mapStyleBtn = document.getElementById('map-style-btn');
    inboxBtn = document.getElementById('inbox-btn');
    notificationDot = document.getElementById('notification-dot');
    allPanels = document.querySelectorAll('.panel');

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
            listenForChatRequests(user.uid);
            listenForConversations(user.uid);
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
        emergencyPanel.classList.remove('hidden');
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

    // Re-add all panel logic from V1
    sosBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    offerHelpBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });
    
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.panel').classList.add('hidden');
        });
    });

    // Re-add all form submission and pin logic from V1
    // ... This requires re-adding the V1 HTML for these panels ...
    // ... (This will be done in the HTML step) ...
});

// --- Weather Function ---
function updateWeather() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        fetch(weatherUrl).then(res => res.json()).then(data => {
            document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
            document.getElementById('weather-icon').textContent = getWeatherIcon(data.weather[0].id);
            document.getElementById('weather-widget').classList.remove('hidden');
        });
    });
}
function getWeatherIcon(id) { /* ... same as before ... */ }

// --- All other functions from V1 for pins, chat, etc. go here ---
// ... (This will be added in the final complete version) ...
