import { db } from "./firebase.js";
import { doc, getDoc,getDocs, addDoc, collection, increment, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

function formatShortTimestamp(date) {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const month = monthNames[date.getMonth()]; // Get month name
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${month} ${day} ${hours}:${minutes}:${seconds}`;
}
export async function loginWithPin(username, pin) {
    // Trim inputs
    username = username.trim();
    pin = pin.trim();

    // Validate username length (5-20 characters)
    if (username.length < 5 || username.length > 20) {
        alert("Username must be between 5 and 20 characters.");
        return;
    }

    // Validate PIN (must be a number from 000000 to 999999)
    if (!/^\d{1,6}$/.test(pin) || parseInt(pin) < 0 || parseInt(pin) > 999999) {
        alert("PIN must be a 6-digit number (000000 - 999999).");
        return;
    }

    try {
        // Get user document from Firestore
        const userDocRef = doc(db, "users", username);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log("User Data:", userData);

            if (userData.pin == pin) {
                alert("YES: Login successful!");
                showActionButton(userDocRef, userData.ishere);

                // Update <h2> label to show nick instead of "Login"
                const loginHeader = document.getElementById("loginHeader");
                loginHeader.textContent = userData.nick || username;

                // Apply fancy styling if user is VIP ("king")
                if (userData.vip === "king") {
                    loginHeader.style.color = "gold";
                    loginHeader.style.fontWeight = "bold";
                    loginHeader.style.fontSize = "22px";
                    loginHeader.style.textShadow = "0 0 10px gold, 0 0 20px orange";
                } else {
                    // Reset styling for normal users
                    loginHeader.style.color = "";
                    loginHeader.style.fontWeight = "";
                    loginHeader.style.fontSize = "";
                    loginHeader.style.textShadow = "";
                }

                // Display weekly records
                let recordsContainer = document.getElementById("recordsContainer");
                if (!recordsContainer) {
                    recordsContainer = document.createElement("div");
                    recordsContainer.id = "recordsContainer";
                    document.body.appendChild(recordsContainer);
                }
                recordsContainer.innerHTML = "<h3>Weekly Time Records</h3>";

                // Get week number
                const currentDate = new Date();
                const weekNumber = getWeekNumber(currentDate);
                const nick = userData.nick || username; 
                const weekPath = `timerecords/${nick}/${weekNumber}`;

                // Get total time for the week
                const mainRef = doc(db, `${weekPath}/main`);
                getDoc(mainRef).then(mainSnap => {
                    const totalTime = mainSnap.exists() ? mainSnap.data().total : 0;
                    const totalLabel = document.createElement("p");
                    totalLabel.textContent = `Total time for week: ${totalTime/60} minutes`;
                    recordsContainer.appendChild(totalLabel);
                }).catch(error => console.error("Error fetching total time:", error));

                // Get individual records
                const weekRef = collection(db, weekPath);
                getDocs(weekRef).then(snapshot => {
                    snapshot.forEach(docSnap => {
                        if (docSnap.id === "main") return;

                        const data = docSnap.data();
                        const begin = formatShortTimestamp(data.begin.toDate());
                        const end = formatShortTimestamp(data.end.toDate());
                        const diff = data.diff;

                        const recordLabel = document.createElement("p");
                        recordLabel.textContent = `${begin} + ${diff/60}m = ${end}`;
                        recordsContainer.appendChild(recordLabel);
                    });
                }).catch(error => console.error("Error fetching records:", error));
            } else {
                alert("NO: Incorrect PIN.");
            }
        } else {
            alert("NO: User not found.");
        }
    } catch (error) {
        console.error("Error checking PIN:", error);
        alert("An error occurred. Please try again.");
    }
}

function getWeekNumber(timestamp) {
    let date;

    // Ensure timestamp is a Firestore Timestamp before calling toDate()
    if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        console.error("Invalid timestamp:", timestamp);
        return null;
    }

    // Get the first day of the year (1st January)
    const oneJan = new Date(date.getFullYear(), 0, 1);

    // Get the number of days since 1st January
    const days = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));

    // Get the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const dayOfWeek = date.getDay();

    // Adjust the week number calculation to account for Monday as the start of the week
    const adjustedDayOfWeek = (dayOfWeek === 0) ? 7 : dayOfWeek; // If it's Sunday (0), treat it as 7
    
    return Math.ceil((days + adjustedDayOfWeek) / 7);
}

// Function to format timestamp as a valid Firestore document ID
function formatTimestampToId(timestamp) {
    if (timestamp && typeof timestamp.toDate === "function") {
        const date = timestamp.toDate();
        return date.toISOString().replace(/[:.]/g, "-");
    }
    console.error("Invalid timestamp for ID:", timestamp);
    return "invalid-timestamp";
}
// Function to handle button display and update logic
async function showActionButton(userDocRef, isHere) {
    const container = document.getElementById("actionContainer");
    container.innerHTML = ""; // Clear previous buttons

    console.log("Displaying button for isHere:", isHere);

    const button = document.createElement("button");
    button.textContent = isHere ? "Inform Leave" : "Inform Income";
    button.classList.add("action-button");

    button.onclick = async () => {
        try {
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                alert("User data not found!");
                return;
            }
    
            const userData = userSnap.data();
            const begintimestamp = userData.last_time || null; // Previous last_time
            const endtimestamp = serverTimestamp(); // New timestamp
    
            // Only log time when user is leaving (ishere was TRUE)
            if (isHere === true && begintimestamp) {
                const beginDate = begintimestamp.toDate(); // Convert Firestore timestamp to JS Date
                const endDate = new Date(); // Current timestamp as JS Date
                const diffInSeconds = Math.floor((endDate - beginDate) / 1000); // Calculate difference in seconds
                const weekNumber = getWeekNumber(begintimestamp);

                // Confirmation prompt
                const confirmUpdate = confirm(
                    `Is your data correct to update?\n\nBegin: ${formatShortTimestamp(beginDate)}\nEnd: ${formatShortTimestamp(endDate)}\nDuration: ${diffInSeconds} seconds`
                );

                if (!confirmUpdate) {
                    // Only update ishere status
                    await updateDoc(userDocRef, {
                        ishere: false
                    });
                    alert("Data update canceled. Only status changed.");
                    showActionButton(userDocRef, false);
                    return;
                }

                console.log(`Week Number: ${weekNumber}, Begin: ${beginDate}, End: ${endDate}, Diff: ${diffInSeconds} sec`);
    
                // Use begin timestamp as document ID
                const beginId = formatTimestampToId(begintimestamp);
                const nick = userData.nick; // Assuming "nick" is stored in user data
                const userRecordsPath = `timerecords/${nick}/${weekNumber}/${beginId}`;
                
                await setDoc(doc(db, userRecordsPath), {
                    begin: begintimestamp,
                    end: endtimestamp,
                    diff: diffInSeconds
                });
    
                // Reference to main total in the correct path
                const mainTotalRef = doc(db, `timerecords/${nick}/${weekNumber}/main`);
    
                // Check if "main" exists, create if not
                const mainSnap = await getDoc(mainTotalRef);
                if (!mainSnap.exists()) {
                    await setDoc(mainTotalRef, { total: diffInSeconds }); // Initialize if not exists
                } else {
                    await updateDoc(mainTotalRef, {
                        total: increment(diffInSeconds)
                    });
                }
    
                console.log("Updated main total for", userRecordsPath);
            }
    
            // Update user status (always executed)
            await updateDoc(userDocRef, {
                ishere: !isHere,
                last_time: endtimestamp
            });
    
            alert(`Status updated to ${!isHere ? "Income" : "Leave"}`);
            showActionButton(userDocRef, !isHere); // Update button dynamically
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status. Try again.");
        }
    };

    container.appendChild(button);
    console.log("Button added:", button.textContent);
}