// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoidWx0cm9uNDYiLCJhIjoiY21ldTM5Ym41MDJ0bTJrb25wOHU1ZThuMSJ9.-PQcItLfBR4-yTgnZgoJvw';

// Coordinates for the center of Odisha
const odishaLngLat = [85.0985, 20.9517]; // Note: Mapbox uses [longitude, latitude]

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: odishaLngLat, // starting position
    zoom: 6.5 // starting zoom to show the whole state
});

const mapToggleButton = document.getElementById('map-toggle-btn');
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

document.addEventListener('DOMContentLoaded', () => {
    const actionBtn = document.getElementById('action-btn');
    const actionChoicePanel = document.getElementById('action-choice-panel');
    const needHelpForm = document.getElementById('need-help-form');
    const wantToHelpForm = document.getElementById('want-to-help-form');
    const needHelpBtn = document.getElementById('need-help-btn');
    const wantToHelpBtn = document.getElementById('want-to-help-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    
    // New elements for the "Other" category
    const needCategoryDropdown = document.getElementById('need-category');
    const otherCategoryWrapper = document.getElementById('other-category-wrapper');

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

    // ***** NEW LOGIC *****
    // Show/hide the "Other" text box based on dropdown selection
    needCategoryDropdown.addEventListener('change', () => {
        if (needCategoryDropdown.value === 'other') {
            otherCategoryWrapper.classList.remove('hidden');
        } else {
            otherCategoryWrapper.classList.add('hidden');
        }
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
