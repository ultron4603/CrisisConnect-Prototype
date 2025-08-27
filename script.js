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

// --- Main App Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Variables ---
    const allPanels = document.querySelectorAll('.panel');
    const actionBtn = document.getElementById('action-btn');
    const signinBtn = document.getElementById('signin-btn');
    const userPic = document.getElementById('user-pic');
    const inboxBtn = document.getElementById('inbox-btn');
    const notificationDot = document.getElementById('notification-dot');
    let currentUser = null;
    let activeChatListener = null;

    // --- Helper Functions ---
    function hideAllPanels() { allPanels.forEach(p => p.classList.add('hidden')); }

    // --- Authentication Logic ---
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
        } else { /* User is signed out */ }
    });
    signinBtn.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
    userPic.addEventListener('click', () => { if(confirm("Do you want to sign out?")) { auth.signOut().then(() => window.location.reload()); } });

    // --- Real-time Pin Logic ---
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
        let buttonHTML = '';
        if (currentUser && currentUser.uid !== pin.uid) {
            buttonHTML = `<button class="request-chat-btn" data-pin-uid="${pin.uid}" data-pin-user-name="${pin.userName}">Request Chat</button>`;
        }
        return `<strong>${pin.type === 'SOS' ? pin.category : 'Offer of Help'}</strong><p>${pin.description || pin.notes}</p><p><img src="${pin.userPhoto}" width="20" height="20" style="border-radius:50%;"/> ${pin.userName}</p>${buttonHTML}`;
    }

    // --- Chat Request Logic ---
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('request-chat-btn')) {
            const recipientUid = e.target.dataset.pinUid;
            const recipientName = e.target.dataset.pinUserName;
            if (!currentUser) return alert("Please sign in.");
            const chatRequestRef = database.ref(`chat_requests/${recipientUid}`).push();
            chatRequestRef.set({
                fromUid: currentUser.uid,
                fromName: currentUser.displayName,
                status: 'pending'
            });
            alert(`Chat request sent to ${recipientName}!`);
        }
    });

    function listenForChatRequests(uid) {
        const requestsRef = database.ref(`chat_requests/${uid}`);
        requestsRef.on('value', snapshot => {
            const requestsList = document.getElementById('chat-requests-list');
            requestsList.innerHTML = '';
            let hasPendingRequests = false;
            snapshot.forEach(childSnapshot => {
                const request = childSnapshot.val();
                if (request.status === 'pending') {
                    hasPendingRequests = true;
                    const requestDiv = document.createElement('div');
                    requestDiv.className = 'chat-request';
                    requestDiv.innerHTML = `<span>Request from ${request.fromName}</span><div class="request-actions"><button class="accept-btn" data-req-id="${childSnapshot.key}" data-from-uid="${request.fromUid}">Accept</button><button class="decline-btn" data-req-id="${childSnapshot.key}">Decline</button></div>`;
                    requestsList.appendChild(requestDiv);
                }
            });
            notificationDot.classList.toggle('hidden', !hasPendingRequests);
        });
    }

    // --- Inbox & Conversation Logic ---
    inboxBtn.addEventListener('click', () => { hideAllPanels(); document.getElementById('inbox-panel').classList.remove('hidden'); });
    document.getElementById('close-inbox-btn').addEventListener('click', hideAllPanels);
    
    document.getElementById('chat-requests-list').addEventListener('click', (e) => {
        const reqId = e.target.dataset.reqId;
        const fromUid = e.target.dataset.fromUid;
        if (e.target.classList.contains('accept-btn')) {
            const chatId = [currentUser.uid, fromUid].sort().join('_');
            const conversationData = { [currentUser.uid]: true, [fromUid]: true };
            database.ref(`conversations/${chatId}`).set(conversationData);
            database.ref(`chat_requests/${currentUser.uid}/${reqId}`).update({ status: 'accepted' });
        } else if (e.target.classList.contains('decline-btn')) {
            database.ref(`chat_requests/${currentUser.uid}/${reqId}`).update({ status: 'declined' });
        }
    });

    function listenForConversations(uid) {
        database.ref('conversations').orderByChild(uid).equalTo(true).on('value', snapshot => {
            const conversationsList = document.getElementById('conversations-list');
            conversationsList.innerHTML = '';
            snapshot.forEach(childSnapshot => {
                const chatId = childSnapshot.key;
                const conversationDiv = document.createElement('div');
                conversationDiv.className = 'conversation-item';
                conversationDiv.textContent = `Chat ${chatId.slice(0, 10)}...`;
                conversationDiv.dataset.chatId = chatId;
                conversationsList.appendChild(conversationDiv);
            });
        });
    }

    document.getElementById('conversations-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('conversation-item')) {
            startChat(e.target.dataset.chatId);
        }
    });
    
    // --- Chat Panel Logic ---
    const chatPanel = document.getElementById('chat-panel');
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    document.getElementById('close-chat-btn').addEventListener('click', () => {
        chatPanel.classList.add('hidden');
        if (activeChatListener) activeChatListener.off();
    });

    function startChat(chatId) {
        hideAllPanels();
        chatPanel.classList.remove('hidden');
        chatMessages.innerHTML = '';
        chatHeader.textContent = `Secure Chat`;
        chatForm.dataset.chatId = chatId;
        const messagesRef = database.ref(`chats/${chatId}`);
        if (activeChatListener) activeChatListener.off();
        activeChatListener = messagesRef;
        messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
            const msg = snapshot.val();
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.uid === currentUser.uid ? 'sent' : ''}`;
            msgDiv.innerHTML = `<img src="${msg.userPhoto}" alt="User"> <span>${msg.text}</span>`;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    chatForm.addEventListener('submit', (e) => {
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
    });

    // ... (rest of the code for other panels and forms)
});
