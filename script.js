
let wardrobe = [
  { id: 1, name: "White T-shirt", category: "Tops", emoji: "👕", colour: "White" },
  { id: 2, name: "Blue jeans", category: "Bottoms", emoji: "👖", colour: "Blue" },
  { id: 3, name: "Black trousers", category: "Bottoms", emoji: "👖", colour: "Black" },
  { id: 4, name: "Sneakers", category: "Shoes", emoji: "👟", colour: "White" },
  { id: 5, name: "Denim jacket", category: "Outerwear", emoji: "🧥", colour: "Blue" },
  { id: 6, name: "Black shirt", category: "Tops", emoji: "👔", colour: "Black" }
];

let savedOutfits = [];
let weeklyPlan = {};

const days = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
];

let currentOutfit = null;


// Basic HTML escaping

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}


// Wardrobe

function renderWardrobe() {
  const grid = document.getElementById("wardrobeGrid");
  if (!grid) return;

  const search = (
    document.getElementById("wardrobeSearch")?.value || ""
  ).toLowerCase();

  const category =
    document.getElementById("categoryFilter")?.value || "All";

  const filtered = wardrobe.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search) ||
      item.colour.toLowerCase().includes(search);

    return matchesSearch &&
      (category === "All" || category === item.category);
  });

  grid.innerHTML = "";

  if (!filtered.length) {
    grid.innerHTML =
      '<p class="muted">No matching items found.</p>';
  }

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "card wardrobe-item";

    card.innerHTML = `
      <div class="item-picture">${escapeHTML(item.emoji)}</div>
      <div class="item-info">
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.category)} · ${escapeHTML(item.colour)}</p>
        <button class="btn btn-danger btn-small"
          onclick="deleteItem(${item.id})">Remove</button>
      </div>
    `;

    grid.appendChild(card);
  });

  updateStats();
}

function openAddItem() {
  document.getElementById("addItemForm")?.classList.remove("hidden");
}

function closeAddItem() {
  document.getElementById("addItemForm")?.classList.add("hidden");
}

function addItem() {
  const name = document.getElementById("newItemName").value.trim();
  const category = document.getElementById("newItemCategory").value;
  const emoji = document.getElementById("newItemEmoji").value.trim() || "👕";
  const colour = document.getElementById("newItemColour").value.trim() || "Not specified";

  if (!name) {
    alert("Please enter an item name.");
    return;
  }

  wardrobe.push({
    id: Date.now(),
    name,
    category,
    emoji,
    colour
  });

  ["newItemName", "newItemEmoji", "newItemColour"].forEach(id => {
    document.getElementById(id).value = "";
  });

  closeAddItem();
  renderWardrobe();
}

function deleteItem(id) {
  wardrobe = wardrobe.filter(item => item.id !== id);
  renderWardrobe();
}


// Outfit recommendations

function chooseItem(items, occasion) {
  if (["Work", "Special event", "Dinner"].includes(occasion)) {
    const dark = items.find(item =>
      item.colour.toLowerCase() === "black"
    );

    if (dark) return dark;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function generateOutfit() {
  const occasion = document.getElementById("occasion").value;
  const weather = document.getElementById("weather").value;
  const mood = document.getElementById("mood").value;

  const tops = wardrobe.filter(i => i.category === "Tops");
  const bottoms = wardrobe.filter(i => i.category === "Bottoms");
  const shoes = wardrobe.filter(i => i.category === "Shoes");
  const outerwear = wardrobe.filter(i => i.category === "Outerwear");

  if (!tops.length || !bottoms.length || !shoes.length) {
    document.getElementById("recommendations").innerHTML =
      '<div class="card">Please add at least one top, one bottom and one pair of shoes.</div>';
    return;
  }

  const top = chooseItem(tops, occasion);
  const bottom = chooseItem(bottoms, occasion);
  const shoe = shoes[0];

  const needsLayer = ["Cold", "Rainy", "Windy"].includes(weather);
  const layer = needsLayer && outerwear.length ? outerwear[0] : null;

  currentOutfit = {
    top, bottom, shoe, layer, occasion, weather, mood
  };

  const items = [top, bottom, shoe];

  if (layer) items.push(layer);

  document.getElementById("recommendations").innerHTML = `
    <div class="card">
      <h2>Your suggested outfit</h2>

      <div class="outfit-visual">
        ${items.map(item => `<span>${escapeHTML(item.emoji)}</span>`).join("")}
      </div>

      <span class="pill">${escapeHTML(occasion)}</span>
      <span class="pill">${escapeHTML(weather)}</span>
      <span class="pill">${escapeHTML(mood)}</span>

      <h2 class="spaced">Your outfit includes</h2>
      <p>${items.map(item => escapeHTML(item.name)).join(" · ")}</p>

      <div class="reason">
        <strong>Why this works</strong><br>
        This combination uses items already in your wardrobe.
        It is a starting suggestion for your ${escapeHTML(occasion.toLowerCase())}.
        ${layer ? "The extra layer may help in the selected weather." : ""}
        Adjust it to suit your own comfort and style.
      </div>

      <button class="btn" onclick="saveOutfit()">Save outfit</button>
      <button class="btn btn-secondary" onclick="generateOutfit()">Try another</button>
    </div>
  `;
}

function saveOutfit() {
  if (!currentOutfit) return;

  savedOutfits.push(currentOutfit);
  updateStats();

  alert("Your outfit has been saved!");
}


// Weekly planner

function renderPlanner() {
  const container = document.getElementById("plannerDays");
  if (!container) return;

  container.innerHTML = "";

  days.forEach(day => {
    const row = document.createElement("div");
    row.className = "day-row";

    row.innerHTML = `
      <div>
        <strong>${day}</strong>
        <p class="muted">
          ${escapeHTML(weeklyPlan[day] || "No outfit planned")}
        </p>
      </div>
      <button class="btn btn-secondary btn-small"
        onclick="planDay('${day}')">
        ${weeklyPlan[day] ? "Change" : "Add outfit"}
      </button>
    `;

    container.appendChild(row);
  });

  renderSavedOutfits();
}

function planDay(day) {
  if (!savedOutfits.length) {
    alert("Generate and save an outfit first.");
    return;
  }

  const choices = savedOutfits.map((outfit, index) =>
    `${index + 1}. ${outfit.top.name} + ${outfit.bottom.name}`
  );

  const answer = prompt(
    "Choose an outfit number:\n" + choices.join("\n")
  );

  const index = Number(answer) - 1;

  if (Number.isInteger(index) &&
      index >= 0 && index < savedOutfits.length) {
    const outfit = savedOutfits[index];

    weeklyPlan[day] =
      `${outfit.top.name} + ${outfit.bottom.name}`;

    renderPlanner();
  }
}

function renderSavedOutfits() {
  const container = document.getElementById("savedOutfitList");
  if (!container) return;

  if (!savedOutfits.length) {
    container.innerHTML =
      '<p class="muted">Your saved outfits will appear here.</p>';
    return;
  }

  container.innerHTML = savedOutfits.map((outfit, index) => `
    <div class="day-row">
      <p>
        ${escapeHTML(outfit.top.name)} +
        ${escapeHTML(outfit.bottom.name)}
      </p>
      <button class="btn btn-small btn-secondary"
        onclick="selectSavedOutfit(${index})">
        View
      </button>
    </div>
  `).join("");
}

function selectSavedOutfit(index) {
  const outfit = savedOutfits[index];

  alert(
    "Outfit: " + outfit.top.name + " + " + outfit.bottom.name
  );
}


// Ask friends

function shareOutfit() {
  const name = document.getElementById("friendName").value.trim();
  const question = document.getElementById("friendQuestion").value.trim();
  const hideFace = document.getElementById("hideFace").checked;

  if (!name || !question) {
    alert("Please enter a friend's name and your question.");
    return;
  }

  document.getElementById("shareMessage").innerHTML = `
    <div class="reason">
      <strong>Demo share prepared</strong><br>
      Recipient: ${escapeHTML(name)}<br>
      Question: ${escapeHTML(question)}<br>
      Privacy option: ${hideFace ? "Face/background hiding selected" : "No hiding selected"}<br>
      Intended expiry: 24 hours<br><br>
      No message has actually been sent.
    </div>
  `;
}

function skipSharing() {
  document.getElementById("friendQuestion").value = "";
  document.getElementById("shareMessage").innerHTML =
    '<p class="success-message">You can continue without sharing.</p>';
}


// Wardrobe gap checker

function checkGaps() {
  const occasion = document.getElementById("gapOccasion").value;
  const result = document.getElementById("gapResult");

  const hasTop = wardrobe.some(i => i.category === "Tops");
  const hasBottom = wardrobe.some(i => i.category === "Bottoms");
  const hasShoes = wardrobe.some(i => i.category === "Shoes");

  const missing = [];

  if (!hasTop) missing.push("a suitable top");
  if (!hasBottom) missing.push("suitable bottoms");
  if (!hasShoes) missing.push("suitable shoes");

  if (!missing.length) {
    result.innerHTML = `
      <div class="reason">
        <strong>You may already have what you need!</strong><br>
        Your wardrobe contains tops, bottoms and shoes.
        Try creating an outfit before considering a purchase
        for your ${escapeHTML(occasion.toLowerCase())}.
      </div>
    `;
  } else {
    result.innerHTML = `
      <div class="reason">
        Your wardrobe may need ${missing.join(", ")}.
        Check what you own before deciding whether to shop.
      </div>
    `;
  }
}


// Profile

function saveProfile() {
  const name = document.getElementById("profileName").value.trim();

  document.getElementById("profileMessage").innerHTML = `
    <p class="success-message">
      Preferences updated for ${escapeHTML(name || "StylePath User")}.
      (Demo only)
    </p>
  `;
}


// Dashboard counters

function updateStats() {
  const wardrobeCount = document.getElementById("wardrobeCount");
  const savedCount = document.getElementById("savedCount");

  if (wardrobeCount) wardrobeCount.textContent = wardrobe.length;
  if (savedCount) savedCount.textContent = savedOutfits.length;
}


// Initialise the current page

document.addEventListener("DOMContentLoaded", () => {
  renderWardrobe();
  renderPlanner();
  updateStats();
});
