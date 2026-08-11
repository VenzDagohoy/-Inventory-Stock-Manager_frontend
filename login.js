// const API_URL = "http://localhost:3000";
const API_URL = "https://inventory-stock-manager-backend.onrender.com/";

const loginForm = document.querySelector("#login-form");
const message = document.querySelector("#message");
const loginBtn = document.querySelector("#login-btn");
const loadingDiv = document.querySelector("#loading");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    
    loginBtn.disabled = true;
    loadingDiv.style.display = "block";
    message.textContent = "";
    message.className = "message";
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            message.textContent = data.message ?? "Login failed";
            message.className = "message error";
            
            loadingDiv.style.display = "none";
            loginBtn.disabled = false;
            return;
        }
        
        localStorage.setItem("accessToken", data.accessToken);
        
        loadingDiv.style.display = "none";
        message.textContent = "Login successful";
        message.className = "message success";
        
        window.location.href = "./index.html";
        
    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to the API";
        message.className = "message error";
        
        loadingDiv.style.display = "none";
        loginBtn.disabled = false;
    }
});