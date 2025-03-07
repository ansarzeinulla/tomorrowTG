// // script.js
// import { fetchDataTG } from "./firebase.js";

// document.addEventListener("DOMContentLoaded", () => {
//     document.getElementById("fetchButton").addEventListener("click", async () => {
//         const inputText = document.getElementById("inputText").value;
        
//         // Split, trim, and validate input
//         let lines = inputText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        
//         for (let line of lines) {
//             if (line.length < 5 || line.length > 25) {
//                 alert(`Each line must be between 5 and 25 characters: "${line}" is invalid.`);
//                 return;
//             }
//         }

//         // Fetch and display results
//         let results = await fetchDataTG(lines);
//         document.getElementById("result").textContent = results.length > 0 ? results.join("\n") : "No data found!";
//     });
// });