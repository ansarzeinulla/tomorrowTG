import { db } from "./firebase.js"; // Import the db from firebase
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to format event data in the format "MonthName Day Hour:Minute"
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

// Function to populate events in the events container
export async function populateEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = '';  // Clear existing events

    try {
        // Fetch all documents from the "events" collection
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);
        const events = [];

        // Loop through all documents
        snapshot.forEach(docSnap => {
            const eventData = docSnap.data();
            const { author, name, location, date } = eventData;

            // Make sure we have a valid timestamp
            if (date && author && name && location) {
                const eventDate = date.toDate(); // Correctly convert Firestore Timestamp to JS Date

                // Calculate the difference in time from the current date
                const currentDate = new Date();
                const timeDiff = eventDate - currentDate;
                const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;

                // Check if the event is in the next 7 days or today
                if (timeDiff >= 0 && timeDiff <= sevenDaysInMilliseconds) {
                    events.push({
                        author,
                        name,
                        location,
                        date: eventDate,
                    });
                }
            } else {
                //Event data is incomplete.
                //INGNORE
            }
        });

        // Sort events by date (today's events first)
        events.sort((a, b) => a.date - b.date);

        // If no events found, display a message
        if (events.length === 0) {
            eventsContainer.innerHTML = '<p>No events found</p>';
        } else {
            // Display the events in the required format
            events.forEach(event => {
                const eventLabel = document.createElement('p');
                const formattedDate = formatEventDate(event.date); // Format the date using the new function

                // Create the event label: "Date: Name 'at' Location (author)"
                eventLabel.textContent = `${formattedDate} - ${event.name} at ${event.location}`;
                eventsContainer.appendChild(eventLabel);
            });
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        eventsContainer.innerHTML = '<p>Error fetching events</p>';
    }
}
