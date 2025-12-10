let allCommitteeCards = [];

function filterCommitteesByText() {
	const projectFilter = document.getElementById("project-filter").value;
	const cards = allCommitteeCards;
	let visibleCount = 0;

	if (
		participantButton &&
		participantButton.dataset.showing === "participant"
	) {
		participantButton.dataset.showing = "all";
		participantButton.textContent = "Show my committees";
		participantButton.setAttribute("aria-pressed", "false");
	}

	for (const card of cards) {
		const nameElement = card.querySelector(".card-title");
		const name = nameElement.textContent.trim();
		if (!projectFilter) {
			card.parentElement.hidden = false;
			visibleCount++;
		} else {
			let regex;
			try {
				regex = new RegExp(projectFilter, "i");
			} catch (e) {
				const escapedFilter = projectFilter.replace(
					/[.*+?^${}()|[\]\\]/g,
					"\\$&",
				);
				regex = new RegExp(escapedFilter, "i");
			}
			card.parentElement.hidden = !name.match(regex);
			if (!card.parentElement.hidden) {
				visibleCount++;
			}
		}
	}
	document.getElementById("committee-count").textContent = visibleCount;
}

document
	.getElementById("filter-button")
	.addEventListener("click", filterCommitteesByText);
document
	.getElementById("project-filter")
	.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			filterCommitteesByText();
			event.preventDefault();
		}
	});

const participantButton = document.getElementById("filter-participant-button");
if (participantButton) {
	participantButton.addEventListener("click", function () {
		const showing = this.dataset.showing;
		const cards = allCommitteeCards;
		let visibleCount = 0;

		if (showing === "all") {
			cards.forEach((card) => {
				const isParticipant = card.dataset.isParticipant === "true";
				card.parentElement.hidden = !isParticipant;
				if (!card.parentElement.hidden) {
					visibleCount++;
				}
			});
			this.textContent = "Show all committees";
			this.dataset.showing = "participant";
			this.setAttribute("aria-pressed", "true");
		} else {
			cards.forEach((card) => {
				card.parentElement.hidden = false;
				visibleCount++;
			});
			this.textContent = "Show my committees";
			this.dataset.showing = "all";
			this.setAttribute("aria-pressed", "false");
		}
		document.getElementById("project-filter").value = "";
		document.getElementById("committee-count").textContent = visibleCount;
	});
}

document.addEventListener("DOMContentLoaded", () => {
	// Hide images that fail to load
	document.querySelectorAll(".page-logo").forEach((img) => {
		img.addEventListener("error", function () {
			this.style.display = "none";
		});
	});

	allCommitteeCards = Array.from(
		document.querySelectorAll(".page-project-card"),
	);
	const cards = allCommitteeCards;
	const committeeCountSpan = document.getElementById("committee-count");
	let initialVisibleCount = 0;
	const initialShowingMode = participantButton
		? participantButton.dataset.showing
		: "all";

	if (participantButton) {
		if (initialShowingMode === "participant") {
			participantButton.setAttribute("aria-pressed", "true");
		} else {
			participantButton.setAttribute("aria-pressed", "false");
		}
	}

	if (initialShowingMode === "participant") {
		cards.forEach((card) => {
			const isParticipant = card.dataset.isParticipant === "true";
			card.parentElement.hidden = !isParticipant;
			if (!card.parentElement.hidden) {
				initialVisibleCount++;
			}
		});
	} else {
		cards.forEach((card) => {
			card.parentElement.hidden = false;
			initialVisibleCount++;
		});
	}
	committeeCountSpan.textContent = initialVisibleCount;

	// Add a click listener to project subcards to handle navigation
	// TODO: Improve accessibility
	document.querySelectorAll(".page-project-subcard").forEach((subcard) => {
		subcard.addEventListener("click", function (event) {
			if (this.dataset.projectUrl) {
				window.location.href = this.dataset.projectUrl;
			}
		});
	});

	// Add a click listener for toggling project visibility within each committee
	document
		.querySelectorAll(".page-toggle-committee-projects")
		.forEach((button) => {
			button.addEventListener("click", function () {
				const projectListContainer = this.closest(
					".page-project-list-container",
				);
				if (projectListContainer) {
					const extraProjects = projectListContainer.querySelectorAll(
						".page-project-extra",
					);
					extraProjects.forEach((proj) => {
						proj.classList.toggle("d-none");
					});

					const isExpanded = this.getAttribute("aria-expanded") === "true";
					if (isExpanded) {
						this.textContent = this.dataset.textShow;
						this.setAttribute("aria-expanded", "false");
					} else {
						this.textContent = this.dataset.textHide;
						this.setAttribute("aria-expanded", "true");
					}
				}
			});
		});
});
