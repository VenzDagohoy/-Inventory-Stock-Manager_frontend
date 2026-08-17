// const API_URL = "http://localhost:3000";
const API_URL = "https://inventory-stock-manager-backend.onrender.com";

const token = localStorage.getItem("accessToken");
if (!token) {
    window.location.href = "./login.html";
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("accessToken");
        window.location.href = "./login.html";
    });
}

function handleUnauthorized(response) {
    if (response.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = "./login.html";
        return true;
    }
    return false;
}

// Navigation Llgic
window.switchTab = function(tabName) {
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("history-view").classList.add("hidden");
    
    document.getElementById("tab-dashboard").classList.remove("active");
    document.getElementById("tab-history").classList.remove("active");
    
    document.getElementById(`${tabName}-view`).classList.remove("hidden");
    document.getElementById(`tab-${tabName}`).classList.add("active");
    
    if (tabName === "history") {
        fetchHistory();
    } else {
        fetchProducts();
    }
};

// View variables
const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const productTable = document.getElementById("product-table");
const loadingDiv = document.getElementById("loading");
const formMessage = document.getElementById("form-message");
const editCard = document.getElementById("edit-card");
const editForm = document.getElementById("edit-form");

// DAshboared function
async function fetchProducts() {
    // Clear the search bar when resetting the table
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error("Server error");
        
        const data = await response.json();
        renderTable(data.products);
    } catch (error) {
        loadingDiv.style.display = "block"; 
        loadingDiv.textContent = "Failed to load products.";
    }
}

// Search by id and name
window.performSearch = async function() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;
    
    // Check if the query contains only digits or id
    const isId = /^\d+$/.test(query);
    
    if (isId) {
        try {
            // Try search by ID
            const idResponse = await fetch(`${API_URL}/products/${query}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (handleUnauthorized(idResponse)) return;
            
            if (idResponse.ok) {
                const data = await idResponse.json();
                renderTable([data.product]);
                return; // If ID was successfully found
            }
        } catch (error) {
            console.error("Error searching by ID:", error);
        }
    }
    
    // If not an id, or or id not found, go back to search by name
    try {
        const nameResponse = await fetch(`${API_URL}/products?name=${query}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (handleUnauthorized(nameResponse)) return;
        
        const data = await nameResponse.json();
        renderTable(data.products);
    } catch (error) {
        console.error("Error searching by Name:", error);
    }
};

function renderTable(products) {
    loadingDiv.style.display = "none";
    productTable.style.display = "table";          
    productList.innerHTML = "";
    
    let overallSold = 0;
    let overallEarnings = 0;
    
    if (!products || products.length === 0) {
        productList.innerHTML = `<tr><td colspan="5" class="text-center">No products found.</td></tr>`;
        document.getElementById("overall-sold").textContent = 0;
        document.getElementById("overall-earnings").textContent = "Php 0.00";
        return;
    }
    
    products.forEach(product => {
        const soldAmount = product.sold || 0; 
        const productEarnings = product.price * soldAmount;
        
        overallSold += soldAmount;
        overallEarnings += productEarnings;
        
        const row = document.createElement("tr");
        const sellDisabled = product.stock <= 0 ? "disabled" : "";
        const stockClass = product.stock <= 0 ? "out-of-stock" : "in-stock";
        
        row.innerHTML = `
            <td>                 
                <div class="product-name">${product.name}</div>                 
                <div class="product-id">ID: #${product.id}   Php ${Number(product.price).toFixed(2)}</div>             
            </td>             
            <td><span class="badge ${stockClass}">${product.stock}</span></td>             
            <td><strong>${soldAmount}</strong></td>             
            <td class="text-success font-weight-bold">Php ${productEarnings.toFixed(2)}</td>             
            <td class="text-right">                 
                <button class="btn-sell-product action-btn" ${sellDisabled} onclick="sellProduct(${product.id})">Sell</button>                 
                <button class="btn-edit-product action-btn" onclick="openEditForm(${product.id}, '${product.name}', ${product.price}, ${product.stock})">Edit</button>                 
                <button class="btn-delete-product action-btn" onclick="deleteProduct(${product.id})">Del</button>             
            </td>         
        `;
        productList.appendChild(row);
    });
    
    document.getElementById("overall-sold").textContent = overallSold;
    document.getElementById("overall-earnings").textContent = "Php " + overallEarnings.toFixed(2);
}

// Reset daily logic
document.getElementById("reset-daily-btn").addEventListener("click", async () => {
    if (!confirm("Are you sure? This will save your current totals to History and reset today's sold numbers back to 0.")) return;
    try {
        const response = await fetch(`${API_URL}/products/reset-daily`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (handleUnauthorized(response)) return;
        const result = await response.json();
        alert(result.message);
        
        if (response.ok) {
            fetchProducts();
        }
    } catch (error) {
        alert("Failed to reset daily stats.");
    }
});

// Create product form
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const price = Number(document.getElementById("price").value);
    const stock = Number(document.getElementById("stock").value);
    
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ name, price, stock })
        });
        
        if (handleUnauthorized(response)) return;
        const result = await response.json();
        
        if (!response.ok) {
            formMessage.textContent = result.message;
            formMessage.className = "message error";
            return;
        }
        
        formMessage.textContent = "Product added successfully!";
        formMessage.className = "message success";
        productForm.reset();
        fetchProducts();
    } catch (error) {
        formMessage.textContent = "Server error occurred.";
        formMessage.className = "message error";
    }
});

window.sellProduct = async function(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}/sell`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (handleUnauthorized(response)) return;
        
        if (response.ok) {
            // Refresh the current view based on the active search query
            const searchVal = document.getElementById("searchInput")?.value;
            if (searchVal) performSearch();
            else fetchProducts();
        } else {
            const data = await response.json();
            alert(data.message || "Failed to sell product.");
        }
    } catch (error) {
        console.error("Error selling product:", error);
    }
};

window.openEditForm = function(id, name, price, stock) {
    editCard.classList.remove("hidden");
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-name").value = name;
    document.getElementById("edit-price").value = price;
    document.getElementById("edit-stock").value = stock;
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.cancelEdit = function() {
    editCard.classList.add("hidden"); 
    editForm.reset(); 
};

editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value;
    const price = Number(document.getElementById("edit-price").value);
    const stock = Number(document.getElementById("edit-stock").value);
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ name, price, stock })
        });
        if (handleUnauthorized(response)) return;
        const result = await response.json();
        if (!response.ok) {
            alert(result.message);
            return;
        }
        cancelEdit();
        fetchProducts(); 
    } catch (error) {
        console.error("Error updating product:", error);
    }
});

window.deleteProduct = async function(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (handleUnauthorized(response)) return;
        if (response.ok) fetchProducts();
    } catch (error) {
        console.error("Error deleting product:", error);
    }
};

// History function
async function fetchHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = `<tr><td colspan="5" class="text-center">Loading history...</td></tr>`;
    
    try {
        const response = await fetch(`${API_URL}/history`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (handleUnauthorized(response)) return;
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        
        if (!data.history || data.history.length === 0) {
            historyList.innerHTML = `<tr><td colspan="5" class="text-center">No history records found.</td></tr>`;
            return;
        }
        historyList.innerHTML = "";
        data.history.forEach(record => {
            const dateObj = new Date(record.record_date);
            const timeObj = new Date(record.created_at);
            
            let detailsList = "<ul style='margin: 0; padding-left: 15px; font-size: 13.6px; color: var(--text-main);'>";
            if (record.items_sold_details) {
                const items = JSON.parse(record.items_sold_details);
                items.forEach(item => {
                    detailsList += `<li>${item.sold}x <strong>${item.name}</strong> (Php ${Number(item.price).toFixed(2)} each)</li>`;
                });
            } else {
                detailsList += "<li><em style='color: var(--text-muted);'>No details available (Old record)</em></li>";
            }
            detailsList += "</ul>";
            
            const row = document.createElement("tr");
            row.innerHTML = `                 
                <td><strong>${dateObj.toLocaleDateString()}</strong></td>                 
                <td>${record.total_sold} items</td>                 
                <td>${detailsList}</td>
                <td class="text-success font-weight-bold">Php ${Number(record.total_earnings).toFixed(2)}</td>                 
                <td><span class="product-id">${timeObj.toLocaleTimeString()}</span></td>             
            `;
            historyList.appendChild(row);
        });
    } catch (error) {
        historyList.innerHTML = `<tr><td colspan="5" class="text-center error">Error loading history</td></tr>`;
    }
}

// Initial boot
fetchProducts();