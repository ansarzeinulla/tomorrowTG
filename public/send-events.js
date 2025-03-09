import { db } from "./firebase.js";
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to handle sending event to Firestore
async function sendEvent(eventData) {
    try {
        // Reference to the "events" collection
        const eventsRef = collection(db, "events");

        // Add new event document to Firestore
        await addDoc(eventsRef, eventData);

        // Show an alert on successful event submission
        alert("Event successfully sent!");
    } catch (error) {
        console.error("Error adding event:", error);
        // Show an alert on error
        alert("Error sending event.");
    }
}

// Function to validate login
async function loginWithPin(username, pin) {
    // Trim inputs
    username = username.trim();
    pin = pin.trim();

    // Validate username length (5-20 characters)
    if (username.length < 5 || username.length > 20) {
        alert("Username must be between 5 and 20 characters.");
        return false;
    }

    // Validate PIN (must be a number from 000000 to 999999)
    if (!/^\d{1,6}$/.test(pin) || parseInt(pin) < 0 || parseInt(pin) > 999999) {
        alert("PIN must be a 6-digit number (000000 - 999999).");
        return false;
    }

    try {
        // Get user document from Firestore
        const userDocRef = doc(db, "users", username);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.pin == pin) {
                alert("Login successful!");
                // Show the event form after successful login
                document.getElementById("loginForm").style.display = "none";
                document.getElementById("eventForm").style.display = "block";

                return true; // Login successful
            } else {
                alert("Incorrect PIN.");
                return false;
            }
        } else {
            alert("User not found.");
            return false;
        }
    } catch (error) {
        console.error("Error checking PIN:", error);
        alert("An error occurred. Please try again.");
        return false;
    }
}

// Handle login button click
document.getElementById("loginButton").addEventListener("click", async function() {
    const username = document.getElementById("loginInput").value;
    const pin = document.getElementById("pinInput").value;

    const loginSuccess = await loginWithPin(username, pin);

    if (loginSuccess) {
        // Allow user to send event only after login
        document.getElementById("sendEventForm").addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent the default form submission

            // Get form data
            const name = document.getElementById("eventName").value.trim();
            const author = document.getElementById("eventAuthor").value.trim();
            const location = document.getElementById("eventLocation").value.trim();
            const date = document.getElementById("eventDate").value;

            // Capture the current timestamp for when the event is created
            const timestamp = new Date();

            // Validate inputs
            if (!name || !author || !location || !date) {
                alert("All fields are required.");
                return;
            }

            // Create the event data object
            const eventData = {
                name,
                author,
                location,
                date: Timestamp.fromDate(new Date(date)), // Convert to Firestore Timestamp
                timestamp: Timestamp.fromDate(timestamp), // Store the current timestamp
            };

            // Call the function to send the event data to Firestore
            sendEvent(eventData);
        });
    }
});
