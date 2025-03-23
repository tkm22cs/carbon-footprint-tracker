document.addEventListener("DOMContentLoaded", function () {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Check authentication
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = "index.html";
        }
    });

    // Get form elements
    const dateInput = document.getElementById("date");
    const transportType = document.getElementById("transportType");
    const transportDistance = document.getElementById("transportDistance");
    const electricitySource = document.getElementById("electricitySource");
    const electricityUsage = document.getElementById("electricityUsage");
    const wasteType = document.getElementById("wasteType");
    const wasteAmount = document.getElementById("wasteAmount");
    const notes = document.getElementById("notes");
    const saveDataBtn = document.getElementById("saveDataBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;

    // CO2 Calculation Formula (kg CO2 per unit)
    const co2Factors = {
        transport: { "Car (Petrol)": 2.3, "Car (Diesel)": 2.7, "Bus": 1.5, "Bike": 0.5, "Train": 0.3 },
        electricity: { "Coal": 0.9, "Solar": 0.0, "Hydro": 0.0, "Wind": 0.0 },
        waste: { "Landfill": 1.2, "Composting": 0.3, "Recycling": 0.1 }
    };

    // Save Data to Firebase
    saveDataBtn.addEventListener("click", function () {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to save data!");
            return;
        }

        // Calculate CO2 Emissions
        let transportCO2 = 0;
        let electricityCO2 = 0;
        let wasteCO2 = 0;
        
        // Transport calculation
        if (transportType.value && transportDistance.value && transportDistance.value > 0) {
            transportCO2 = parseFloat(transportDistance.value) * co2Factors.transport[transportType.value];
        }
        
        // Electricity calculation
        if (electricitySource.value && electricityUsage.value && electricityUsage.value > 0) {
            electricityCO2 = parseFloat(electricityUsage.value) * co2Factors.electricity[electricitySource.value];
        }
        
        // Waste calculation
        if (wasteType.value && wasteAmount.value && wasteAmount.value > 0) {
            wasteCO2 = parseFloat(wasteAmount.value) * co2Factors.waste[wasteType.value];
        }

        const totalCO2 = transportCO2 + electricityCO2 + wasteCO2;
        
        // Check if any data was entered
        if (totalCO2 <= 0) {
            alert("Please enter at least one type of carbon data!");
            return;
        }

        // Create activity description based on what was entered
        let activityType = "";
        
        if (transportCO2 > 0) {
            activityType += `${transportType.value} (${transportDistance.value} km)`;
        }
        
        if (electricityCO2 > 0) {
            if (activityType) activityType += ", ";
            activityType += `${electricitySource.value} Energy (${electricityUsage.value} kWh)`;
        }
        
        if (wasteCO2 > 0) {
            if (activityType) activityType += ", ";
            activityType += `${wasteType.value} Waste (${wasteAmount.value} kg)`;
        }

        // Store in Firestore - format to match dashboard.js expectations
        db.collection("carbon_data").add({
            userId: user.uid,
            date: dateInput.value,
            activityType: activityType,
            co2Amount: totalCO2.toFixed(1),
            notes: notes.value || "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("✅ Data saved successfully!");
            window.location.href = "dashboard.html";
        })
        .catch(error => {
            console.error("Error saving data:", error);
            alert("Error: " + error.message);
        });
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => window.location.href = "dashboard.html");
});