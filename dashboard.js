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
    
    // Set welcome message
    if (document.getElementById("welcomeMessage")) {
        document.getElementById("welcomeMessage").innerText = `Welcome, ${user.email}!`;
    }

    const totalCarbonElement = document.getElementById("totalCarbon");
    const recentActivitiesList = document.getElementById("recentActivities");
    const noDataAlert = document.getElementById("noDataAlert");
    const filterDropdown = document.getElementById("filterDropdown");
    const timeFilterLabel = document.getElementById("timeFilter");

    // Load dashboard data based on filter
    function loadDashboardData(filter = "month") {
        console.log("Loading data with filter:", filter);
        
        // Update filter label
        switch(filter) {
            case "day": 
                timeFilterLabel.innerText = "(Today)";
                break;
            case "week": 
                timeFilterLabel.innerText = "(This Week)";
                break;
            case "month": 
                timeFilterLabel.innerText = "(This Month)";
                break;
            case "year": 
                timeFilterLabel.innerText = "(This Year)";
                break;
        }
        
        // Get today's date for checking if today's data exists
        const today = new Date().toISOString().split('T')[0];
        
        db.collection("carbon_data")
            .where("userId", "==", user.uid)
            .orderBy("date", "desc")
            .get()
            .then(snapshot => {
                let totalCarbon = 0;
                let activitiesHTML = "";
                let todayDataExists = false;
                
                if (snapshot.empty) {
                    console.log("No data found");
                    recentActivitiesList.innerHTML = '<li style="text-align: center;">No activities recorded yet</li>';
                } else {
                    console.log(`Found ${snapshot.size} records`);
                    
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const date = data.date; // YYYY-MM-DD format
                        const co2 = parseFloat(data.co2Amount);
                        
                        // Check if today's data exists
                        if (date === today) {
                            todayDataExists = true;
                            console.log("Found today's data");
                        }
                        
                        // Filter data based on selected time period
                        let includeInFilter = false;
                        
                        switch(filter) {
                            case "day":
                                includeInFilter = (date === today);
                                break;
                            case "week":
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                includeInFilter = (new Date(date) >= weekAgo);
                                break;
                            case "month":
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();
                                const recordDate = new Date(date);
                                includeInFilter = (recordDate.getMonth() === currentMonth && 
                                                 recordDate.getFullYear() === currentYear);
                                break;
                            case "year":
                                const thisYear = new Date().getFullYear();
                                includeInFilter = (new Date(date).getFullYear() === thisYear);
                                break;
                        }
                        
                        if (includeInFilter) {
                            // Add to total carbon
                            totalCarbon += co2;
                            
                            // Format date for display
                            const displayDate = new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            });
                            
                            // Add to activities HTML
                            activitiesHTML += `
                                <li>
                                    <div class="activity-details">
                                        <span class="activity-type">${data.activityType}</span>
                                        <span class="activity-date">${displayDate}</span>
                                    </div>
                                    <span class="activity-carbon">${data.co2Amount} kg CO2</span>
                                </li>
                            `;
                        }
                    });
                    
                    // Update activities list
                    if (activitiesHTML) {
                        recentActivitiesList.innerHTML = activitiesHTML;
                    } else {
                        recentActivitiesList.innerHTML = '<li style="text-align: center;">No activities in this time period</li>';
                    }
                }
                
                // Update total carbon display
                totalCarbonElement.innerText = `${totalCarbon.toFixed(1)} kg CO2`;
                
                // Show/hide the "no data" alert based on today's data
                if (todayDataExists) {
                    noDataAlert.classList.add("hidden");
                } else {
                    noDataAlert.classList.remove("hidden");
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                recentActivitiesList.innerHTML = '<li style="text-align: center; color: red;">Error loading data</li>';
            });
    }

    // Initialize with default (month) filter
    loadDashboardData();
    
    // Set up event listeners
    filterDropdown.addEventListener("change", () => {
        loadDashboardData(filterDropdown.value);
    });
    
    document.getElementById("addDataBtn").addEventListener("click", () => {
        window.location.href = "add-data.html";
    });
    
    document.getElementById("logoutBtn").addEventListener("click", () => {
        firebase.auth().signOut().then(() => {
            window.location.href = "index.html";
        });
    });
}