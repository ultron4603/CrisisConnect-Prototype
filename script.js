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
const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/streets-v12', center: [85.0985, 20.9517], zoom: 6.5 });

// --- App State ---
let currentUser = null;
let activeChatListener = null;

// --- DOM Elements ---
const allPanels = document.querySelectorAll('.panel');
const actionBtn = document.getElementById('action-btn');
const signinBtn = document.getElementById('signin-btn');
const userPic = document.getElementById('user-pic');
const inboxBtn = document.getElementById('inbox-btn');
const notificationDot = document.getElementById('notification-dot');
const mapToggleButton = document.getElementById('map-toggle-btn');
const chatPanel = document.getElementById('chat-panel');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// --- Helper Functions ---
function hideAllPanels() { allPanels.forEach(p => p.classList.add('hidden')); }

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication ---
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            signinBtn.classList.add('hidden');
            userPic.src = user.photoURL;
            userPic.classList.remove('hidden');
            actionBtn.classList.remove('hidden');
            inboxBtn.classList.remove('hidden');
            listenForChatRequests(user.uid);
            listenForConversations(user.uid);
        } else {
            signinBtn.classList.remove('hidden');
            userPic.classList.add('hidden');
            actionBtn.classList.add('hidden');
            inboxBtn.classList.add('hidden');
            hideAllPanels();
        }
    });
    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut().then(() => window.location.reload()); } });

    // --- UI Interactions ---
    mapToggleButton.addEventListener('click', () => {
        const currentStyle = map.getStyle().name;
        map.setStyle(currentStyle === 'Mapbox Streets' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12');
        mapToggleButton.textContent = currentStyle === 'Mapbox Streets' ? 'Map' : 'Satellite';
    });

    actionBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('action-choice-panel').classList.remove('hidden'); });
    document.getElementById('need-help-btn').addEventListener('click', () => { hideAllPanels(); document.getElementById('need-help-form').classList.remove('hidden'); });
    document.getElementById('want-to-help-btn').addEventListener('click', () => { hideAllPanels(); document.getElementById('want-to-help-form').classList.remove('hidden'); });
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', hideAllPanels));
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });

    // --- Pin and Chat Request Logic (Event Delegation) ---
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('request-chat-btn')) handleChatRequest(e.target);
        if (e.target.classList.contains('accept-btn')) handleRequestAccept(e.target);
        if (e.target.classList.contains('decline-btn')) handleRequestDecline(e.target);
        if (e.target.classList.contains('conversation-item')) startChat(e.target.dataset.chatId);
    });

    // --- Form Submissions ---
    document.getElementById('sos-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('offer-form').addEventListener('submit', handleFormSubmit);
    chatForm.addEventListener('submit', handleChatMessageSend);
});

// --- Core Functions ---
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let data;

    if (form.id === 'sos-form') {
        let category = formData.get('category');
        if (category === 'other') category = document.getElementById('other-category-input').value || 'Other';
        data = { type: 'SOS', category, people: formData.get('people'), description: formData.get('description') };
    } else {
        const offers = Array.from(formData.getAll('offer'));
        data = { type: 'HELP', offers, availability: formData.get('availability'), notes: formData.get('notes') };
    }
    addPinToMap(data);
}

function addPinToMap(data) {
    if (!currentUser) return alert('Please sign in first.');
    navigator.geolocation.getCurrentPosition(position => {
        Object.assign(data, {
            uid: currentUser.uid, userName: currentUser.displayName, userPhoto: currentUser.photoURL,
            lat: position.coords.latitude, lng: position.coords.longitude,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        database.ref('pins').push(data)
            .then(() => { alert('Your post is live on the map!'); hideAllPanels(); })
            .catch(err => { console.error(err); alert('Error posting to map.'); });
    }, () => alert('Please enable location services to post.'));
}

database.ref('pins').on('child_added', snapshot => {
    const pin = snapshot.val();
    const pinId = snapshot.key;
    if (!pin || !pin.lat || !pin.lng) return;
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundColor = pin.type === 'SOS' ? 'red' : 'green';
    const popupHTML = `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong><p>${pin.description || pin.notes}</p><p style="display:flex; align-items:center; gap:5px;"><img src="${pin.userPhoto}" width="20" height="20" style="border-radius:50%;"/> ${pin.userName}</p>` +
                      (currentUser && currentUser.uid !== pin.uid ? `<button class="request-chat-btn" data-pin-uid="${pin.uid}" data-pin-user-name="${pin.userName}">Request Chat</button>` : '');
    new mapboxgl.Marker(el).setLngLat([pin.lng, pin.lat]).setPopup(new mapboxgl.Popup().setHTML(popupHTML)).addTo(map);
});

function handleChatRequest(target) {
    const recipientUid = target.dataset.pinUid;
    const recipientName = target.dataset.pinUserName;
    if (!currentUser) return alert("Please sign in.");
    database.ref(`chat_requests/${recipientUid}`).push().set({
        fromUid: currentUser.uid,
        fromName: currentUser.displayName,
        fromPhoto: currentUser.photoURL,
        status: 'pending'
    });
    alert(`Chat request sent to ${recipientName}!`);
    target.textContent = "Request Sent";
    target.disabled = true;
}

function listenForChatRequests(uid) {
    database.ref(`chat_requests/${uid}`).on('value', snapshot => {
        const requestsList = document.getElementById('chat-requests-list');
        requestsList.innerHTML = '';
        let hasPending = false;
        snapshot.forEach(child => {
            const request = child.val();
            if (request.status === 'pending') {
                hasPending = true;
                const reqDiv = document.createElement('div');
                reqDiv.className = 'chat-request';
                reqDiv.innerHTML = `<img src="${request.fromPhoto}" width="30" height="30" style="border-radius:50%;"><p>${request.fromName} wants to chat.</p><div class="request-actions"><button class="accept-btn" data-req-id="${child.key}" data-from-uid="${request.fromUid}">Accept</button><button class="decline-btn" data-req-id="${child.key}">Decline</button></div>`;
                requestsList.appendChild(reqDiv);
            }
        });
        if (!hasPending) requestsList.innerHTML = '<p>No new requests.</p>';
        notificationDot.classList.toggle('hidden', !hasPending);
    });
}

function handleRequestAccept(target) {
    const reqId = target.dataset.reqId;
    const fromUid = target.dataset.fromUid;
    const chatId = [currentUser.uid, fromUid].sort().join('_');
    const conversationData = { [currentUser.uid]: true, [fromUid]: true };
    database.ref(`conversations/${chatId}`).set(conversationData);
    database.ref(`chat_requests/${currentUser.uid}/${reqId}`).update({ status: 'accepted' });
}

function handleRequestDecline(target) {
    database.ref(`chat_requests/${currentUser.uid}/${target.dataset.reqId}`).update({ status: 'declined' });
}

function listenForConversations(uid) {
    database.ref('conversations').orderByChild(uid).equalTo(true).on('value', snapshot => {
        const list = document.getElementById('conversations-list');
        list.innerHTML = '';
        let hasConvos = false;
        snapshot.forEach(child => {
            hasConvos = true;
            const convoDiv = document.createElement('div');
            convoDiv.className = 'conversation-item';
            convoDiv.dataset.chatId = child.key;
            convoDiv.textContent = `Conversation (${child.key.slice(0, 8)}...)`;
            list.appendChild(convoDiv);
        });
        if (!hasConvos) list.innerHTML = '<p>No active conversations.</p>';
    });
}

function startChat(chatId) {
    hideAllPanels();
    chatPanel.classList.remove('hidden');
    chatMessages.innerHTML = '';
    chatHeader.textContent = `Secure Chat`;
    chatForm.dataset.chatId = chatId;
    if (activeChatListener) activeChatListener.off();
    const messagesRef = database.ref(`chats/${chatId}`);
    activeChatListener = messagesRef;
    messagesRef.orderByChild('timestamp').on('child_added', snapshot => {
        const msg = snapshot.val();
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.uid === currentUser.uid ? 'sent' : ''}`;
        msgDiv.innerHTML = `<img src="${msg.userPhoto}" alt="User"> <span>${msg.text}</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function handleChatMessageSend(e) {
    e.preventDefault();
    const chatId = e.target.dataset.chatId;
    const text = chatInput.value.trim();
    if (!chatId || !text || !currentUser) return;
    database.ref(`chats/${chatId}`).push({
        uid: currentUser.uid,
        userPhoto: currentUser.photoURL,
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    chatInput.value = '';
}
