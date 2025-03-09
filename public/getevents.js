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

        console.log("Fetched events snapshot:", snapshot); // Debugging line to log the snapshot

        const events = [];

        // Loop through all documents
        snapshot.forEach(docSnap => {
            const eventData = docSnap.data();
            console.log("Event Data from doc:", eventData); // Debugging to see event data

            // Get event details
            const { author, name, location, date } = eventData;

            // Make sure we have a valid timestamp
            if (date && author && name && location) {
                const eventDate = date.toDate(); // Correctly convert Firestore Timestamp to JavaScript Date object
                console.log("Event Date:", eventDate); // Debugging to see the event date

                // Calculate the difference in time from the current date
                const currentDate = new Date();
                const timeDiff = eventDate - currentDate;
                console.log("Time Difference:", timeDiff); // Debugging to see time difference

                const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;

                // Check if the event is in the next 7 days or today
                if (timeDiff >= 0 && timeDiff <= sevenDaysInMilliseconds) {
                    console.log("Event is within the next 7 days:", eventData);
                    events.push({
                        author,
                        name,
                        location,
                        date: eventDate,
                    });
                }
            } else {
                console.log("Event data is incomplete, skipping:", eventData); // Debugging for incomplete data
            }
        });

        console.log("Filtered events:", events); // Debugging line to show filtered events

        // Sort events by date (today's events first)
        events.sort((a, b) => a.date - b.date);
        console.log("Sorted events:", events); // Debugging line to show sorted events

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
