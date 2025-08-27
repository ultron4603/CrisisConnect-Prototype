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
    const actionBtn = document.getElementById('action-btn');
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');
    
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

    // --- UI Elements & Logic ---
    const allPanels = document.querySelectorAll('.panel');
    function hideAllPanels() { allPanels.forEach(p => p.classList.add('hidden')); }
    
    const actionChoicePanel = document.getElementById('action-choice-panel');
    const needHelpFormEl = document.getElementById('need-help-form');
    const wantToHelpFormEl = document.getElementById('want-to-help-form');
    
    actionBtn.addEventListener('click', () => { hideAllPanels(); actionChoicePanel.classList.remove('hidden'); });
    document.getElementById('need-help-btn').addEventListener('click', () => { hideAllPanels(); needHelpFormEl.classList.remove('hidden'); });
    document.getElementById('want-to-help-btn').addEventListener('click', () => { hideAllPanels(); wantToHelpFormEl.classList.remove('hidden'); });
    document.querySelectorAll('.cancel-btn, #close-panel-btn').forEach(btn => btn.addEventListener('click', hideAllPanels));

    // --- Form Logic ---
    const sosForm = document.getElementById('sos-form');
    sosForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(sosForm);
        let category = formData.get('category');
        if (category === 'other') { category = document.getElementById('other-category-input').value || 'Other'; }
        const alertData = { type: 'SOS', category: category, people: formData.get('people'), description: formData.get('description') };
        addPinToMap(alertData);
    });

    const offerForm = document.getElementById('offer-form');
    offerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(offerForm);
        const offers = Array.from(formData.getAll('offer'));
        const offerData = { type: 'HELP', offers: offers, availability: formData.get('availability'), notes: formData.get('notes') };
        addPinToMap(offerData);
    });

    // --- Real-time Pin & Chat Logic ---
    const pinsRef = database.ref('pins');
    let activeChatListener = null;

    function addPinToMap(data) {
        const user = auth.currentUser;
        if (!user) { return alert('Please sign in first.'); }
        navigator.geolocation.getCurrentPosition(position => {
            Object.assign(data, {
                uid: user.uid, userName: user.displayName, userPhoto: user.photoURL,
                lat: position.coords.latitude, lng: position.coords.longitude,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            pinsRef.push(data)
                .then(() => { alert('Your request has been posted!'); hideAllPanels(); })
                .catch(err => { console.error(err); alert('Error posting request.'); });
        }, () => alert('Please enable location services.'));
    }

    pinsRef.on('child_added', snapshot => {
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
        if (user && user.uid !== pin.uid) { // Show button if logged in and not my own pin
            buttonHTML = `<button class="chat-btn" data-pin-id="${pinId}" data-pin-uid="${pin.uid}">Offer to Help & Chat</button>`;
        }
        return `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong>
                <p>${pin.description || pin.notes}</p>
                <p><img src="${pin.userPhoto}" width="20" height="20" style="border-radius:50%;"/> ${pin.userName}</p>
                ${buttonHTML}`;
    }

    // --- Chat Panel Logic ---
    const chatPanel = document.getElementById('chat-panel');
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const closeChatBtn = document.getElementById('close-chat-btn');
    
    closeChatBtn.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
        if (activeChatListener) {
            activeChatListener.off(); // Stop listening to messages for this chat
            activeChatListener = null;
        }
    });
    
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-btn')) {
            const pinId = e.target.dataset.pinId;
            const pinUid = e.target.dataset.pinUid;
            const currentUser = auth.currentUser;
            if (!currentUser) return alert("Please sign in to chat.");
            
            const chatId = [currentUser.uid, pinUid].sort().join('_'); // Create a unique, consistent chat ID
            startChat(chatId, pinId);
        }
    });

    function startChat(chatId, pinId) {
        hideAllPanels();
        chatPanel.classList.remove('hidden');
        chatMessages.innerHTML = 'Loading chat...';
        chatHeader.textContent = `Chat about request ${pinId.slice(0, 6)}...`;
        chatForm.dataset.chatId = chatId;

        const messagesRef = database.ref(`chats/${chatId}`);
        if (activeChatListener) activeChatListener.off(); // Detach old listener
        activeChatListener = messagesRef;

        messagesRef.on('child_added', (snapshot) => {
            const msg = snapshot.val();
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            if (msg.uid === auth.currentUser.uid) msgDiv.classList.add('sent');
            msgDiv.innerHTML = `<img src="${msg.userPhoto}" width="25" height="25"> <span>${msg.text}</span>`;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            if (chatMessages.innerHTML === 'Loading chat...') chatMessages.innerHTML = '';
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
            userName: user.displayName,
            userPhoto: user.photoURL,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        chatInput.value = '';
    });
});
