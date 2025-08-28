// --- V2 Configurations ---
const firebaseConfig = {
  apiKey: "AIzaSyBFHs9InjH2UUnCBkRUPA8cJ5jjpLcOG0Y", // Your new, correct key
  authDomain: "crisisconnect-application.firebaseapp.com",
  databaseURL: "https://crisisconnect-application-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crisisconnect-application",
  storageBucket: "crisisconnect-application.firebasestorage.app",
  messagingSenderId: "438935321367",
  appId: "1:438935321367:web:9cc201bc83a7ed2d775552"
};

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const OPENWEATHER_API_KEY = '523b9642cbc6302e87135954e076db46'; 

// --- Initialize Services ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// --- Map Initialization ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [85.8245, 20.2961],
    zoom: 10
});

// --- Main App Logic ---
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
            alert("Could not sign in. Please try again or check your pop-up blocker.");
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

    // ... (rest of the app's logic for SOS, chat, etc.)
});

function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
}

function updateWeather() {
    // ... (weather function from before)
}
