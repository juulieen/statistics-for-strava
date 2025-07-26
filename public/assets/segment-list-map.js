import LeafletMap from './leaflet/leaflet-map.js';

function getVisibleSegments() {
    // Get all visible rows in the table
    const rows = document.querySelectorAll('.clusterize-content tr');
    const segments = [];
    rows.forEach(row => {
        const polyline = row.getAttribute('data-polyline');
        const favorite = row.getAttribute('data-favorite') === '1';
        const kom = row.getAttribute('data-kom') === '1';
        const segmentId = row.getAttribute('data-segment-id');
        if (polyline) {
            segments.push({
                polyline,
                favorite,
                kom,
                segmentId,
                row
            });
        }
    });
    return segments;
}


function highlightTableRow(segmentId) {
    const rows = document.querySelectorAll('.clusterize-content tr');
    rows.forEach(row => {
        if (row.getAttribute('data-segment-id') === segmentId) {
            row.focus();
            row.style.zIndex = 10;
            row.scrollIntoView({behavior: 'smooth', block: 'center'});
        } else {
            row.style.zIndex = '';
        }
    });
}


let leafletMap = null;
let polylines = [];

function renderSegmentsMap() {
    let mapNode = document.getElementById('segments-list-map');
    if (!mapNode) {
        // Insert map container above the table
        const container = document.createElement('div');
        container.className = 'mb-4';
        container.innerHTML = '<div id="segments-list-map" style="height: 400px; width: 100%; z-index: 0;"></div>';
        const tableWrapper = document.querySelector('.scroll-area');
        tableWrapper.parentNode.insertBefore(container, tableWrapper);
        mapNode = document.getElementById('segments-list-map');
    }
    // Ensure map always has low z-index
    mapNode.style.zIndex = 0;

    // Only create the map once
    if (!leafletMap) {
        const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const minZoom = 10;
        const maxZoom = 18;
        leafletMap = L.map(mapNode, {
            scrollWheelZoom: false,
            minZoom,
            maxZoom
        });
        L.tileLayer(tileLayer).addTo(leafletMap);
    }

    // Remove old polylines
    polylines.forEach(polyline => leafletMap.removeLayer(polyline));
    polylines = [];

    const segments = getVisibleSegments();
    if (segments.length === 0) return;

    const featureGroup = L.featureGroup();
    segments.forEach(segment => {
        const polyline = L.Polyline.fromEncoded(segment.polyline).setStyle({
            color: segment.favorite ? '#FFD700' : (segment.kom ? '#fc6719' : '#3388ff'),
            weight: segment.favorite ? 5 : (segment.kom ? 4 : 2),
            opacity: 0.9
        });
        polyline.on('click', () => {
            highlightTableRow(segment.segmentId);
        });
        polyline.addTo(featureGroup);
        polylines.push(polyline);
    });
    featureGroup.addTo(leafletMap);
    leafletMap.fitBounds(featureGroup.getBounds(), {maxZoom: 14});
}

document.addEventListener('dataTableClusterWasChanged', () => {
    renderSegmentsMap();
    console.log('[segment-list-map] dataTableClusterWasChanged event');
});

document.addEventListener('pageWasLoaded', () => {
    renderSegmentsMap();
    console.log('[segment-list-map] pageWasLoaded event');
});
