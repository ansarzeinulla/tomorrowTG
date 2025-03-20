import { db } from "./firebase.js";
import { collection, doc, setDoc, Timestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

//We get the button from register.html and add a function to it for click:
document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // WTF is this?? I do not know myself

    const name = document.getElementById("name").value.trim();
    const nick = document.getElementById("nick").value.trim();
    const tgnick = document.getElementById("tgnick").value.trim();
    const pin = document.getElementById("pin").value.trim();
    const messageBox = document.getElementById("message");

    // Validation of data
    if (!validateInput(name, nick, tgnick, pin)) {
        messageBox.textContent = "Invalid input. Please follow the rules.";
        return;
    }

    try {
        const userDocRef = doc(db, "users", nick);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            alert("Nickname already taken. Choose a different one.");
            return;
        }

        const userData = {
            name,
            nick,
            tgnick,
            pin,
            vip: "king", //For current registration
            last_time: Timestamp.now(),
            ishere: false
        };

        await setDoc(userDocRef, userData);
        alert("Registration Successful!");
        messageBox.textContent = "Success!";
    } catch (error) {
        console.error("Error registering user:", error);
        alert("Registration Failed!");
        messageBox.textContent = "Failed to register. Try again later.";
    }
});

// Function to validate input fields
function validateInput(name, nick, tgnick, pin) {
    const onlyEnglishRegex = /^[a-zA-Z0-9]*$/; //Only English Lettersa and Numbers
    const nameValid = name.length >= 3 && name.length <= 25;
    const nickValid = nick.length >= 3 && nick.length <= 25 && onlyEnglishRegex.test(nick);
    const tgnickValid = tgnick.length >= 3 && tgnick.length <= 25 && onlyEnglishRegex.test(tgnick);
    const pinValid = /^\d{0,6}$/.test(pin); //6 digit max long

    return nameValid && nickValid && tgnickValid && pinValid;
}

