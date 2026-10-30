import L from 'leaflet';

/**
 * Creates distinct Red Pulsing Pin for User Location
 */
export const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-user-pin-wrapper',
    html: `
      <div class="user-map-pin">
        <div class="user-map-pulse-red"></div>
        <div class="user-map-core-red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20],
  });
};

/**
 * Creates Lawyer Pin with Photo, Floating Rating Badge, and Active Selection Highlight
 */
export const createLawyerMarkerIcon = (avatarUrl, name, rating, isOnline, isSelected = false) => {
  return L.divIcon({
    className: `custom-lawyer-pin-wrapper ${isSelected ? 'is-pin-selected' : ''}`,
    html: `
      <div class="lawyer-map-marker ${isSelected ? 'marker-selected-glow' : ''}" data-lawyer-pin="true">
        <div class="lawyer-floating-pill ${isSelected ? 'pill-selected' : ''}">
          <span class="pill-name">${name}</span>
          <div class="pill-rating-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>${rating}</span>
          </div>
        </div>

        <div class="lawyer-marker-bubble ${isSelected ? 'bubble-selected' : ''}">
          <div class="lawyer-img-clipper">
            <img src="${avatarUrl}" alt="${name}" class="lawyer-marker-img" />
          </div>
          <span class="${isOnline ? 'lawyer-marker-status-green' : 'lawyer-marker-status-red'}"></span>
        </div>
        <div class="lawyer-marker-pointer ${isSelected ? 'pointer-selected' : ''}"></div>
      </div>
    `,
    iconSize: [110, 84],
    iconAnchor: [55, 82],
    popupAnchor: [0, -80],
  });
};
