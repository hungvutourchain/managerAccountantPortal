# Company License Statistics Feature

## Feature Description

Added a comprehensive license statistics feature that shows:
- User license status by company
- License utilization rates
- Active vs expired licenses  
- Overall statistics and export functionality
- **NEW: Unassigned Users tracking**

## What was added:

### 1. New Properties in Component:
```typescript
companyLicenseStats: any[] = [];
showLicenseStats: boolean = false;
statsSearchText: string = '';
statsSortBy: string = 'companyName';
statsSortDirection: 'asc' | 'desc' = 'asc';
```

### 2. New Methods:
- `generateCompanyLicenseStatistics()` - Calculates statistics for each company + unassigned users
- `toggleLicenseStats()` - Shows/hides the statistics section
- `exportLicenseStats()` - Exports data to CSV
- `hasUnassignedUsers()` - Checks if there are users without company assignment
- `getCompanyColor()`, `getUtilizationStatus()`, etc. - Helper methods for UI

### 3. UI Components:
- Statistics cards showing overview for top companies
- Detailed table with all companies and their license data
- **Special row for "Unassigned Users" with warning styling**
- Progress bars showing license utilization
- Export to CSV functionality
- Search and sort functionality
- Responsive design for mobile devices

### 4. Features:
- **Company Overview**: Shows top 4 companies with utilization percentages
- **Detailed Table**: Complete breakdown of all companies + unassigned users
- **Status Indicators**: Color-coded status (Excellent/Good/Fair/Poor)
- **Unassigned Users**: Special category for users without company
- **Export**: CSV export with all statistics including unassigned users
- **Search & Sort**: Filter and sort by any column
- **Responsive**: Mobile-friendly design
- **Real-time Updates**: Statistics update when licenses change

### 5. Statistics Tracked:
- Total users per company (including unassigned)
- Users with active licenses
- Users without licenses
- Active licenses count
- Expired licenses count
- License utilization percentage
- Overall company status

### 6. Unassigned Users Feature:
- **Display Name**: "Unassigned Users"
- **Visual Indicator**: Yellow warning row with badge "No Company"
- **Tooltip**: Explains what unassigned users are
- **Explanation**: Note at bottom explaining the category
- **Tracking**: Included in all statistics and exports
- **Purpose**: Helps identify users who need company assignment

## How to Use:
1. Click "View Company License Statistics" button
2. View the overview cards for top companies
3. Scroll down to see detailed table with all companies
4. Look for "Unassigned Users" row (if any exist) - highlighted in yellow
5. Use search to find specific companies
6. Click column headers to sort data
7. Export data using the "Export CSV" button
8. Close statistics view using the "Close" button

## Understanding "Unassigned Users":
- These are users who don't have a company assigned to their account
- They appear in a special highlighted row in the statistics table
- They're included in all counts and calculations
- The system tracks their license status just like company users
- Consider assigning these users to appropriate companies for better organization

## CSS Styling:
Added comprehensive styling with:
- Gradient headers
- Hover effects  
- Color-coded status badges
- Progress bars
- Responsive design
- Professional card layout
- **Special yellow highlighting for unassigned users**
- Search and sort UI elements
