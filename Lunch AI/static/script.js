let currentRoom = "room-1";
const chatData = JSON.parse(localStorage.getItem("chatData")) || { "room-1": [] };
let roomCounter = localStorage.getItem("roomCounter") ? parseInt(localStorage.getItem("roomCounter")) : 1;

// Function to save chat data to localStorage
function saveChatData() {
    localStorage.setItem("chatData", JSON.stringify(chatData));
    localStorage.setItem("roomCounter", roomCounter);
    localStorage.setItem("currentRoom", currentRoom);
}

// Function to load chat history from localStorage
function loadChatHistory() {
    const savedChatData = JSON.parse(localStorage.getItem("chatData"));
    const savedCurrentRoom = localStorage.getItem("currentRoom");

    if (savedChatData) {
        Object.assign(chatData, savedChatData);
        currentRoom = savedCurrentRoom || "room-1";

        renderChatRooms();
        switchRoom(currentRoom, document.querySelector(`[data-room-id="${currentRoom}"]`));
    } else {
        renderChatRooms();
    }
}

// Function to render chat rooms
function renderChatRooms() {
    const chatRoomsList = document.getElementById("chat-rooms");
    chatRoomsList.innerHTML = "";

    for (let roomId in chatData) {
        const roomItem = document.createElement("li");
        roomItem.classList.add("chat-room-item");
        roomItem.setAttribute("data-room-id", roomId);

        // Get the first user's message in the chat room
        const firstUserMessage = chatData[roomId].find(msg => msg.sender === "user");
        const roomName = document.createElement("span");

        // Limit the number of characters and add ellipsis if the message is too long
        const roomNameText = firstUserMessage ? firstUserMessage.text : "No messages yet";
        roomName.textContent = roomNameText.length > 30 ? roomNameText.substring(0, 30) + "..." : roomNameText;  // Truncate to 30 characters

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-room-button");
        deleteButton.innerHTML = `<img src="/static/trash-icon.png" alt="Delete" class="trash-icon">`;
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteChatRoom(roomId);
        });

        roomItem.appendChild(roomName);
        roomItem.appendChild(deleteButton);

        roomItem.addEventListener("click", () => switchRoom(roomId, roomItem));
        chatRoomsList.appendChild(roomItem);
    }
}



// Function to switch between rooms
function switchRoom(roomId, roomElement) {
    const previousActiveRoom = document.querySelector(".chat-room-item.active");
    if (previousActiveRoom) previousActiveRoom.classList.remove("active");

    roomElement.classList.add("active");
    currentRoom = roomId;

    const chatbox = document.getElementById("chatbox");
    chatbox.innerHTML = "";

    chatData[roomId].forEach(msg => addMessage(msg.text, msg.sender, false));
    saveChatData();

    if (chatData[roomId].length === 0) {
        displayQuickMessages();
    }
}

// Function to add messages to the chatbox
function addMessage(text, sender, saveToData = true) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatbox.appendChild(messageDiv);

    // Automatically scroll to the bottom of the chatbox
    chatbox.scrollTop = chatbox.scrollHeight;

    // Hide quick messages when the user has typed a message
    if (sender === "user") {
        const quickMessagesContainer = document.getElementById("quick-messages-container");
        if (quickMessagesContainer) {
            quickMessagesContainer.style.display = "none"; // Hide quick messages
        }
    }

    if (saveToData) {
        chatData[currentRoom].push({ text, sender });
        saveChatData();
    }
}

// Fungsi untuk menampilkan pesan cepat
function displayQuickMessages() {
    const chatbox = document.getElementById("chatbox");
    const existingQuickMessages = document.getElementById("quick-messages-container");

    if (existingQuickMessages) {
        existingQuickMessages.remove();
    }

    // Only show quick messages if there are no previous user messages
    if (chatData[currentRoom].length === 0 || chatData[currentRoom].every(msg => msg.sender !== "user")) {
        const quickMessagesContainer = document.createElement("div");
        quickMessagesContainer.id = "quick-messages-container";
        quickMessagesContainer.classList.add("message", "quick-message", "bot");

        const randomMessages = ["Apa rekomendasi makanan pedas?", "Rekomendasi makanan manis apa?", "Apa makanan gurih yang enak?"];
        randomMessages.forEach((message) => {
            const option = document.createElement("div");
            option.classList.add("quick-option");
            option.textContent = message;

            option.addEventListener("click", () => {
                addMessage(message, "user");
                sendMessageToBot(message);
                quickMessagesContainer.remove();
            });

            quickMessagesContainer.appendChild(option);
        });

        chatbox.appendChild(quickMessagesContainer);
        chatbox.scrollTop = chatbox.scrollHeight;  // Ensure the scroll is at the bottom when showing quick messages
    }
}


// Function to send a message to the bot
async function sendMessageToBot(message) {
    const chatbox = document.getElementById("chatbox");

    // Display typing bubble
    showTypingBubble();

    try {
        const response = await fetch("/get_food_recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();

        // Remove typing bubble and display bot's response
        removeTypingBubble();
        addMessage(data.response, "bot");
    } catch (error) {
        console.error("Error fetching response:", error);
        removeTypingBubble();
        addMessage("Maaf, terjadi kesalahan pada server.", "bot");
    }
}


// Function to create a new chat room
function startNewChat() {
    let availableRoomNumber = 1;

    while (chatData[`room-${availableRoomNumber}`]) {
        availableRoomNumber++;
    }

    const newRoomId = `room-${availableRoomNumber}`;
    chatData[newRoomId] = [];
    roomCounter = availableRoomNumber;

    saveChatData();
    renderChatRooms();
    switchRoom(newRoomId, document.querySelector(`[data-room-id="${newRoomId}"]`));
}

// Function to delete chat room
function deleteChatRoom(roomId) {
    delete chatData[roomId];
    saveChatData();

    // If no rooms remain, create Chat Room 1 empty
    if (Object.keys(chatData).length === 0) {
        chatData["room-1"] = [];
        roomCounter = 1;
        currentRoom = "room-1";
    } else {
        // Switch to the last remaining room
        const remainingRooms = Object.keys(chatData);
        currentRoom = remainingRooms[remainingRooms.length - 1];
    }

    saveChatData();
    renderChatRooms();
    switchRoom(currentRoom, document.querySelector(`[data-room-id="${currentRoom}"]`));
}

// Function to show typing bubble
function showTypingBubble() {
    const chatbox = document.getElementById("chatbox");
    const typingBubble = document.createElement("div");
    typingBubble.classList.add("message", "typing");
    typingBubble.id = "typing-bubble";

    // Add three dots for animation
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        typingBubble.appendChild(dot);
    }

    chatbox.appendChild(typingBubble);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to remove typing bubble
function removeTypingBubble() {
    const typingBubble = document.getElementById("typing-bubble");
    if (typingBubble) typingBubble.remove();
}

// Toggle Sidebar
document.getElementById("toggle-sidebar").addEventListener("click", () => {
    const sidebarContainer = document.querySelector(".sidebar-container");
    const chatContainer = document.querySelector(".chat-container");
    const miniSidebar = document.querySelector(".mini-sidebar");
    const newChatButton = document.querySelector(".new-chat-button");
    const logo = document.querySelector(".mini-logo");

    // Adjust chat-container margin based on sidebar state
    if (sidebarContainer.classList.contains("expanded")) {
        sidebarContainer.classList.remove("expanded");
        chatContainer.classList.remove("expanded");
        chatContainer.classList.add("minimized");
        miniSidebar.style.display = 'flex';
        newChatButton.style.display = 'block';
        logo.style.display = 'block';
    } else {
        sidebarContainer.classList.add("expanded");
        chatContainer.classList.add("expanded");
        chatContainer.classList.remove("minimized");
        miniSidebar.style.display = 'none';
        newChatButton.style.display = 'none';
        logo.style.display = 'none';
    }
});

// Open Sidebar
document.getElementById("open-sidebar").addEventListener("click", () => {
    const sidebarContainer = document.querySelector(".sidebar-container");
    const chatContainer = document.querySelector(".chat-container");

    sidebarContainer.classList.add("expanded");
    chatContainer.classList.add("expanded");
    chatContainer.classList.remove("minimized");
});

// Close Sidebar
document.getElementById("close-sidebar").addEventListener("click", () => {
    const sidebarContainer = document.querySelector(".sidebar-container");
    const chatContainer = document.querySelector(".chat-container");

    sidebarContainer.classList.remove("expanded");
    chatContainer.classList.remove("expanded");
    chatContainer.classList.add("minimized");
});


// Initialize load chat history
document.addEventListener("DOMContentLoaded", loadChatHistory);

// Misal kita tangkap elemen mini logo:
const miniLogo = document.querySelector('.mini-logo');
const miniLogo2 = document.querySelector('.mini-logo-2');

// Jika elemen mini logo ditemukan, tambahkan event listener:
if (miniLogo) {
  miniLogo.addEventListener('click', () => {
    // Alihkan ke halaman about
    window.location.href = "/about";
  });
}

if (miniLogo2) {
  miniLogo2.addEventListener('click', () => {
    // Alihkan ke halaman about
    window.location.href = "/about";
  });
}

// Event listeners
document.getElementById("new-chat").addEventListener("click", startNewChat);
document.getElementById("mini-new-chat").addEventListener("click", startNewChat);
// Event listener untuk textarea: kirim pesan jika Enter ditekan tanpa Shift, dan tambahkan newline jika Shift+Enter ditekan
const userInput = document.getElementById("user-input");
userInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Mencegah penambahan newline
        document.getElementById("chat-form").dispatchEvent(new Event("submit", { cancelable: true }));
    }
});

// Event listener untuk submit form
document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    userInput.value = "";

    sendMessageToBot(message);
});

// Event listeners untuk membuat chat baru
document.getElementById("new-chat").addEventListener("click", startNewChat);
document.getElementById("mini-new-chat").addEventListener("click", startNewChat);
