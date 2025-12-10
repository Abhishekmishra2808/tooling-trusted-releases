function filter() {
	const projectFilter = document.getElementById("project-filter").value;
	const cards = document.querySelectorAll(".page-project-card");
	let visibleCount = 0;
	for (const card of cards) {
		const nameElement = card.querySelector(".card-title");
		const name = nameElement.innerHTML;
		if (!projectFilter) {
			card.parentElement.hidden = false;
			visibleCount++;
		} else {
			card.parentElement.hidden = !name.match(new RegExp(projectFilter, "i"));
			if (!card.parentElement.hidden) {
				visibleCount++;
			}
		}
	}
	document.getElementById("project-count").textContent = visibleCount;
}

// Add event listeners
document.getElementById("filter-button").addEventListener("click", filter);
document
	.getElementById("project-filter")
	.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			filter();
			event.preventDefault();
		}
	});

// Add click handlers for project cards
document.querySelectorAll(".page-project-card").forEach((card) => {
	card.addEventListener("click", function (event) {
		// Prevent card navigation if click is inside a form
		if (event.target.closest("form")) {
			return;
		}
		window.location.href = this.getAttribute("data-project-url");
	});
});

// Participant filter logic
const participantButton = document.getElementById("filter-participant-button");
participantButton.addEventListener("click", function () {
	const showing = this.dataset.showing;
	const cards = document.querySelectorAll(".page-project-card");
	let visibleCount = 0;

	if (showing === "all") {
		// Switch to showing only participant projects
		cards.forEach((card) => {
			const isParticipant = card.dataset.isParticipant === "true";
			card.parentElement.hidden = !isParticipant;
			if (!card.parentElement.hidden) {
				visibleCount++;
			}
		});
		this.textContent = "Show all projects";
		this.dataset.showing = "participant";
	} else {
		// Switch to showing all projects
		cards.forEach((card) => {
			card.parentElement.hidden = false;
			visibleCount++;
		});
		this.textContent = "Show my projects";
		this.dataset.showing = "all";
	}
	// Reset text filter when toggling participant view
	document.getElementById("project-filter").value = "";
	// Update count
	document.getElementById("project-count").textContent = visibleCount;
});
