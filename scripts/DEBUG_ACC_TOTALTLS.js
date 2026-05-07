// DEBUG TOUR LEADER ACC_TOTALTLS CALCULATION

// To debug why the individual tour leader shows $7,500 but acc_TotalTLs shows $20,999.95
// Add this temporary debug method to roomHotelAssgin.component.ts

debugAccTotalTLsBreakdown(): void {
  console.log('🔍 DEBUG acc_TotalTLs Breakdown');
  console.log('ItemHotel.acc_TotalTLs:', this.ItemHotel.acc_TotalTLs);
  
  console.log('Components:');
  console.log('  unit_TotalTLs (Share Room TLs):', this.ItemHotel.unit_TotalTLs);
  console.log('  sgl_TotalTLs (Single Room TLs):', this.ItemHotel.sgl_TotalTLs);
  console.log('  lc_TotalTLs (Late Checkout TLs):', this.ItemHotel.lc_TotalTLs);
  console.log('  lin_TotalTLs (Late Checkin TLs):', this.ItemHotel.lin_TotalTLs);
  console.log('  OtherServiceTotallTLs:', this.ItemHotel.OtherServiceTotallTLs);
  
  const calculatedTotal = 
    (this.ItemHotel.unit_TotalTLs || 0) + 
    (this.ItemHotel.sgl_TotalTLs || 0) + 
    (this.ItemHotel.lc_TotalTLs || 0) + 
    (this.ItemHotel.lin_TotalTLs || 0) + 
    (this.ItemHotel.OtherServiceTotallTLs || 0);
    
  console.log('Manual calculation:', calculatedTotal);
  console.log('Does it match acc_TotalTLs?', calculatedTotal === this.ItemHotel.acc_TotalTLs);
  
  // Check individual tour leader data
  const tourLeaders = this.ItemHotel.lsRoomAssigned?.filter(x => x.isTourleader) || [];
  console.log('Tour Leaders count:', tourLeaders.length);
  
  tourLeaders.forEach((tl, index) => {
    console.log(`Tour Leader ${index + 1}:`, {
      id: tl.id,
      typeof: tl.typeof,
      totalPrice: tl.totalPrice,
      totalPrice_buy: tl.totalPrice_buy,
      latecheckoutPrice: tl.latecheckoutPrice,
      latecheckinPrice: tl.latecheckinPrice
    });
  });
  
  // Check if getTotalPriceHotelRoomAssignment was called
  const totals = this.afac.getTotalPriceHotelRoomAssignment(this.ItemHotel);
  console.log('getTotalPriceHotelRoomAssignment result:', totals);
}