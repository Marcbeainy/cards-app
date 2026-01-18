const APP_PASSWORD = "1234"; 
const PRICE_PER_CARD = 10; // always $10 per card
let people = JSON.parse(localStorage.getItem("people")) || [];
let totalOwed = Number(localStorage.getItem("totalOwed")) || 0;
let earned = JSON.parse(localStorage.getItem("earned")) || []; 
let actions = JSON.parse(localStorage.getItem("actions")) || [];
let editIndex = null;

// Unlock app
function unlock() {
  const input = document.getElementById("password").value;
  if (input === APP_PASSWORD) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("mainApp").classList.remove("hidden");
    render();
  }
}

// Save or edit person
function savePerson() {
  const name = document.getElementById("name").value;
  const cards = Number(document.getElementById("cards").value);

  if (!name || !cards) return;

  const money = cards * PRICE_PER_CARD;

  if (editIndex === null) {
    people.push({ name, cards, money });
    addAction(`Added ${name}`, money);
  } else {
    totalOwed -= people[editIndex].money; 
    addAction(`Edited ${people[editIndex].name}`, money);
    people[editIndex] = { name, cards, money };
    editIndex = null;
  }

  totalOwed += money;
  saveAll();
  clearFields();
  render();
}

// Render everything
function render() {
  const list = document.getElementById("list");
  const total = document.getElementById("total");
  const earnedList = document.getElementById("earnedList");
  const totalEarnedEl = document.getElementById("totalEarned");
  const tableBody = document.querySelector("#actionTable tbody");

  // Render people
  list.innerHTML = "";
  people.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.name}</strong><br>
      ${p.cards} cards – $${p.money.toFixed(2)}
      <div class="actions">
        <button onclick="editPerson(${i})">Edit</button>
        <button onclick="deletePerson(${i})">Delete</button>
        <button onclick="settlePerson(${i})">Settle</button>
      </div>
    `;
    list.appendChild(li);
  });

  total.textContent = `Total owed: $${totalOwed.toFixed(2)}`;

  // Render earned list and total earned
  earnedList.innerHTML = "";
  let sumEarned = 0;
  earned.forEach((amt) => {
    sumEarned += amt;
    const li = document.createElement("li");
    li.textContent = `Earned: $${amt.toFixed(2)}`;
    earnedList.appendChild(li);
  });
  totalEarnedEl.textContent = `$${sumEarned.toFixed(2)}`;

  // Render action table
  tableBody.innerHTML = "";
  actions.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.date}</td><td>${a.action}</td><td>${a.amount ? "$"+a.amount.toFixed(2) : "-"}</td>`;
    tableBody.appendChild(tr);
  });
}

// Edit person
function editPerson(i) {
  const p = people[i];
  document.getElementById("name").value = p.name;
  document.getElementById("cards").value = p.cards;
  editIndex = i;
  totalOwed -= p.money;
}

// Delete person
function deletePerson(i) {
  totalOwed -= people[i].money;
  addAction(`Deleted ${people[i].name}`, people[i].money);
  people.splice(i, 1);
  saveAll();
  render();
}

// Clear inputs
function clearFields() {
  document.getElementById("name").value = "";
  document.getElementById("cards").value = "";
}

// Settle a person
function settlePerson(i) {
  const person = people[i];
  const money = person.money;
  totalOwed -= money;
  earned.push(money);
  addAction(`Settled payment for ${person.name}`, money);
  people.splice(i, 1);
  saveAll();
  render();
}

// Add action to log
function addAction(action, amount = null) {
  const date = new Date().toLocaleString();
  actions.push({ date, action, amount });
}

// Reset all data
function resetAll() {
  if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
    people = [];
    totalOwed = 0;
    earned = [];
    actions = [];
    saveAll();
    render();
  }
}

// Save everything
function saveAll() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("totalOwed", totalOwed);
  localStorage.setItem("earned", JSON.stringify(earned));
  localStorage.setItem("actions", JSON.stringify(actions));
}

// Export backup
function exportData() {
  const data = { people, totalOwed, earned, actions };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cards-backup.json";
  a.click();
}

// Import backup
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    people = data.people || [];
    totalOwed = data.totalOwed || 0;
    earned = data.earned || [];
    actions = data.actions || [];
    saveAll();
    render();
  };
  reader.readAsText(file);
}

// Initial render
render();
