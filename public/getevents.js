import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

            // Get event details
            const { author, name, location, Date } = eventData;

            // Make sure we have a valid timestamp
            if (Date && author && name && location) {
                const eventDate = Date.toDate(); // Convert Firestore Timestamp to JavaScript Date object

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
                const formattedDate = event.date.toLocaleDateString(); // Format the date for display

                // Create the event label: "Date: Name 'at' Location (author)"
                eventLabel.textContent = `Date: ${formattedDate} - ${event.name} at ${event.location} (${event.author})`;
                eventsContainer.appendChild(eventLabel);
            });
        }

    } catch (error) {
        console.error("Error fetching events:", error);
        eventsContainer.innerHTML = '<p>Error fetching events</p>';
    }
}
