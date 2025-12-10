(() => {
	// Handle More and Less toggle buttons for collapse sections
	document.querySelectorAll(".page-collapse-toggle").forEach((button) => {
		button.addEventListener("click", function () {
			this.textContent = this.textContent.trim() === "More" ? "Less" : "More";
		});
	});

	const banner = document.getElementById("ongoing-tasks-banner");
	if (!banner) return;

	const apiUrl = banner.dataset.apiUrl;
	if (!apiUrl) return;

	const countSpan = document.getElementById("ongoing-tasks-count");
	const textSpan = document.getElementById("ongoing-tasks-text");
	const voteButton = document.getElementById("start-vote-button");
	const progress = document.getElementById("poll-progress");
	const pollInterval = 3000;

	let currentCount = parseInt(countSpan?.textContent || "0", 10);
	if (currentCount === 0) return;

	function restartProgress() {
		if (!progress) return;
		progress.style.animation = "none";
		progress.offsetHeight;
		progress.style.animation = `poll-grow ${pollInterval}ms linear forwards`;
	}

	function updateBanner(count) {
		if (!countSpan || !textSpan) return;

		currentCount = count;
		countSpan.textContent = count;

		const taskWord = count === 1 ? "task" : "tasks";
		const isAre = count === 1 ? "is" : "are";
		// TODO: Migrate away from setting innerHTML
		textSpan.innerHTML = `There ${isAre} currently <strong id="ongoing-tasks-count">${count}</strong> background verification ${taskWord} running for the latest revision. Results shown below may be incomplete or outdated until the tasks finish.`;

		if (count === 0) {
			// Banner always exists, but we hide it
			banner.classList.add("d-none");
			enableVoteButton();
		}
	}

	function enableVoteButton() {
		if (!voteButton) return;
		if (!voteButton.classList.contains("disabled")) return;

		const voteHref =
			voteButton.dataset.voteHref || voteButton.getAttribute("href");
		if (!voteHref || voteHref === "#") return;

		voteButton.classList.remove("disabled");
		voteButton.removeAttribute("aria-disabled");
		voteButton.removeAttribute("tabindex");
		voteButton.removeAttribute("role");
		voteButton.setAttribute("href", voteHref);
		voteButton.setAttribute("title", "Start a vote on this draft");
	}

	function pollOngoingTasks() {
		if (currentCount === 0) return;

		if (progress) {
			progress.style.animation = "none";
			progress.style.width = "100%";
			progress.classList.remove("bg-warning");
			progress.classList.add(
				"bg-info",
				"progress-bar-striped",
				"progress-bar-animated",
			);
		}
		fetch(apiUrl)
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((data) => {
				if (progress) {
					progress.classList.remove(
						"bg-info",
						"progress-bar-striped",
						"progress-bar-animated",
					);
					progress.classList.add("bg-warning");
				}
				const newCount = data.ongoing || 0;
				if (newCount !== currentCount) {
					updateBanner(newCount);
				}
				if (newCount > 0) {
					restartProgress();
					setTimeout(pollOngoingTasks, pollInterval);
				}
			})
			.catch((error) => {
				console.error("Error polling ongoing tasks:", error);
				if (progress) {
					progress.classList.remove(
						"bg-info",
						"progress-bar-striped",
						"progress-bar-animated",
					);
					progress.classList.add("bg-warning");
				}
				restartProgress();
				// Double the interval when there's an error
				setTimeout(pollOngoingTasks, pollInterval * 2);
			});
	}

	restartProgress();
	setTimeout(pollOngoingTasks, pollInterval);
})();
