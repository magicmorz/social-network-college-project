// Location Autocomplete functionality using Google Places API
class LocationAutocomplete {
  constructor(inputId) {
    this.inputElement = document.getElementById(inputId);
    this.autocomplete = null;
    this.selectedPlace = null;
    
    // Wait for Google Maps API to load
    this.initializeWhenReady();
  }

  initializeWhenReady() {
    // Check if Google Maps API is loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      this.initialize();
    } else {
      // Wait a bit and try again
      setTimeout(() => this.initializeWhenReady(), 100);
    }
  }

  initialize() {
    if (!this.inputElement) {
      console.error('Location input element not found');
      return;
    }

    // Create autocomplete instance
    this.autocomplete = new google.maps.places.Autocomplete(this.inputElement, {
      types: ['establishment', 'geocode'], // Allow both places and addresses
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
    });

    // Add place changed listener
    this.autocomplete.addListener('place_changed', () => {
      this.handlePlaceSelect();
    });

    // Style the autocomplete dropdown to match Instagram's design
    this.styleAutocomplete();
  }

  handlePlaceSelect() {
    const place = this.autocomplete.getPlace();
    
    if (!place || !place.place_id) {
      console.warn('No place details available');
      return;
    }

    this.selectedPlace = place;
    
    // Use the formatted address or name as the display value
    const displayValue = place.name || place.formatted_address;
    this.inputElement.value = displayValue;

    // Store additional place data if needed (for future use)
    this.inputElement.setAttribute('data-place-id', place.place_id);
    if (place.geometry && place.geometry.location) {
      this.inputElement.setAttribute('data-lat', place.geometry.location.lat());
      this.inputElement.setAttribute('data-lng', place.geometry.location.lng());
    }

    // Trigger a custom event for other components to listen to
    const locationSelectedEvent = new CustomEvent('locationSelected', {
      detail: {
        place: place,
        displayValue: displayValue
      }
    });
    this.inputElement.dispatchEvent(locationSelectedEvent);
  }

  styleAutocomplete() {
    // Add custom CSS classes to the input for styling
    this.inputElement.classList.add('location-autocomplete');
    
    // Listen for Google's dropdown creation to style it
    const observer = new MutationObserver(() => {
      const dropdown = document.querySelector('.pac-container');
      if (dropdown && !dropdown.classList.contains('styled')) {
        dropdown.classList.add('styled', 'instagram-autocomplete-dropdown');
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Method to get the current selected place data
  getSelectedPlace() {
    return this.selectedPlace;
  }

  // Method to clear the current selection
  clearSelection() {
    this.selectedPlace = null;
    this.inputElement.removeAttribute('data-place-id');
    this.inputElement.removeAttribute('data-lat');
    this.inputElement.removeAttribute('data-lng');
  }

  // Method to reset the input
  reset() {
    this.inputElement.value = '';
    this.clearSelection();
  }
}

// Initialize autocomplete when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize for the post creation modal
  const locationAutocomplete = new LocationAutocomplete('postLocation');
  
  // Make it globally accessible
  window.locationAutocomplete = locationAutocomplete;
});

// Also initialize when the modal is shown (in case the script loads after DOM)
document.addEventListener('click', function(e) {
  // Handle custom post creation modal
  if (e.target && e.target.id === 'createBtn') {
    setTimeout(() => {
      if (!window.locationAutocomplete && document.getElementById('postLocation')) {
        window.locationAutocomplete = new LocationAutocomplete('postLocation');
      }
    }, 100);
  }
  // Handle Bootstrap modals
  else if (e.target && e.target.closest('[data-bs-toggle="modal"]')) {
    setTimeout(() => {
      if (!window.locationAutocomplete && document.getElementById('postLocation')) {
        window.locationAutocomplete = new LocationAutocomplete('postLocation');
      }
    }, 100);
  }
}); 