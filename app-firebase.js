// ========================================
// 🔥 FIREBASE CONFIGURATION
// ========================================
// IMPORTANT: Replace this with YOUR Firebase config from Firebase Console!
// Get it from: Firebase Console → Project Settings → Your Apps → Web App

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ========================================
// Initialize Firebase
// ========================================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Password Configuration
const ADMIN_PASSWORD = '0000';
let isLoggedIn = localStorage.getItem('cifAdminLoggedIn') === 'true';

// Data variables
let workEntries = [];
let selectedEmployee = null;

// Days of the week
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ========================================
// Firebase Connection Status
// ========================================
const connectedRef = database.ref('.info/connected');
connectedRef.on('value', (snap) => {
  const statusDiv = document.getElementById('firebaseStatus');
  if (snap.val() === true) {
    statusDiv.textContent = '🟢 Connected';
    statusDiv.className = 'firebase-status firebase-connected';
  } else {
    statusDiv.textContent = '🔴 Disconnected';
    statusDiv.className = 'firebase-status firebase-disconnected';
  }
});

// ========================================
// Initialize on page load
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  checkLoginStatus();
  setDefaultWeekStart();
  setLast2WeeksCard();
  loadDataFromFirebase();
});

// ========================================
// Load Data from Firebase (Real-time)
// ========================================
function loadDataFromFirebase() {
  const entriesRef = database.ref('workEntries');
  
  entriesRef.on('value', (snapshot) => {
    workEntries = [];
    const data = snapshot.val();
    
    if (data) {
      Object.keys(data).forEach(key => {
        workEntries.push({
          firebaseId: key,
          ...data[key]
        });
      });
    }
    
    loadData();
    updateStatistics();
    calculate2WeekStatsCard();
  });
}

// ========================================
// Check login status
// ========================================
function checkLoginStatus() {
  if (isLoggedIn) {
    document.getElementById('logoutBtn').classList.remove('hidden');
  }
}

// ========================================
// Toggle Admin Panel with Password
// ========================================
function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  
  if (panel.classList.contains('hidden')) {
    if (!isLoggedIn) {
      const password = prompt('🔐 Enter Admin Password:');
      if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('cifAdminLoggedIn', 'true');
        panel.classList.remove('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        alert('✅ Access granted!');
      } else {
        alert('❌ Wrong password!');
      }
    } else {
      panel.classList.remove('hidden');
    }
  } else {
    panel.classList.add('hidden');
  }
}

// ========================================
// Logout
// ========================================
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    isLoggedIn = false;
    localStorage.removeItem('cifAdminLoggedIn');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    alert('👋 Logged out successfully!');
  }
}

// ========================================
// Select Employee
// ========================================
function selectEmployee(name) {
  selectedEmployee = name;
  
  document.querySelectorAll('.employee-btn').forEach(btn => {
    if (btn.dataset.employee === name) {
      btn.classList.add('bg-blue-500', 'text-white', 'border-blue-700');
      btn.classList.remove('hover:bg-blue-50');
    } else {
      btn.classList.remove('bg-blue-500', 'text-white', 'border-blue-700');
      btn.classList.add('hover:bg-blue-50');
    }
  });
  
  document.getElementById('selectedEmployeeDisplay').classList.remove('hidden');
  document.getElementById('selectedEmployeeName').textContent = name;
  document.getElementById('saveEmployeeName').textContent = name;
  document.getElementById('weeklyTimeEntry').classList.remove('hidden');
}

// ========================================
// Set default week start
// ========================================
function setDefaultWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  
  document.getElementById('weekStartDate').value = monday.toISOString().split('T')[0];
  updateWeekDates();
}

// ========================================
// Update week dates
// ========================================
function updateWeekDates() {
  const startDate = new Date(document.getElementById('weekStartDate').value + 'T00:00:00');
  
  daysOfWeek.forEach((day, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById(`date${day}`).textContent = dateStr;
  });
}

// ========================================
// Add weekly entry TO FIREBASE
// ========================================
function addWeeklyEntry() {
  if (!selectedEmployee) {
    alert('⚠️ Please select an employee first!');
    return;
  }

  const startDate = new Date(document.getElementById('weekStartDate').value + 'T00:00:00');
  const project = document.getElementById('projectName').value;
  const notes = document.getElementById('notes').value;
  
  let entriesAdded = 0;
  let totalHours = 0;
  const promises = [];

  daysOfWeek.forEach((day, index) => {
    const startTime = document.getElementById(`start${day}`).value;
    const endTime = document.getElementById(`end${day}`).value;
    const pause = parseInt(document.getElementById(`pause${day}`).value) || 0;

    if (startTime && endTime) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];

      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMinutes = (end - start) / 1000 / 60 - pause;
      const hours = (diffMinutes / 60).toFixed(2);

      if (diffMinutes > 0) {
        const entry = {
          employee: selectedEmployee,
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          pause: pause,
          hours: parseFloat(hours),
          project: project,
          notes: notes,
          timestamp: new Date().toISOString()
        };

        // Save to Firebase
        const newEntryRef = database.ref('workEntries').push();
        promises.push(newEntryRef.set(entry));
        
        entriesAdded++;
        totalHours += parseFloat(hours);
      }
    }
  });

  if (entriesAdded === 0) {
    alert('⚠️ Please enter at least one day with start and end times!');
    return;
  }

  Promise.all(promises).then(() => {
    clearWeekForm();
    alert(`✅ ${entriesAdded} entries added for ${selectedEmployee} to Firebase!\nTotal hours: ${totalHours.toFixed(2)}h\n\n🔥 Data is now synced to cloud and visible to everyone!`);
  }).catch((error) => {
    alert('❌ Error saving to Firebase: ' + error.message);
  });
}

// ========================================
// Clear week form
// ========================================
function clearWeekForm() {
  daysOfWeek.forEach(day => {
    document.getElementById(`start${day}`).value = '';
    document.getElementById(`end${day}`).value = '';
    document.getElementById(`pause${day}`).value = '';
  });
  document.getElementById('projectName').value = '';
  document.getElementById('notes').value = '';
}

// ========================================
// Load and display data (from memory)
// ========================================
function loadData() {
  const tbody = document.getElementById('entriesTable');
  const sorted = [...workEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-gray-500">No entries yet. Add your first work entry!</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(entry => `
    <tr class="hover:bg-gray-50 fade-in">
      <td class="px-6 py-4 whitespace-nowrap text-sm">${formatDate(entry.date)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          ${entry.employee}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.startTime}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.endTime}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.pause} min</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          ${entry.hours}h
        </span>
      </td>
      <td class="px-6 py-4 text-sm">${entry.project || '-'}</td>
      <td class="px-6 py-4 text-sm text-gray-600">${entry.notes || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="deleteEntry('${entry.firebaseId}')" class="text-red-600 hover:text-red-800 font-semibold">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// ========================================
// Delete entry FROM FIREBASE
// ========================================
function deleteEntry(firebaseId) {
  if (!isLoggedIn) {
    alert('⚠️ Please login as admin to delete entries!');
    return;
  }
  
  if (confirm('Are you sure you want to delete this entry from Firebase?')) {
    database.ref('workEntries/' + firebaseId).remove()
      .then(() => {
        alert('✅ Entry deleted from Firebase!');
      })
      .catch((error) => {
        alert('❌ Error deleting: ' + error.message);
      });
  }
}

// ========================================
// Filter data
// ========================================
function filterData() {
  const filterEmp = document.getElementById('filterEmployee').value;
  const filterFrom = document.getElementById('filterFromDate').value;
  const filterTo = document.getElementById('filterToDate').value;

  let filtered = workEntries;

  if (filterEmp) {
    filtered = filtered.filter(e => e.employee === filterEmp);
  }

  if (filterFrom) {
    filtered = filtered.filter(e => e.date >= filterFrom);
  }

  if (filterTo) {
    filtered = filtered.filter(e => e.date <= filterTo);
  }

  const tbody = document.getElementById('entriesTable');
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-gray-500">No entries match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(entry => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm">${formatDate(entry.date)}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          ${entry.employee}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.startTime}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.endTime}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.pause} min</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          ${entry.hours}h
        </span>
      </td>
      <td class="px-6 py-4 text-sm">${entry.project || '-'}</td>
      <td class="px-6 py-4 text-sm text-gray-600">${entry.notes || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <button onclick="deleteEntry('${entry.firebaseId}')" class="text-red-600 hover:text-red-800 font-semibold">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');

  updateStatistics(filtered);
}

// ========================================
// Reset filters
// ========================================
function resetFilters() {
  document.getElementById('filterEmployee').value = '';
  document.getElementById('filterFromDate').value = '';
  document.getElementById('filterToDate').value = '';
  loadData();
  updateStatistics();
}

// ========================================
// Update statistics
// ========================================
function updateStatistics(data = workEntries) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthHours = data
    .filter(e => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + e.hours, 0);

  document.getElementById('totalMonthHours').textContent = monthHours.toFixed(2);

  updateEmployeeSummary(data);
}

// ========================================
// Update employee summary
// ========================================
function updateEmployeeSummary(data = workEntries) {
  const employees = ['Ali Hojeij', 'Layla', 'Ali Fadlallah', 'Khodor', 'Hadi', 'Ali Moussa'];
  const summary = document.getElementById('employeeSummary');

  const summaryHTML = employees.map(emp => {
    const empEntries = data.filter(e => e.employee === emp);
    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    const entryCount = empEntries.length;

    return `
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <h3 class="font-bold text-lg text-blue-900">${emp}</h3>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-gray-700">Total Hours: <span class="font-bold text-blue-600">${totalHours.toFixed(2)}h</span></p>
          <p class="text-sm text-gray-700">Entries: <span class="font-bold">${entryCount}</span></p>
        </div>
      </div>
    `;
  }).join('');

  summary.innerHTML = summaryHTML;
}

// ========================================
// 2-Week Statistics
// ========================================
function setLast2WeeksCard() {
  const today = new Date();
  const lastMonday = new Date(today);
  const day = lastMonday.getDay();
  const diff = lastMonday.getDate() - day + (day === 0 ? -6 : 1);
  lastMonday.setDate(diff - 7);
  
  document.getElementById('twoWeekStartCard').value = lastMonday.toISOString().split('T')[0];
  calculate2WeekStatsCard();
}

function calculate2WeekStatsCard() {
  const startDateStr = document.getElementById('twoWeekStartCard').value;
  
  if (!startDateStr) {
    return;
  }
  
  const startDate = new Date(startDateStr + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13);
  
  const startDateOnly = startDateStr;
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const twoWeekEntries = workEntries.filter(entry => {
    return entry.date >= startDateOnly && entry.date <= endDateStr;
  });
  
  const totalHours = twoWeekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  
  document.getElementById('total2WeekHoursCard').textContent = totalHours.toFixed(2);
  
  const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('dateRangeDisplay').textContent = `${startFormatted} - ${endFormatted}`;
  
  const employees = ['Ali Hojeij', 'Layla', 'Ali Fadlallah', 'Khodor', 'Hadi', 'Ali Moussa'];
  const breakdownDiv = document.getElementById('employeeBreakdownCard');
  
  const breakdownHTML = employees.map(emp => {
    const empEntries = twoWeekEntries.filter(e => e.employee === emp);
    const empHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    const daysWorked = empEntries.length;
    
    return `
      <div class="bg-blue-50 rounded p-2 border border-blue-200">
        <p class="text-xs font-semibold text-gray-700">${emp}</p>
        <p class="text-lg font-bold text-blue-600">${empHours.toFixed(1)}h</p>
        <p class="text-xs text-gray-500">${daysWorked} days</p>
      </div>
    `;
  }).join('');
  
  breakdownDiv.innerHTML = breakdownHTML;
}

// ========================================
// Format date
// ========================================
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
  return date.toLocaleDateString('en-US', options);
}

// ========================================
// Export data as JSON (backup)
// ========================================
function exportData() {
  if (!isLoggedIn) {
    alert('⚠️ Please login as admin to export data!');
    return;
  }
  
  const dataStr = JSON.stringify(workEntries, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cif-canada-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  alert('✅ Backup exported successfully!');
}

// ========================================
// Clear all data FROM FIREBASE
// ========================================
function clearAllData() {
  if (!isLoggedIn) {
    alert('⚠️ Please login as admin to clear data!');
    return;
  }
  
  if (confirm('⚠️ Are you SURE you want to delete ALL work entries from Firebase? This cannot be undone!')) {
    if (confirm('⚠️ FINAL WARNING: This will permanently delete all data from the cloud!')) {
      database.ref('workEntries').remove()
        .then(() => {
          alert('✅ All data cleared from Firebase!');
        })
        .catch((error) => {
          alert('❌ Error clearing data: ' + error.message);
        });
    }
  }
}

// ========================================
// Download Weekly Report as PDF
// ========================================
function downloadWeeklyReport() {
  if (!isLoggedIn) {
    alert('⚠️ Please login as admin to download reports!');
    return;
  }
  
  const weekStart = prompt('Enter week start date (YYYY-MM-DD):\nExample: 2025-01-06');
  
  if (!weekStart) {
    return;
  }
  
  const startDate = new Date(weekStart + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const startDateStr = weekStart;
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const weekEntries = workEntries.filter(entry => {
    return entry.date >= startDateStr && entry.date <= endDateStr;
  });
  
  if (weekEntries.length === 0) {
    alert('❌ No entries found for this week!');
    return;
  }
  
  const employees = ['Ali Hojeij', 'Layla', 'Ali Fadlallah', 'Khodor', 'Hadi', 'Ali Moussa'];
  const employeeData = {};
  let grandTotal = 0;
  
  employees.forEach(emp => {
    const empEntries = weekEntries.filter(e => e.employee === emp);
    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
    employeeData[emp] = {
      entries: empEntries.sort((a, b) => new Date(a.date) - new Date(b.date)),
      total: totalHours,
      days: empEntries.length
    };
    grandTotal += totalHours;
  });
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let yPosition = 20;
  
  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('CIF Canada', 105, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text('Weekly Work Report', 105, 25, { align: 'center' });
  
  doc.setFontSize(11);
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  doc.text(dateRange, 105, 33, { align: 'center' });
  
  yPosition = 50;
  
  // Summary Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Week Summary', 15, yPosition);
  
  yPosition += 10;
  
  const summaryData = [
    ['Total Hours (All Employees)', `${grandTotal.toFixed(2)}h`],
    ['Total Days Worked', `${weekEntries.length}`],
    ['Average Hours per Employee', `${(grandTotal / employees.length).toFixed(2)}h`],
    ['Number of Employees', `${employees.length}`]
  ];
  
  doc.autoTable({
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 80, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPosition = doc.lastAutoTable.finalY + 15;
  
  // Employee Details
  employees.forEach((emp) => {
    const data = employeeData[emp];
    
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`${emp}`, 15, yPosition);
    
    yPosition += 2;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Hours: ${data.total.toFixed(2)}h  |  Days Worked: ${data.days}`, 15, yPosition + 3);
    
    yPosition += 8;
    
    if (data.entries.length > 0) {
      const tableData = data.entries.map(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        const dayName = entryDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return [
          dateStr,
          dayName,
          entry.startTime,
          entry.endTime,
          `${entry.pause} min`,
          `${entry.hours.toFixed(2)}h`,
          entry.project || '-'
        ];
      });
      
      tableData.push([
        { content: 'TOTAL', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [239, 246, 255] } },
        { content: `${data.total.toFixed(2)}h`, styles: { fontStyle: 'bold', fillColor: [239, 246, 255] } },
        { content: '', styles: { fillColor: [239, 246, 255] } }
      ]);
      
      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Day', 'Start', 'End', 'Pause', 'Hours', 'Project']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [30, 58, 138], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 20, fontStyle: 'bold' },
          6: { cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No entries for this week.', 15, yPosition);
      yPosition += 10;
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 105, 285, { align: 'center' });
  doc.text('CIF Canada © 2025 - Powered by Firebase', 105, 290, { align: 'center' });
  
  doc.save(`CIF-Canada-Weekly-Report-${weekStart}.pdf`);
  
  alert('✅ Weekly report PDF downloaded successfully!');
}
