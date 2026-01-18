const APP_PASSWORD = "1234";

let people = JSON.parse(localStorage.getItem("people")) || [];
let editIndex = null;

function unlock() {
  const input = document.getElementById("password").value;
  if (input === APP_PASSWORD) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("mainApp").classList.remove("hidden");
    render();
  }
}

function savePerson() {
  const name = document.getElementById("name").value;
  const cards = Number(document.getElementById("cards").value);
  const price = Number(document.getElementById("price").value);

  if (!name || !cards || !price) return;

  const money = cards * price;

  if (editIndex === null) {
    people.push({ name, cards, money });
  } else {
    people[editIndex] = { name, cards, money };
    editIndex = null;
  }

  localStorage.setItem("people", JSON.stringify(people));
  clearFields();
  render();
}

function render() {
  const list = document.getElementById("list");
  const total = document.getElementById("total");

  list.innerHTML = "";
  let sum = 0;

  people.forEach((p, i) => {
    sum += p.money;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${p.name}</strong><br>
      ${p.cards} cards – ${p.money}
      <div class="actions">
        <button onclick="editPerson(${i})">Edit</button>
        <button onclick="deletePerson(${i})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });

  total.textContent = "Total owed: " + sum;
}

function editPerson(i) {
  const p = people[i];
  document.getElementById("name").value = p.name;
  document.getElementById("cards").value = p.cards;
  document.getElementById("price").value = p.money / p.cards;
  editIndex = i;
}

function deletePerson(i) {
  people.splice(i, 1);
  localStorage.setItem("people", JSON.stringify(people));
  render();
}

function clearFields() {
  document.getElementById("name").value = "";
  document.getElementById("cards").value = "";
  document.getElementById("price").value = "";
}

function exportData() {
  const blob = new Blob([JSON.stringify(people)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cards-backup.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    people = JSON.parse(e.target.result);
    localStorage.setItem("people", JSON.stringify(people));
    render();
  };
  reader.readAsText(file);
}

