import LeafletMap from './leaflet/leaflet-map.js';

function initSegmentMap() {
    const mapNode = document.getElementById('segment-map');
    console.log('[segment-map] initSegmentMap called');
    if (!mapNode) {
        return false;
    }
    const polyline = mapNode.dataset.polyline;
    if (!polyline) {
        console.warn('[segment-map] No polyline found in data attribute');
        return false;
    }
    console.log('[segment-map] Polyline:', polyline);

    const tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const minZoom = 10;
    const maxZoom = 18;

    try {
        const map = LeafletMap(mapNode, {
            routes: [polyline],
            tileLayer,
            minZoom,
            maxZoom
        });
        map.render();
        console.log('[segment-map] Map rendered');
        return true;
    } catch (e) {
        console.error('[segment-map] Error rendering map:', e);
        return false;
    }
}

document.addEventListener('modalWasLoaded', (e) => {
    console.log('[segment-map] pageWasLoaded event', e);
    if (e.detail.modalId.includes('segment/segment')) {
      initSegmentMap()
    }
});
