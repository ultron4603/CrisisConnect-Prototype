// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyByn_uWCz4C-3KNwgvwF7_4LN0jBLCO_ZQ",
  authDomain: "crisisconnect-app.firebaseapp.com",
  projectId: "crisisconnect-app",
  storageBucket: "crisisconnect-app.firebasestorage.app",
  messagingSenderId: "1068587491180",
  appId: "1:1068587491180:web:aef59c36358efce6731d49"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
    const actionBtn = document.getElementById('action-btn');
    const actionChoicePanel = document.getElementById('action-choice-panel');
    const needHelpFormEl = document.getElementById('need-help-form');
    const wantToHelpFormEl = document.getElementById('want-to-help-form');
    const sosForm = document.getElementById('sos-form');
    const offerForm = document.getElementById('offer-form');
    const needCategoryDropdown = document.getElementById('need-category');
    const otherCategoryWrapper = document.getElementById('other-category-wrapper');

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
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
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
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        addPinToMap(offerData);
    });

    // --- Geolocation and Database Logic ---
    function addPinToMap(data) {
        if (!navigator.geolocation) {
            return alert('Your browser does not support geolocation.');
        }
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            data.location = new firebase.firestore.GeoPoint(latitude, longitude);

            db.collection('pins').add(data)
                .then(() => {
                    alert('Your request has been posted on the map!');
                    hideAllPanels();
                })
                .catch(err => {
                    console.error("Error adding document: ", err);
                    alert('There was an error posting your request.');
                });
        }, () => {
            alert('Unable to retrieve your location. Please enable location services.');
        });
    }

    // --- Real-time Pin Listener ---
    db.collection('pins').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const pin = change.doc.data();
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.backgroundColor = pin.type === 'SOS' ? 'red' : 'green';

                new mapboxgl.Marker(el)
                    .setLngLat([pin.location.longitude, pin.location.latitude])
                    .setPopup(new mapboxgl.Popup().setHTML(
                        `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong><p>${pin.description || pin.notes}</p>`
                    ))
                    .addTo(map);
            }
        });
    });

    hideAllPanels();
});

// Add a bit of CSS for the markers dynamically
const style = document.createElement('style');
style.innerHTML = `
.marker {
  border-radius: 50%;
  width: 20px;
  height: 20px;
  border: 2px solid white;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
}`;
document.head.appendChild(style);
