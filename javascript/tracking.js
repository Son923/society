/**
 * Initializes click tracking for the entire app.
 */
export function initializeTracking() {
  document.body.addEventListener('click', handleClick);
}

/**
 * Handles click events and tracks them if they match certain criteria.
 * @param {Event} event - The click event.
 */
function handleClick(event) {
  const target = event.target.closest('button, a, [data-track]');
  if (!target) return;

  let trackingData = {
    type: target.tagName.toLowerCase(),
    text: target.innerText.trim(),
    id: target.id || '',
    class: target.className || '',
  };

  if (target.dataset.track) {
    trackingData = { ...trackingData, ...JSON.parse(target.dataset.track) };
  }

  trackEvent(trackingData);
}

/**
 * Tracks an event using Fathom Analytics.
 * @param {Object} data - The event data to track.
 * @param {string} [data.eventName] - Custom event name (optional).
 */
function trackEvent(data) {
  if (typeof window.fathom === 'undefined') {
    console.warn('Fathom Analytics not loaded');
    return;
  }

  try {
    // Use custom event name if provided, otherwise generate one
    const eventName = data.eventName || `${data.type}:${(data.text || '').replace(/\s+/g, ' ').trim() || data.id || 'unknown'}`;

    // Track the event
    window.fathom.trackEvent(eventName);

    // Track additional data if available
    if (data.additionalData) {
      window.fathom.trackGoal('GOAL_ID', data.additionalData); // Replace 'GOAL_ID' with your actual Fathom goal ID
    }

    console.log('Tracked event:', eventName, data);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Tracks a game state change.
 * @param {string} stateName - The name of the state that changed.
 * @param {*} newValue - The new value of the state.
 */
export function trackStateChange(stateName, newValue) {
  if (typeof window.fathom === 'undefined') {
    console.warn('Fathom Analytics not loaded');
    return;
  }

  const eventName = `state:${stateName}`;
  window.fathom.trackEvent(eventName);

  console.log('Tracked state change:', eventName, newValue);
}