// // whoishere.js
// import { fetchDataHERE } from "./firebase.js";

// export async function checkUsers() {
//     const users = await fetchDataHERE();

//     const column = document.getElementById("whoIsHereColumn");
//     column.innerHTML = ""; // Clear existing buttons before adding new ones

//     if (users.length === 0) {
//         column.innerHTML = "<p>No users are online.</p>";
//         return;
//     }

//     users.forEach(user => {
//         const button = document.createElement("button");
//         button.textContent = `${user.name} - ${user.nick} - ${user.tgnick}`;
//         button.style.display = "block";
//         button.style.margin = "5px";
//         button.style.padding = "10px";
//         button.style.fontSize = "14px";
//         button.style.cursor = "pointer";

//         button.onclick = () => {
//             window.location.href = `https://t.me/${user.tgnick}`;
//         };

//         column.appendChild(button);
//     });
// }