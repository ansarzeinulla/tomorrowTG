import { db } from "./firebase.js";
import { doc, getDoc,getDocs, addDoc, collection, increment, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

//TimeStamp -> Month dat hour:minute:second format
function formatShortTimestamp(date) {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${month} ${day} ${hours}:${minutes}:${seconds}`;
}

//Function that for given username and pin does SIGNING IN
export async function loginWithPin(username, pin) {
    //Trim input values from space
    username = username.trim();
    pin = pin.trim();

    // Validate username length (3-25 characters)
    if (username.length < 3 || username.length > 25) {
        alert("Username must be between 3 and 25 characters.");
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
            //It means that the user EXISTS
            const userData = userSnap.data();
            if (userData.pin == pin) {
                alert("YES: Login successful!");
                showActionButton(userDocRef, userData.ishere); // It shows the Buttons for Signed In users

                const loginHeader = document.getElementById("loginHeader");
                loginHeader.textContent = userData.nick || username; // Update <h2> label to show nick instead of "Login"

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

                // Get total time for the week and Display it on totalLabel
                const mainRef = doc(db, `${weekPath}/main`);
                getDoc(mainRef).then(mainSnap => {
                    const totalTime = mainSnap.exists() ? mainSnap.data().total : 0;
                    const totalLabel = document.createElement("p");
                    totalLabel.textContent = `Total time for week: ${(totalTime/60).toFixed(2)} minutes`;
                    recordsContainer.appendChild(totalLabel);
                }).catch(error => console.error("Error fetching total time:", error));

                // Get individual records and show them on <p>
                const weekRef = collection(db, weekPath);
                getDocs(weekRef).then(snapshot => {
                    snapshot.forEach(docSnap => {
                        if (docSnap.id === "main") return;

                        const data = docSnap.data();
                        const begin = formatShortTimestamp(data.begin.toDate());
                        const end = formatShortTimestamp(data.end.toDate());
                        const diff = data.diff;

                        const recordLabel = document.createElement("p");
                        recordLabel.textContent = `${begin} + ${(diff/60).toFixed(2)}m = ${end}`;
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

//Get Week Number starting from March 3 of 2025
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
    // Define the reference date: March 3rd, 2025 (Monday of week 10)
    const referenceDate = new Date(2025, 2, 3); // Month is 0-based, so 2 is March

    // Calculate the difference in time (in milliseconds) between the given date and the reference date
    const timeDifference = date - referenceDate;

    // Convert the time difference into days
    const daysDifference = Math.floor(timeDifference / (24 * 60 * 60 * 1000));

    // Calculate the number of full weeks between the reference date and the given date
    const weekNumber = Math.floor(daysDifference / 7) + 10; // Add 10 to match the week number

    return weekNumber;
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

    //Creating button for Informing Income and Leave
    const button = document.createElement("button");
    button.textContent = isHere ? "Inform Leave" : "Inform Income";
    button.classList.add("action-button");

    //Action for clicking the button
    button.onclick = async () => {
        try {
            const userSnap = await getDoc(userDocRef);
            //userSnap contains the data of user
            if (!userSnap.exists()) {
                alert("User data not found!");
                return;
            }
    
            const userData = userSnap.data();
            const begintimestamp = userData.last_time || null; // Previous last_time
            const endtimestamp = serverTimestamp(); // New timestamp
    
            //We are leaving
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
    //We added this button to container
}