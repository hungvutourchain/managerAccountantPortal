// Test script to verify the manager assignment fix
// Run this in browser console to test the permission logic

function testManagerPermissions() {
  console.log('=== Testing Manager Assignment Permissions ===');
  
  // Test cases for different user types
  const testUsers = [
    {
      name: 'Admin User',
      user: { IsAdmin: true, supperAdmin: false, IsLeader: false, role: [{ code: 'Admin', active: true }] }
    },
    {
      name: 'Super Admin',
      user: { IsAdmin: false, supperAdmin: true, IsLeader: false, role: [{ code: 'SuperAdmin', active: true }] }
    },
    {
      name: 'Leader',
      user: { IsAdmin: false, supperAdmin: false, IsLeader: true, role: [{ code: 'Leader', active: true }] }
    },
    {
      name: 'Reservation Manager',
      user: { IsAdmin: false, supperAdmin: false, IsLeader: false, IsReservationLeader: true, role: [{ code: 'ReservationManager', active: true }] }
    },
    {
      name: 'Regular User',
      user: { IsAdmin: false, supperAdmin: false, IsLeader: false, role: [{ code: 'Reservation', active: true }] }
    },
    {
      name: 'Inactive Leader',
      user: { IsAdmin: false, supperAdmin: false, IsLeader: false, role: [{ code: 'Leader', active: false }] }
    }
  ];

  // Simulate the canManageAssignments function
  function canManageAssignments(user) {
    // Check for Admin or SuperAdmin first
    if (user.IsAdmin || user.supperAdmin) {
      return true;
    }
    
    // Check for Leader or ReservationManager roles
    if (user.IsLeader || user.IsReservationLeader) {
      return true;
    }
    
    // Also check the role array for Leader/ReservationManager codes
    if (user.role?.some(r => 
      (r.code === 'Leader' || r.code === 'ReservationManager') && r.active
    )) {
      return true;
    }
    
    return false;
  }

  // Test each user type
  testUsers.forEach(testCase => {
    const result = canManageAssignments(testCase.user);
    console.log(`${testCase.name}: ${result ? '✅ CAN ASSIGN' : '❌ CANNOT ASSIGN'}`);
    console.log(`  - IsAdmin: ${testCase.user.IsAdmin}`);
    console.log(`  - supperAdmin: ${testCase.user.supperAdmin}`);
    console.log(`  - IsLeader: ${testCase.user.IsLeader}`);
    console.log(`  - IsReservationLeader: ${testCase.user.IsReservationLeader}`);
    console.log(`  - Role: ${JSON.stringify(testCase.user.role)}`);
    console.log('');
  });
}

// Run the test
testManagerPermissions();

console.log('=== Summary of Changes Made ===');
console.log('1. Fixed canManageAssignments() to check both user properties and role array');
console.log('2. Fixed UserService switchRole() to respect active flag for Leader roles');
console.log('3. Improved error handling and notifications');
console.log('4. Added permission checks before opening assign dialog');
console.log('5. Enhanced debugging with console logging');
console.log('6. Improved getUserGroup() to include nation parameter and error handling');
