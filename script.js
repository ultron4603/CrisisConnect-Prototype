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
let activeChatListener = null;

// --- All DOM Elements ---
const allPanels = document.querySelectorAll('.panel');
const signinBtn = document.getElementById('signin-btn');
const userPic = document.getElementById('user-pic');
const sosBtn = document.getElementById('sos-btn');
const offerHelpBtn = document.getElementById('offer-help-btn');
const emergencyBtn = document.getElementById('emergency-btn');
const mapStyleBtn = document.getElementById('map-style-btn');
const inboxBtn = document.getElementById('inbox-btn');
const notificationDot = document.getElementById('notification-dot');
const sosForm = document.getElementById('sos-form-actual');
const offerForm = document.getElementById('offer-form-actual');
const chatForm = document.getElementById('chat-form');

// --- Main Logic ---
map.on('load', () => {
    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            signinBtn.style.display = 'none'; userPic.src = user.photoURL; userPic.classList.remove('hidden');
            sosBtn.classList.remove('hidden'); offerHelpBtn.classList.remove('hidden'); inboxBtn.classList.remove('hidden');
            updateWeather(); listenForChatRequests(user.uid); listenForConversations(user.uid);
        } else {
            signinBtn.style.display = 'block'; userPic.classList.add('hidden');
            sosBtn.classList.add('hidden'); offerHelpBtn.classList.add('hidden'); inboxBtn.classList.add('hidden');
            document.getElementById('weather-widget').classList.add('hidden');
        }
    });

    // --- Event Listeners ---
    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) auth.signOut().then(() => window.location.reload()); });
    emergencyBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('emergency-panel').classList.remove('hidden'); });
    sosBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    offerHelpBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });
    mapStyleBtn.addEventListener('click', toggleMapStyle);
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.panel').classList.add('hidden')));
    document.body.addEventListener('click', handleBodyClick);
    sosForm.addEventListener('submit', handleFormSubmit);
    offerForm.addEventListener('submit', handleFormSubmit);
    chatForm.addEventListener('submit', handleChatMessageSend);
});

// --- Functions ---
function hideAllPanels() { allPanels.forEach(p => p.classList.add('hidden')); }

function toggleMapStyle() {
    const currentStyle = map.getStyle().name;
    if (currentStyle.includes('Satellite')) {
        map.setStyle('mapbox://styles/mapbox/outdoors-v12');
        mapStyleBtn.innerHTML = '🛰️';
    } else {
        map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
        mapStyleBtn.innerHTML = '🗺️';
    }
}

function updateWeather() { /* ... same as before ... */ }
function getWeatherIcon(id) { /* ... same as before ... */ }

function handleFormSubmit(e) { /* ... same as V1 ... */ }
function addPinToMap(data) { /* ... same as V1 ... */ }
database.ref('pins').on('child_added', snapshot => { /* ... same as V1 ... */ });
function createPopupHTML(pin, pinId) { /* ... same as V1 ... */ }
function handleBodyClick(e) { /* ... same as V1 for chat requests ... */ }
function listenForChatRequests(uid) { /* ... same as V1 ... */ }
function handleRequestAccept(target) { /* ... same as V1 ... */ }
function handleRequestDecline(target) { /* ... same as V1 ... */ }
function listenForConversations(uid) { /* ... same as V1 ... */ }
function startChat(chatId) { /* ... same as V1 ... */ }
function handleChatMessageSend(e) { /* ... same as V1 ... */ }
