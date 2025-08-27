let map; // Defines the map variable globally

// This function is called by the Google Maps script when it's ready
function initMap() {
    // Coordinates for the center of Odisha
    const odishaCoords = { lat: 20.9517, lng: 85.0985 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: odishaCoords,
        zoom: 7, // Zoom level to show the whole state
        disableDefaultUI: true // Hides default Google Maps buttons
    });

    const mapToggleButton = document.getElementById('map-toggle-btn');
    mapToggleButton.addEventListener('click', () => {
        if (map.getMapTypeId() === 'roadmap') {
            map.setMapTypeId('satellite');
            mapToggleButton.textContent = 'Map';
        } else {
            map.setMapTypeId('roadmap');
            mapToggleButton.textContent = 'Satellite';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const actionBtn = document.getElementById('action-btn');
    const actionChoicePanel = document.getElementById('action-choice-panel');
    const needHelpForm = document.getElementById('need-help-form');
    const wantToHelpForm = document.getElementById('want-to-help-form');
    const needHelpBtn = document.getElementById('need-help-btn');
    const wantToHelpBtn = document.getElementById('want-to-help-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const cancelBtns = document.querySelectorAll('.cancel-btn');

    function hideAllPanels() {
        actionChoicePanel.classList.add('hidden');
        needHelpForm.classList.add('hidden');
        wantToHelpForm.classList.add('hidden');
    }

    // Show the main action choice panel
    actionBtn.addEventListener('click', () => {
        hideAllPanels();
        actionChoicePanel.classList.remove('hidden');
    });

    // Show the "Need Help" form
    needHelpBtn.addEventListener('click', () => {
        hideAllPanels();
        needHelpForm.classList.remove('hidden');
    });

    // Show the "Want to Help" form
    wantToHelpBtn.addEventListener('click', () => {
        hideAllPanels();
        wantToHelpForm.classList.remove('hidden');
    });

    // Close buttons
    closePanelBtn.addEventListener('click', () => {
        actionChoicePanel.classList.add('hidden');
    });

    cancelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.panel').classList.add('hidden');
        });
    });

    // Prevent form submission for this prototype
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you! Your request has been submitted. (Functionality to show on map coming soon).');
            hideAllPanels();
        });
    });

    // Re-hide panels on DOMContentLoaded to ensure they are hidden on page load
    hideAllPanels();
});
