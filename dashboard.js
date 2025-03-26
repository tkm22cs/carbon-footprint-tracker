document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            console.log("User Logged In:", user.email);
            initializeDashboard(user);
        }
    });
});

function initializeDashboard(user) {
    const db = firebase.firestore();
    
    // Dashboard elements
    const welcomeMessage = document.getElementById("welcomeMessage");
    const totalCarbonElement = document.getElementById("totalCarbon");
    const recentActivitiesList = document.getElementById("recentActivities");
    const noDataAlert = document.getElementById("noDataAlert");
    const filterDropdown = document.getElementById("filterDropdown");
    const timeFilterLabel = document.getElementById("timeFilter");
    const addDataBtn = document.getElementById("addDataBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (welcomeMessage) {
        welcomeMessage.innerText = `Welcome, ${user.email}!`;
    }

    // Date utility functions
    function getTodayDate() {
        const now = new Date();
        // Convert to local date string in YYYY-MM-DD format
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }
    
    function getStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        const startOfWeek = new Date(now.setDate(diff));
        return startOfWeek.getFullYear() + '-' + 
               String(startOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
               String(startOfWeek.getDate()).padStart(2, '0');
    }
    
    function getStartOfMonth() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-01';
    }
    
    function getStartOfYear() {
        const now = new Date();
        return now.getFullYear() + '-01-01';
    }
    
    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Function to update alert section
    function updateAlertSection(hasTodayData, justAdded = false) {
        if (!noDataAlert) return;

        const lastDataDate = localStorage.getItem('lastDataDate');
        const today = getTodayDate();
        
        console.log("Last data date:", lastDataDate);
        console.log("Today's date:", today);
        console.log("Has today's data:", hasTodayData);
        console.log("Just added:", justAdded);

        if (hasTodayData) {
            // Store today's date when data is added
            if (justAdded) {
                localStorage.setItem('lastDataDate', today);
            }

            // Show success message if data was added today
            noDataAlert.innerHTML = `
                <div class="alert-content success">
                    <span class="alert-icon">✅</span>
                    <span>Today's data has been added successfully!</span>
                </div>`;
            noDataAlert.classList.remove('hidden');
        } else {
            // Clear last data date if it's a new day
            if (lastDataDate && lastDataDate !== today) {
                localStorage.removeItem('lastDataDate');
            }

            // Show "Add Today's Data" button
            noDataAlert.innerHTML = `
                <div class="alert-content">
                    <span class="alert-icon">⚠️</span>
                    <span>You haven't added today's carbon data</span>
                </div>
                <button id="addDataBtn" class="add-data-btn">➕ Add Today's Data</button>`;
            noDataAlert.classList.remove('hidden');
            
            // Reattach event listener to new button
            const newAddDataBtn = document.getElementById("addDataBtn");
            if (newAddDataBtn) {
                newAddDataBtn.addEventListener("click", () => {
                    window.location.href = "add-data.html";
                });
            }
        }
    }

    // Load dashboard data based on filter
    function loadDashboardData(filter = "month", justAdded = false) {
        console.log("Loading dashboard data with filter:", filter);
        
        // Get the appropriate date range based on filter
        let startDate;
        let filterLabel;
        
        switch(filter) {
            case "day":
                startDate = getTodayDate();
                filterLabel = "(Today)";
                break;
            case "week":
                startDate = getStartOfWeek();
                filterLabel = "(This Week)";
                break;
            case "month":
                startDate = getStartOfMonth();
                filterLabel = "(This Month)";
                break;
            case "year":
                startDate = getStartOfYear();
                filterLabel = "(This Year)";
                break;
            default:
                startDate = getStartOfMonth();
                filterLabel = "(This Month)";
        }
        
        if (timeFilterLabel) {
            timeFilterLabel.innerText = filterLabel;
        }
        
        console.log("Fetching data from", startDate, "to now");
        
        const today = getTodayDate();
        console.log("Today's date:", today);
        
        // Fetch user's carbon data
        db.collection("carbon_data")
            .where("userId", "==", user.uid)
            .get()
            .then(snapshot => {
                let totalCarbon = 0;
                let activities = [];
                let hasTodayData = false;
                
                if (snapshot.empty) {
                    console.log("No carbon data found");
                    recentActivitiesList.innerHTML = `<li class="empty-message">No activities recorded yet</li>`;
                } else {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const entryDate = data.date;
                        
                        console.log("Entry date:", entryDate);
                        
                        if (entryDate === today) {
                            console.log("Found today's data");
                            hasTodayData = true;
                        }
                        
                        if (entryDate >= startDate) {
                            totalCarbon += parseFloat(data.co2Amount || 0);
                            activities.push({
                                date: entryDate,
                                type: data.activityType,
                                details: data.details,
                                co2: parseFloat(data.co2Amount),
                                timestamp: data.timestamp
                            });
                        }
                    });
                    
                    activities.sort((a, b) => {
                        const dateCompare = b.date.localeCompare(a.date);
                        if (dateCompare === 0 && a.timestamp && b.timestamp) {
                            return b.timestamp - a.timestamp;
                        }
                        return dateCompare;
                    });
                    
                    if (activities.length > 0) {
                        const activitiesHTML = activities
                            .slice(0, 10)
                            .map(activity => `
                                <li>
                                    <div class="activity-details">
                                        <span class="activity-type">${activity.type}</span>
                                        <span class="activity-date">${formatDate(activity.date)}</span>
                                    </div>
                                    <span class="activity-carbon">${activity.co2.toFixed(2)} kg CO2</span>
                                </li>
                            `).join('');
                        recentActivitiesList.innerHTML = activitiesHTML;
                    } else {
                        recentActivitiesList.innerHTML = `<li class="empty-message">No activities in this time period</li>`;
                    }
                }
                
                if (totalCarbonElement) {
                    totalCarbonElement.innerText = `${totalCarbon.toFixed(1)} kg CO2`;
                }
                
                updateAlertSection(hasTodayData, justAdded);
            })
            .catch(error => {
                console.error("Error fetching carbon data:", error);
                if (recentActivitiesList) {
                    recentActivitiesList.innerHTML = `<li class="error-message">Error loading data: ${error.message}</li>`;
                }
            });
    }

    // Check URL parameters for success message
    const urlParams = new URLSearchParams(window.location.search);
    const justAdded = urlParams.get('added') === 'true';

    // Initialize dashboard with default filter
    loadDashboardData("month", justAdded);
    
    // Set up event listeners
    if (filterDropdown) {
        filterDropdown.addEventListener("change", () => {
            loadDashboardData(filterDropdown.value);
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            firebase.auth().signOut()
                .then(() => {
                    window.location.href = "index.html";
                })
                .catch(error => {
                    console.error("Logout error:", error);
                });
        });
    }
}
