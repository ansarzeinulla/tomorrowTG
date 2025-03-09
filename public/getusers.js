import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to fetch and filter users
export async function fetchAndDisplayUsers() {
    const inputText = document.getElementById("inputText").value.trim();
    const searchNicks = inputText 
        ? inputText.split("\n").map(line => line.trim().toLowerCase()) 
        : [];

    try {
        let usersList = [];

        if (searchNicks.length > 0) {
            // Search directly by document names instead of fetching all users
            for (const nick of searchNicks) {
                const userDoc = doc(db, "users", nick);
                const userSnap = await getDoc(userDoc);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    usersList.push(userData);
                } else {
                    console.log(`User ${nick} not found.`);
                }
            }
        } else {
            // Fetch all users and filter by ishere === true
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);

            usersSnapshot.forEach(doc => {
                let userData = doc.data();
                if (userData.ishere === true) {
                    usersList.push(userData);
                }
            });
        }

        displayUsers(usersList);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Function to display users as buttons
function displayUsers(users) {
    const container = document.getElementById("usersContainer");
    container.innerHTML = ""; // Clear previous buttons

    if (users.length === 0) {
        container.innerHTML = "<p>No users found.</p>";
        return;
    }

    let allNicks = []; // To store all nicks for clipboard copy

    users.forEach(user => {
        const button = document.createElement("button");
        button.textContent = `${user.name} - ${user.nick} - ${user.tgnick}`;
        button.classList.add("user-button");

        // If VIP is "king", apply fancy styling
        if (user.vip === "king") {
            button.style.color = "black";
            button.style.fontWeight = "bold";
            button.style.fontSize = "16px";
            button.style.textShadow = "0 0 10px gold, 0 0 20px orange";
        }

        button.onclick = () => {
            window.location.href = `https://t.me/${user.tgnick}`;
        };

        container.appendChild(button);
        allNicks.push(`@${user.nick}`);
    });

    // Copy all nicks to clipboard
    const nickString = allNicks.join(" ");
    navigator.clipboard.writeText(nickString).then(() => {
        showToast("Nicks copied to clipboard!");
    }).catch(err => console.error("Failed to copy:", err));
}

// Small toast notification function (non-intrusive)
function showToast(message) {
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "rgba(0, 0, 0, 0.7)";
    toast.style.color = "#fff";
    toast.style.padding = "10px 15px";
    toast.style.borderRadius = "5px";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "1000";
    toast.style.opacity = "1";
    toast.style.transition = "opacity 0.5s ease";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 2000);
}