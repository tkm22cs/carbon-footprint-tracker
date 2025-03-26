document.addEventListener("DOMContentLoaded", function () {
    const db = firebase.firestore();
    const auth = firebase.auth();

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

    // Function to get formatted date string
    function getFormattedDate(date) {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }

    // Set default date to today and max date to today
    const today = new Date();
    const formattedDate = getFormattedDate(today);
    dateInput.value = formattedDate;
    dateInput.max = formattedDate; // Prevent future dates

    // Validate date when user changes it
    dateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value + 'T00:00:00'); // Add time component for consistent comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for proper comparison
        
        if (selectedDate > today) {
            alert("You cannot select future dates!");
            this.value = formattedDate;
        }
    });

    // Expanded CO2 Calculation Factors with more detailed options
    const co2Factors = {
        transport: {
            "Car (Petrol)": 2.3,
            "Car (Diesel)": 2.7,
            "Bike/Scooter": 0.1,
            "Bus": 1.5,
            "Autorickshaw": 0.8,
            "Flight": 0.255
        },
        electricity: {
            "Normal": 0.82,  // India's grid average
            "Solar": 0.05
        },
        waste: {
            "Landfill": 1.2,
            "Composting": 0.3,
            "Recycling": 0.1,
            "Incineration": 0.7
        }
    };

    // Save Data to Firebase
    saveDataBtn.addEventListener("click", function () {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to save data!");
            return;
        }

        // Validate inputs
        if (!dateInput.value) {
            alert("Please select a date!");
            return;
        }

        // Calculate CO2 for each category
        const transportCO2 = transportType.value && transportDistance.value ? 
            (parseFloat(transportDistance.value) * co2Factors.transport[transportType.value]).toFixed(1) : 0;
        
        const electricityCO2 = electricitySource.value && electricityUsage.value ? 
            (parseFloat(electricityUsage.value) * co2Factors.electricity[electricitySource.value]).toFixed(1) : 0;
        
        const wasteCO2 = wasteType.value && wasteAmount.value ? 
            (parseFloat(wasteAmount.value) * co2Factors.waste[wasteType.value]).toFixed(1) : 0;

        // Calculate total CO2
        const totalCO2 = (parseFloat(transportCO2) + parseFloat(electricityCO2) + parseFloat(wasteCO2)).toFixed(1);

        // Create individual entries for each category that has data
        const entries = [];
        
        if (transportType.value && transportDistance.value) {
            entries.push({
                userId: user.uid,
                date: dateInput.value,
                activityType: `Transport (${transportType.value})`,
                details: `${transportDistance.value} km`,
                co2Amount: transportCO2,
                notes: notes.value || "",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        if (electricitySource.value && electricityUsage.value) {
            entries.push({
                userId: user.uid,
                date: dateInput.value,
                activityType: `Electricity (${electricitySource.value})`,
                details: `${electricityUsage.value} kWh`,
                co2Amount: electricityCO2,
                notes: notes.value || "",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        if (wasteType.value && wasteAmount.value) {
            entries.push({
                userId: user.uid,
                date: dateInput.value,
                activityType: `Waste (${wasteType.value})`,
                details: `${wasteAmount.value} kg`,
                co2Amount: wasteCO2,
                notes: notes.value || "",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // If no entries were created
        if (entries.length === 0) {
            alert("Please enter at least one activity!");
            return;
        }
        
        // Use a batch to add all entries
        const batch = db.batch();
        
        entries.forEach(entry => {
            const newDocRef = db.collection("carbon_data").doc();
            batch.set(newDocRef, entry);
        });
        
        batch.commit()
            .then(() => {
                alert("✅ Data saved successfully!");
                window.location.href = "dashboard.html?added=true";
            })
            .catch(error => {
                console.error("Error saving data:", error);
                alert("Error: " + error.message);
            });
    });

    // Cancel button
    cancelBtn.addEventListener("click", () => window.location.href = "dashboard.html");
});
