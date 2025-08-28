// --- V2 Configurations ---
const firebaseConfig = { /* Your Firebase Config */ };
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
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite with streets for detail
    center: [85.8245, 20.2961],
    zoom: 10
});

// --- Main App Logic ---
map.on('load', () => {
    // Get all DOM elements once the map is loaded
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');
    const sosBtn = document.getElementById('sos-btn');
    const offerHelpBtn = document.getElementById('offer-help-btn');
    const emergencyBtn = document.getElementById('emergency-btn');
    const mapStyleBtn = document.getElementById('map-style-btn');
    const emergencyPanel = document.getElementById('emergency-panel');
    
    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        if (user) {
            signinBtn.style.display = 'none';
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            sosBtn.classList.remove('hidden');
            offerHelpBtn.classList.remove('hidden');
            updateWeather(); // Fetch weather only when logged in
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

    // This is a simplified way to handle panel closing
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.panel').classList.add('hidden');
        });
    });

    // --- SATELLITE MODE & MAP DETAIL FIX ---
    mapStyleBtn.addEventListener('click', () => {
        const currentStyle = map.getStyle().name;
        if (currentStyle.includes('Satellite')) {
            map.setStyle('mapbox://styles/mapbox/outdoors-v12'); // Detailed street map
            mapStyleBtn.innerHTML = '🛰️';
        } else {
            map.setStyle('mapbox://styles/mapbox/satellite-streets-v12'); // Detailed satellite map
            mapStyleBtn.innerHTML = '🗺️';
        }
    });

    // Placeholder for SOS button functionality
    sosBtn.addEventListener('click', () => {
        alert("SOS Button Clicked! The form will open here.");
        // We will re-add the form logic from V1 here.
    });
});

// Weather function from before
function updateWeather() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
                document.getElementById('weather-icon').textContent = getWeatherIcon(data.weather[0].id);
                document.getElementById('weather-widget').classList.remove('hidden');
            });
    });
}
function getWeatherIcon(id) { /* ... same as before ... */ }
