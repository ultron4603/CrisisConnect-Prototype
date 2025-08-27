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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- Mapbox Configuration ---
mapboxgl.accessToken = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [85.0985, 20.9517],
    zoom: 6.5
});

// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Variables ---
    const allPanels = document.querySelectorAll('.panel');
    const actionBtn = document.getElementById('action-btn');
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');
    const mapToggleButton = document.getElementById('map-toggle-btn');
    const chatPanel = document.getElementById('chat-panel');
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    let activeChatListener = null;

    // --- Helper Functions ---
    function hideAllPanels() { allPanels.forEach(p => p.classList.add('hidden')); }

    // --- Authentication Logic ---
    auth.onAuthStateChanged(user => {
        if (user) {
            signinBtn.classList.add('hidden');
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            actionBtn.classList.remove('hidden');
        } else {
            signinBtn.classList.remove('hidden');
            userPic.classList.add('hidden');
            actionBtn.classList.add('hidden');
            hideAllPanels();
        }
    });

    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut(); } });

    // --- UI Interaction Logic ---
    mapToggleButton.addEventListener('click', () => {
        const currentStyle = map.getStyle().name;
        map.setStyle(currentStyle === 'Mapbox Streets' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12');
        mapToggleButton.textContent = currentStyle === 'Mapbox Streets' ? 'Map' : 'Satellite';
    });

    actionBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('action-choice-panel').classList.remove('hidden'); });
    document.getElementById('need-help-btn').addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    document.getElementById('want-to-help-btn').addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    document.querySelectorAll('.cancel-btn, #close-panel-btn, #close-chat-btn').forEach(btn => btn.addEventListener('click', hideAllPanels));

    // --- Form Submission Logic ---
    function addPinToMap(data) {
        const user = auth.currentUser;
        if (!user) { return alert('Please sign in first.'); }
        navigator.geolocation.getCurrentPosition(position => {
            Object.assign(data, {
                uid: user.uid, userName: user.displayName, userPhoto: user.photoURL,
                lat: position.coords.latitude, lng: position.coords.longitude,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            database.ref('pins').push(data)
                .then(() => { alert('Your request has been posted!'); hideAllPanels(); })
                .catch(err => { console.error(err); alert('Error posting request.'); });
        }, () => alert('Please enable location services.'));
    }
    
    document.getElementById('sos-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let category = formData.get('category');
        if (category === 'other') { category = document.getElementById('other-category-input').value || 'Other'; }
        const alertData = { type: 'SOS', category: category, people: formData.get('people'), description: formData.get('description') };
        addPinToMap(alertData);
    });

    document.getElementById('offer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const offers = Array.from(formData.getAll('offer'));
        const offerData = { type: 'HELP', offers: offers, availability: formData.get('availability'), notes: formData.get('notes') };
        addPinToMap(offerData);
    });

    // --- Real-time Pin & Chat Button Logic ---
    database.ref('pins').on('child_added', snapshot => {
        const pin = snapshot.val();
        const pinId = snapshot.key;
        if (!pin || !pin.lat || !pin.lng) return;

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = pin.type === 'SOS' ? 'red' : 'green';

        const popup = new mapboxgl.Popup().setHTML(createPopupHTML(pin, pinId));
        new mapboxgl.Marker(el).setLngLat([pin.lng, pin.lat]).setPopup(popup).addTo(map);
    });

    function createPopupHTML(pin, pinId) {
        const user = auth.currentUser;
        let buttonHTML = '';
        if (user && user.uid !== pin.uid) { 
            buttonHTML = `<button class="chat-btn" data-pin-id="${pinId}" data-pin-uid="${pin.uid}">Offer Help & Chat</button>`;
        }
        return `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong>
                <p>${pin.description || pin.notes}</p>
                <p style="display:flex; align-items:center; gap:5px;"><img src="${pin.userPhoto}" width="20" height="20" style="border-radius:50%;"/> ${pin.userName}</p>
                ${buttonHTML}`;
    }

    // --- Chat Panel Logic ---
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-btn')) {
            const pinUid = e.target.dataset.pinUid;
            const currentUser = auth.currentUser;
            if (!currentUser) return alert("Please sign in to chat.");
            
            const chatId = [currentUser.uid, pinUid].sort().join('_');
            startChat(chatId);
        }
    });

    function startChat(chatId) {
        hideAllPanels();
        chatPanel.classList.remove('hidden');
        chatMessages.innerHTML = ''; 
        chatHeader.textContent = `Secure Chat`;
        chatForm.dataset.chatId = chatId;

        const messagesRef = database.ref(`chats/${chatId}`);
        if (activeChatListener) activeChatListener.off();
        
        // ** THE FIX IS HERE **
        activeChatListener = messagesRef; // Corrected the variable name

        messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
            const msg = snapshot.val();
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            if (msg.uid === auth.currentUser.uid) msgDiv.classList.add('sent');
            msgDiv.innerHTML = `<img src="${msg.userPhoto}" alt="User"> <span>${msg.text}</span>`;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const chatId = e.target.dataset.chatId;
        const text = chatInput.value.trim();
        const user = auth.currentUser;
        if (!chatId || !text || !user) return;

        database.ref(`chats/${chatId}`).push({
            uid: user.uid,
            userPhoto: user.photoURL,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        chatInput.value = '';
    });
});
