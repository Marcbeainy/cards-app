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

    if (p.cardsReturned > p.cardsTaken) {
      p.cardsReturned = p.cardsTaken;
    }

    p.cardsRemaining = p.cardsTaken - p.cardsReturned;
    p.moneyOwed = p.cardsRemaining * CARD_PRICE;

    if (p.cardsRemaining > 0) {
      p.settled = false;
    }

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

/* ---------- RETURN CARDS ---------- */
function returnCards(i) {
  const p = people[i];
  const max = p.cardsRemaining;
  const returned = Number(prompt(`Return cards (max ${max})`));

  if (!returned || returned <= 0 || returned > max) return;

  p.cardsReturned += returned;
  p.cardsRemaining -= returned;
  p.moneyOwed = p.cardsRemaining * CARD_PRICE;

  persist();
  render();
}

/* ---------- SETTLE ---------- */
function settlePerson(i) {
  const p = people[i];

  p.paidAmount += p.moneyOwed;
  soldCards += p.cardsRemaining;
  earned += p.moneyOwed;

  p.cardsRemaining = 0;
  p.moneyOwed = 0;
  p.settled = true;

  persist();
  render();
}

/* ---------- DELETE ---------- */
function deletePerson(i) {
  const p = people[i];
  if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;

  people.splice(i, 1);
  persist();
  render();
}

/* ---------- DONATION ---------- */
function addDonation() {
  const input = document.getElementById("donationAmount");
  const amount = Number(input.value);

  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }

  earned += amount;
  donations.push({ amount, date: new Date().toLocaleString() });

  input.value = "";
  persist();
  render();
}

/* ---------- RESET ---------- */
function resetAll() {
  if (!confirm("Reset everything?")) return;

  people = [];
  donations = [];
  totalCards = 0;
  soldCards = 0;
  earned = 0;

  persist();
  render();
}

/* ---------- RENDER ---------- */
function render() {
  const list = document.getElementById("peopleList");
  const table = document.querySelector("#statusTable tbody");

  const unpaidCards = people.reduce((s, p) => s + p.cardsRemaining, 0);
  const remainingCards = totalCards - unpaidCards - soldCards;

  document.getElementById("totalCards").textContent = totalCards;
  document.getElementById("givenCards").textContent = unpaidCards;
  document.getElementById("soldCards").textContent = soldCards;
  document.getElementById("remainingCards").textContent = remainingCards;
  document.getElementById("totalOwed").textContent = `$${unpaidCards * CARD_PRICE}`;
  document.getElementById("earned").textContent = `$${earned}`;

  /* PEOPLE BAR (HIDES SETTLED) */
  list.innerHTML = "";
  people.forEach((p, i) => {
    if (p.settled) return;

    list.innerHTML += `
      <li>
        <b>${p.name}</b> (${p.phone})<br>
        Remaining: ${p.cardsRemaining} — $${p.moneyOwed}
        <div>
          <button onclick="editPerson(${i})">Edit</button>
          <button onclick="returnCards(${i})">Return</button>
          <button onclick="settlePerson(${i})">Settle</button>
          <button class="danger small" onclick="deletePerson(${i})">Delete</button>
        </div>
      </li>
    `;
  });

  /* STATUS TABLE (ALL PEOPLE + TOTAL DONATIONS) */
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

  // Single row for all donations
  if (donations.length > 0) {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    table.innerHTML += `
      <tr>
        <td colspan="4">Donations Total</td>
        <td>-</td>
        <td>-</td>
        <td>$${totalDonations}</td>
        <td>DONATION</td>
      </tr>
    `;
  }
}

/* ---------- HELPERS ---------- */
function clearInputs() {
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("cards").value = "";
}

function persist() {
  localStorage.setItem("people", JSON.stringify(people));
  localStorage.setItem("donations", JSON.stringify(donations));
  localStorage.setItem("totalCards", totalCards);
  localStorage.setItem("soldCards", soldCards);
  localStorage.setItem("earned", earned);
}

/* ---------- INIT ---------- */
render();
