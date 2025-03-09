import { db } from "./firebase.js";
import { collection, doc, addDoc, Timestamp, getDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to handle sending event to Firestore
async function sendEvent(eventData) {
    try {
        const eventsRef = collection(db, "events");
        await addDoc(eventsRef, eventData);
        alert("Event successfully sent!");
    } catch (error) {
        console.error("Error adding event:", error);
        alert("Error sending event.");
    }
}

// Function to validate login
async function loginWithPin(username, pin) {
    username = username.trim();
    pin = pin.trim();

    if (username.length < 5 || username.length > 20) {
        alert("Username must be between 5 and 20 characters.");
        return false;
    }

    if (!/^\d{1,6}$/.test(pin) || parseInt(pin) < 0 || parseInt(pin) > 999999) {
        alert("PIN must be a 6-digit number (000000 - 999999).");
        return false;
    }

    try {
        const userDocRef = doc(db, "users", username);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.pin == pin) {
                alert("Login successful!");
                document.getElementById("loginForm").style.display = "none";
                document.getElementById("actionButtons").style.display = "block"; // Show action buttons
                return true;
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
        // Show action buttons after successful login
        document.getElementById("sendNewEventBtn").style.display = "block";
        document.getElementById("getMyEventsBtn").style.display = "block";
        document.getElementById("deleteMyEventBtn").style.display = "block";
        document.getElementById("actionButtons").style.display = "block"; // Show action buttons

        // Attach event listeners to action buttons after login
        document.getElementById("sendNewEventBtn").addEventListener("click", function() {
            document.getElementById("sendEventFormContainer").style.display = "block";
            document.getElementById("actionButtons").style.display = "none";
        });

        document.getElementById("getMyEventsBtn").addEventListener("click", function() {
            document.getElementById("getMyEventsFormContainer").style.display = "block";
            document.getElementById("actionButtons").style.display = "none";
        });

        document.getElementById("deleteMyEventBtn").addEventListener("click", function() {
            document.getElementById("deleteMyEventFormContainer").style.display = "block";
            document.getElementById("actionButtons").style.display = "none";
        });
    }
});


// Handle send event form submission
document.getElementById("sendEventForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("eventName").value.trim();
    const author = document.getElementById("eventAuthor").value.trim();
    const location = document.getElementById("eventLocation").value.trim();
    const dateTime = document.getElementById("eventDateTime").value;

    if (!name || !author || !location || !dateTime) {
        alert("All fields are required.");
        return;
    }

    const eventDateTime = new Date(dateTime);
    const eventData = {
        name,
        author,
        location,
        date: Timestamp.fromDate(eventDateTime),
    };

    sendEvent(eventData);

    document.getElementById("sendEventFormContainer").style.display = "none";
    document.getElementById("actionButtons").style.display = "block";
});

function formatEventDate(date) {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = monthNames[date.getMonth()]; // Get month name
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month} ${day} ${hours}:${minutes}`; // Format as "MonthName Day Hour:Minute"
}

// Function to get events by author and display them
export async function getMyEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = '';  // Clear existing events
    const authorName = document.getElementById('authorNameInput').value.trim();

    if (!authorName) {
        alert("Please enter an author's name.");
        return;
    }

    try {
        // Query events by author
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where("author", "==", authorName));
        const snapshot = await getDocs(q);

        console.log("Fetched events snapshot:", snapshot); // Debugging line to log the snapshot

        const events = [];

        // Loop through all documents
        snapshot.forEach(docSnap => {
            const eventData = docSnap.data();
            const docId = docSnap.id; // Get the document ID

            console.log("Event Data from doc:", eventData); // Debugging to see event data

            // Get event details
            const { author, name, location, date } = eventData;

            // Make sure we have a valid timestamp
            if (date && author && name && location) {
                const eventDate = date.toDate(); // Correctly convert Firestore Timestamp to JavaScript Date object
                console.log("Event Date:", eventDate); // Debugging to see the event date

                events.push({
                    author,
                    name,
                    location,
                    date: eventDate,
                    id: docId, // Add document ID to event data
                });
            }
        });

        console.log("Filtered events:", events); // Debugging line to show filtered events

        // If no events found, display a message
        if (events.length === 0) {
            eventsContainer.innerHTML = '<p>No events found for this author.</p>';
        } else {
            // Display the events in the required format
            events.forEach(event => {
                const eventLabel = document.createElement('p');
                const formattedDate = formatEventDate(event.date); // Format the date using the new function

                // Create the event label: "Date: Name 'at' Location (author) [Document ID]"
                eventLabel.textContent = `${formattedDate} - ${event.name} at ${event.location} (${event.author}) [ID: ${event.id}]`;
                eventsContainer.appendChild(eventLabel);
            });
        }

    } catch (error) {
        console.error("Error fetching events:", error);
        eventsContainer.innerHTML = '<p>Error fetching events</p>';
    }
}

// Handle "Get My Events" button click
document.getElementById("getMyEventsBtnTrigger").addEventListener("click", function() {
    getMyEvents();
});

// Function to delete event (currently empty)
export async function deleteEvent() {
    const eventId = document.getElementById('eventIdInput').value.trim(); // Get the event ID

    if (!eventId) {
        alert("Please enter a valid event ID.");
        return;
    }

    try {
        // Reference to the event document in Firestore
        const eventDocRef = doc(db, "events", eventId);

        // Delete the document from Firestore
        await deleteDoc(eventDocRef);

        // If successful, show a success message
        alert("Event deleted successfully!");
    } catch (error) {
        console.error("Error deleting event:", error);
        // If error occurs, show an error message
        alert("Error deleting event. Please try again.");
    }
}

// Handle delete event form submission
document.getElementById("deleteEventBtn").addEventListener("click", function() {
    const eventIdToDelete = document.getElementById("eventIdToDelete").value.trim();
    if (!eventIdToDelete) {
        alert("Please enter an event ID to delete.");
        return;
    }

    deleteMyEvent(eventIdToDelete);

    document.getElementById("deleteMyEventFormContainer").style.display = "none";
    document.getElementById("actionButtons").style.display = "block";
});
