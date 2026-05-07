// 🔍 DEBUG COMMAND FOR BROWSER CONSOLE
// Copy and paste this into browser console to debug acc_TotalTLs

// Method 1: If you can access the component instance
if (window.angular) {
  const component = angular.element(document.querySelector('room-hotel-assgin')).scope();
  if (component && component.debugAccTotalTLsBreakdown) {
    console.log('🎯 Running debug breakdown...');
    const result = component.debugAccTotalTLsBreakdown();
    console.log('🎯 Debug Result:', result);
  } else {
    console.log('❌ Component or method not found');
  }
}

// Method 2: If Angular is not available, try finding component instance
else {
  // Try to find component through DOM elements
  const elements = document.querySelectorAll('room-hotel-assgin');
  console.log('Found room-hotel-assgin elements:', elements.length);
  
  // Look for any global component references
  if (window.roomHotelComponent) {
    console.log('🎯 Found global component reference');
    window.roomHotelComponent.debugAccTotalTLsBreakdown();
  }
}

// Method 3: Manual inspection of current data
console.log('🔍 Manual Data Inspection:');
console.log('Current URL:', window.location.href);
console.log('Page elements with acc_TotalTLs text:', 
  Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && el.textContent.includes('20,999.95')
  )
);

// Look for any element containing tour leader data
const tourLeaderElements = Array.from(document.querySelectorAll('*')).filter(el => 
  el.textContent && (
    el.textContent.includes('7,500') || 
    el.textContent.includes('Tour Leader') ||
    el.textContent.includes('625')
  )
);
console.log('🎯 Tour Leader related elements:', tourLeaderElements);