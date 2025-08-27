// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDnRUIDKoANI3GJ_hyRf4VEmUcIXZceDTE",
  authDomain: "crisisconnect-application.firebaseapp.com",
  databaseURL: "https://crisisconnect-application-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crisisconnect-application",
  storageBucket: "crisisconnect-application.firebasestorage.app",
  messagingSenderId: "438935321367",
  appId: "1:438935321367:web:9cc201bc83a7ed2d775552"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- Mapbox Configuration ---
mapboxgl.accessToken = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const odishaLngLat = [85.0985, 20.9517];
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: odishaLngLat,
    zoom: 6.5
});

// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Get all UI elements
    const actionBtn = document.getElementById('action-btn');
    const actionChoicePanel = document.getElementById('action-choice-panel');
    const needHelpFormEl = document.getElementById('need-help-form');
    const wantToHelpFormEl = document.getElementById('want-to-help-form');
    const sosForm = document.getElementById('sos-form');
    const offerForm = document.getElementById('offer-form');
    const needCategoryDropdown = document.getElementById('need-category');
    const otherCategoryWrapper = document.getElementById('other-category-wrapper');
    const mapToggleButton = document.getElementById('map-toggle-btn');
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');

    // --- Authentication Logic ---
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    signinBtn.addEventListener('click', () => {
        auth.signInWithPopup(googleProvider);
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.displayName);
            signinBtn.classList.add('hidden');
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            actionBtn.classList.remove('hidden');
        } else {
            // User is signed out
            console.log('User signed out');
            signinBtn.classList.remove('hidden');
            userPic.classList.add('hidden');
            actionBtn.classList.add('hidden');
            hideAllPanels();
        }
    });

    // --- UI Interaction Logic ---
    mapToggleButton.addEventListener('click', () => {
        const currentStyle = map.getStyle().name;
        if (currentStyle === 'Mapbox Streets') {
            map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
            mapToggleButton.textContent = 'Map';
        } else {
            map.setStyle('mapbox://styles/mapbox/streets-v12');
            mapToggleButton.textContent = 'Satellite';
        }
    });

    function hideAllPanels() {
        actionChoicePanel.classList.add('hidden');
        needHelpFormEl.classList.add('hidden');
        wantToHelpFormEl.classList.add('hidden');
    }

    actionBtn.addEventListener('click', () => {
        hideAllPanels();
        actionChoicePanel.classList.remove('hidden');
    });

    document.getElementById('need-help-btn').addEventListener('click', () => {
        hideAllPanels();
        needHelpFormEl.classList.remove('hidden');
    });

    document.getElementById('want-to-help-btn').addEventListener('click', () => {
        hideAllPanels();
        wantToHelpFormEl.classList.remove('hidden');
    });

    document.getElementById('close-panel-btn').addEventListener('click', () => {
        actionChoicePanel.classList.add('hidden');
    });
    
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.panel').classList.add('hidden');
        });
    });

    needCategoryDropdown.addEventListener('change', () => {
        otherCategoryWrapper.classList.toggle('hidden', needCategoryDropdown.value !== 'other');
    });

    // --- Form Submission Logic ---
    function addPinToMap(data) {
        const user = auth.currentUser;
        if (!user) {
            return alert('Please sign in to post a request.');
        }

        if (!navigator.geolocation) {
            return alert('Your browser does not support geolocation.');
        }
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            // Add user info to the data
            data.uid = user.uid;
            data.userName = user.displayName;
            data.userPhoto = user.photoURL;
            data.lat = latitude;
            data.lng = longitude;

            database.ref('pins').push(data)
                .then(() => {
                    alert('Your request has been posted on the map!');
                    hideAllPanels();
                })
                .catch(err => {
                    console.error("Error adding data: ", err);
                    alert('There was an error posting your request.');
                });
        }, () => {
            alert('Unable to retrieve your location. Please enable location services.');
        });
    }
    
    sosForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(sosForm);
        let category = formData.get('category');
        if (category === 'other') {
            category = document.getElementById('other-category-input').value || 'Other';
        }

        const alertData = {
            type: 'SOS',
            category: category,
            people: formData.get('people'),
            description: formData.get('description'),
            timestamp: Date.now()
        };
        addPinToMap(alertData);
    });

    offerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(offerForm);
        const offers = Array.from(formData.getAll('offer'));

        const offerData = {
            type: 'HELP',
            offers: offers,
            availability: formData.get('availability'),
            notes: formData.get('notes'),
            timestamp: Date.now()
        };
        addPinToMap(offerData);
    });

    // --- Real-time Pin Listener ---
    database.ref('pins').on('child_added', snapshot => {
        const pin = snapshot.val();
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = pin.type === 'SOS' ? 'red' : 'green';

        new mapboxgl.Marker(el)
            .setLngLat([pin.lng, pin.lat])
            .setPopup(new mapboxgl.Popup().setHTML(
                `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong>
                 <p>${pin.description || pin.notes}</p>
                 <p><img src="${pin.userPhoto}" width="20" height="20" style="border-radius: 50%;"/> Posted by ${pin.userName}</p>`
            ))
            .addTo(map);
    });

    hideAllPanels();
});
