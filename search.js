// search.js - The Global Filter
function filterContent() {
    const input = document.getElementById('wordSearch');
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('.vocab-card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(filter) ? "flex" : "none";
    });
}
