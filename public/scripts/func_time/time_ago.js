// Client-side time ago calculator
function calculateTimeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - postDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else if (diffInSeconds < 1209600) { // 2 weeks
    return '1w';
  } else if (diffInSeconds < 2419200) { // 4 weeks
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}w`;
  } else {
    // More than 4 weeks, show date
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Update all time indicators
function updateTimeIndicators() {
  document.querySelectorAll('.time-since-posted-header').forEach(element => {
    const postDate = element.dataset.date;
    if (postDate) {
      element.textContent = calculateTimeAgo(postDate);
    }
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  updateTimeIndicators();
  
  // Update every minute
  setInterval(updateTimeIndicators, 60000);
});s