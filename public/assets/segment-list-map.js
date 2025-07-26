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
    // Center on the main cluster of segments (exclude outliers)
    if (segments.length > 1) {
        // Collect all latlngs from all polylines
        let allLatLngs = [];
        const segmentLatLngs = segments.map(segment => {
            const latlngs = L.Polyline.fromEncoded(segment.polyline).getLatLngs();
            if (Array.isArray(latlngs[0])) {
                // Multi-part polyline
                let flat = [];
                latlngs.forEach(part => flat.push(...part));
                return flat;
            } else {
                return latlngs;
            }
        });
        segmentLatLngs.forEach(arr => allLatLngs.push(...arr));
        if (allLatLngs.length > 0) {
            // Compute centroid
            const centroid = allLatLngs.reduce((acc, latlng) => {
                acc.lat += latlng.lat;
                acc.lng += latlng.lng;
                return acc;
            }, {lat: 0, lng: 0});
            centroid.lat /= allLatLngs.length;
            centroid.lng /= allLatLngs.length;

            // Compute min distance from each segment to centroid
            function haversine(lat1, lng1, lat2, lng2) {
                const R = 6371e3;
                const toRad = x => x * Math.PI / 180;
                const dLat = toRad(lat2 - lat1);
                const dLng = toRad(lng2 - lng1);
                const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            }
            const dists = segmentLatLngs.map(points => {
                return Math.min(...points.map(pt => haversine(pt.lat, pt.lng, centroid.lat, centroid.lng)));
            });
            // Use median distance as robust threshold
            const sorted = [...dists].sort((a,b)=>a-b);
            const median = sorted.length % 2 === 0 ? (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2 : sorted[Math.floor(sorted.length/2)];
            const threshold = median * 2;
            // Only use segments within threshold for centering
            let clusterLatLngs = [];
            segmentLatLngs.forEach((points, i) => {
                if (dists[i] <= threshold) clusterLatLngs.push(...points);
            });
            if (clusterLatLngs.length > 0) {
                const bounds = L.latLngBounds(clusterLatLngs);
                leafletMap.fitBounds(bounds, {maxZoom: 14});
            } else {
                leafletMap.setView([centroid.lat, centroid.lng], 13);
            }
        } else {
            leafletMap.fitBounds(featureGroup.getBounds(), {maxZoom: 14});
        }
    } else {
        leafletMap.fitBounds(featureGroup.getBounds(), {maxZoom: 14});
    }
}

document.addEventListener('dataTableClusterWasChanged', () => {
    renderSegmentsMap();
    console.log('[segment-list-map] dataTableClusterWasChanged event');
});

document.addEventListener('pageWasLoaded', () => {
    renderSegmentsMap();
    console.log('[segment-list-map] pageWasLoaded event');
});
