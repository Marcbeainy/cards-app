const PASSWORD = "1234";
const CARD_PRICE = 10;

/* ---------- STATE ---------- */
let people = JSON.parse(localStorage.getItem("people")) || [];
let donations = JSON.parse(localStorage.getItem("donations")) || [];
let totalCards = Number(localStorage.getItem("totalCards")) || 0;
let soldCards = Number(localStorage.getItem("soldCards")) || 0;
let earned = Number(localStorage.getItem("earned")) || 0;
let editIndex = null;

/* ---------- UNLOCK ---------- */
function unlock() {
  if (document.getElementById("password").value === PASSWORD) {
    document.getElementById("lock").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
    render();
  } else {
    alert("Wrong password");
  }
}

/* ---------- TOTAL CARDS ---------- */
function saveTotalCards() {
  totalCards = Number(document.getElementById("totalCardsInput").value) || 0;
  persist();
  render();
}

/* ---------- ADD / EDIT ---------- */
function savePerson() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const cardsTaken = Number(document.getElementById("cards").value);

  if (!name || cardsTaken <= 0) return;

  if (editIndex === null) {
    people.push({
      name,
      phone,
      cardsTaken,
      cardsReturned: 0,
      cardsRemaining: cardsTaken,
      moneyOwed: cardsTaken * CARD_PRICE,
      paidAmount: 0,
      settled: false
    });
  } else {
    const p = people[editIndex];
    p.name = name;
    p.phone = phone;
    p.cardsTaken = cardsTaken;
    // Fix: Remaining is Taken minus both physically Returned and already Paid for
    p.cardsRemaining = p.cardsTaken - p.cardsReturned - (p.paidAmount / CARD_PRICE);
    p.moneyOwed = p.cardsRemaining * CARD_PRICE;
    editIndex = null;
  }

  clearInputs();
  persist();
  render();
}

/* ---------- EDIT ---------- */
function editPerson(i) {
  const p = people[i];
  editIndex = i;
  document.getElementById("name").value = p.name;
  document.getElementById("phone").value = p.phone;
  document.getElementById("cards").value = p.cardsTaken;
}

/* ---------- RETURN ---------- */
function returnCards(i) {
  const p = people[i];
  const returned = Number(prompt(`Return cards (max ${p.cardsRemaining})`));
  if (!returned || returned <= 0 || returned > p.cardsRemaining) return;
  
  // This is the ONLY place where cardsReturned should increase
  p.cardsReturned += returned;
  p.cardsRemaining -= returned;
  p.moneyOwed = p.cardsRemaining * CARD_PRICE;
  persist();
  render();
}

/* ---------- FULL SETTLE ---------- */
function settlePerson(i) {
  const p = people[i];
  const amount = p.cardsRemaining * CARD_PRICE;

  p.paidAmount += amount;
  soldCards += p.cardsRemaining;
  earned += amount;

  // FIX: Do NOT increase p.cardsReturned here.
  p.cardsRemaining = 0;
  p.moneyOwed = 0;
  p.settled = true;

  persist();
  render();
}

/* ---------- PARTIAL SETTLE ---------- */
function partialSettlePerson(i) {
  const p = people[i];
  if (p.cardsRemaining <= 0) {
    settlePerson(i);
    return;
  }

  const qty = Number(
    prompt(`How many cards to settle? (max ${p.cardsRemaining})`)
  );

  if (!qty || qty <= 0 || qty > p.cardsRemaining) return;

  const amount = qty * CARD_PRICE;

  // Reduce remaining, but DO NOT increase cardsReturned. 
  // This keeps "Returned" and "Paid" separate.
  p.cardsRemaining -= qty;
  p.moneyOwed = p.cardsRemaining * CARD_PRICE;
  p.paidAmount += amount;

  soldCards += qty;
  earned += amount;

  if (p.cardsRemaining === 0) {
    p.settled = true;
  }

  persist();
  render();
}

/* ---------- DELETE ---------- */
function deletePerson(i) {
  if (!confirm("Delete this person?")) return;
  people.splice(i, 1);
  persist();
  render();
}

/* ---------- DONATION ---------- */
function addDonation() {
  const amount = Number(document.getElementById("donationAmount").value);
  if (!amount || amount <= 0) return;
  earned += amount;
  donations.push({ amount, date: new Date().toLocaleString() });
  document.getElementById("donationAmount").value = "";
  persist();
  render();
}

/* ---------- BACKUP ---------- */
function backupData() {
  const data = { people, donations, totalCards, soldCards, earned };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "event-backup.json";
  a.click();
}

/* ---------- RESTORE ---------- */
function restoreData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const d = JSON.parse(reader.result);
    people = d.people || [];
    donations = d.donations || [];
    totalCards = d.totalCards || 0;
    soldCards = d.soldCards || 0;
    earned = d.earned || 0;
    persist();
    render();
    alert("Backup restored");
  };
  reader.readAsText(file);
}

/* ---------- EXCEL ---------- */
function exportExcel() {
  let csv = "Name,Phone,Taken,Returned,Remaining,Owed,Paid,Status\n";
  people.forEach(p => {
    csv += `${p.name},${p.phone},${p.cardsTaken},${p.cardsReturned},${p.cardsRemaining},${p.moneyOwed},${p.paidAmount},${p.settled ? "SETTLED" : "OWES"}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "event-report.csv";
  a.click();
}

/* ---------- RESET ---------- */
function resetAll() {
  if (!confirm("Reset everything?")) return;
  people = [];
  donations = [];
  totalCards = soldCards = earned = 0;
  persist();
  render();
}

/* ---------- RENDER ---------- */
function render() {
  const list = document.getElementById("peopleList");
  const table = document.querySelector("#statusTable tbody");

  const unpaid = people.reduce((s, p) => s + p.cardsRemaining, 0);
  const remaining = totalCards - unpaid - soldCards;

  document.getElementById("totalCards").textContent = totalCards;
  document.getElementById("givenCards").textContent = unpaid;
  document.getElementById("soldCards").textContent = soldCards;
  document.getElementById("remainingCards").textContent = remaining;
  document.getElementById("totalOwed").textContent = `$${unpaid * CARD_PRICE}`;
  document.getElementById("earned").textContent = `$${earned}`;

  list.innerHTML = "";
  people.forEach((p, i) => {
    if (p.settled) return;
    list.innerHTML += `
      <li>
        <b>${p.name}</b> (${p.phone})<br>
        Remaining: ${p.cardsRemaining} — $${p.moneyOwed}
        <div>
          <button class="small" onclick="editPerson(${i})">Edit</button>
          <button class="small" onclick="returnCards(${i})">Return</button>
          <button class="small success" onclick="settlePerson(${i})">Full Settle</button>
          <button class="small" style="background:#5856d6" onclick="partialSettlePerson(${i})">Partial Settle</button>
          <button class="danger small" onclick="deletePerson(${i})">Delete</button>
        </div>
      </li>
    `;
  });

  table.innerHTML = "";
  people.forEach(p => {
    table.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.phone}</td>
        <td>${p.cardsTaken}</td>
        <td>${p.cardsReturned}</td>
        <td>${p.cardsRemaining}</td>
        <td>$${p.moneyOwed}</td>
        <td>$${p.paidAmount}</td>
        <td>${p.settled ? "SETTLED" : "OWES"}</td>
      </tr>
    `;
  });
}

/* ---------- HELPERS ---------- */
function clearInputs() {
  ["name", "phone", "cards"].forEach(id => document.getElementById(id).value = "");
}

function persist() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("donations", JSON.stringify(donations));
  localStorage.setItem("totalCards", totalCards);
  localStorage.setItem("soldCards", soldCards);
  localStorage.setItem("earned", earned);
}

render();