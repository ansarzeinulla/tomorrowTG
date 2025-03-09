import { db } from "./firebase.js"; // Assuming you're already importing Firebase configuration
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to handle sending event to Firestore
async function sendEvent(eventData) {
    try {
        // Reference to the "events" collection
        const eventsRef = collection(db, "events");

        // Add new event document to Firestore
        await addDoc(eventsRef, eventData);

        // Display success message
        document.getElementById("responseMessage").textContent = "Event successfully sent!";
        document.getElementById("responseMessage").style.color = "green";
    } catch (error) {
        console.error("Error adding event:", error);
        document.getElementById("responseMessage").textContent = "Error sending event.";
        document.getElementById("responseMessage").style.color = "red";
    }
}

// Handle form submission
document.getElementById("sendEventForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form data
    const name = document.getElementById("eventName").value.trim();
    const author = document.getElementById("eventAuthor").value.trim();
    const location = document.getElementById("eventLocation").value.trim();
    const date = document.getElementById("eventDate").value;

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
        date: Timestamp.fromDate(new Date(date)) // Convert to Firestore Timestamp
    };

    // Call the function to send the event data to Firestore
    sendEvent(eventData);
});
