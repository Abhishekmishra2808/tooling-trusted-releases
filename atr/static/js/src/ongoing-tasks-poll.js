/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

(() => {
	function handleCollapseToggle() {
		this.textContent = this.textContent.trim() === "More" ? "Less" : "More";
	}

	// Handle More and Less toggle buttons for collapse sections
	document.querySelectorAll(".page-collapse-toggle").forEach((button) => {
		button.addEventListener("click", handleCollapseToggle);
	});

	const banner = document.getElementById("ongoing-tasks-banner");
	if (!banner) return;

	const apiUrl = banner.dataset.apiUrl;
	if (!apiUrl) return;

	const countSpan = document.getElementById("ongoing-tasks-count");
	const textSpan = document.getElementById("ongoing-tasks-text");
	const voteButton = document.getElementById("start-vote-button");
	const progress = document.getElementById("poll-progress");
	const checksSummaryContainer = document.getElementById(
		"checks-summary-container",
	);
	const filesTableContainer = document.getElementById("files-table-container");
	const pollInterval = 3000;

	let currentCount = parseInt(countSpan?.textContent || "0", 10);
	if (currentCount === 0) return;

	function restartProgress() {
		if (!progress) return;
		progress.style.animation = "none";
		// Force a reflow to reset the animation
		void progress.offsetHeight;
		progress.style.animation = `poll-grow ${pollInterval}ms linear forwards`;
	}

	function setProgressPolling() {
		if (!progress) return;
		progress.style.animation = "none";
		progress.style.width = "100%";
		progress.classList.remove("bg-warning");
		progress.classList.add(
			"bg-info",
			"progress-bar-striped",
			"progress-bar-animated",
		);
	}

	function setProgressIdle() {
		if (!progress) return;
		progress.classList.remove(
			"bg-info",
			"progress-bar-striped",
			"progress-bar-animated",
		);
		progress.classList.add("bg-warning");
	}

	function updateBanner(count) {
		if (!countSpan || !textSpan) return;

		currentCount = count;

		const taskWord = count === 1 ? "task" : "tasks";
		const isAre = count === 1 ? "is" : "are";
		const strong = document.createElement("strong");
		strong.id = "ongoing-tasks-count";
		strong.textContent = count;
		textSpan.textContent = "";
		textSpan.append(
			`There ${isAre} currently `,
			strong,
			` background verification ${taskWord} running for the latest revision. Results shown below may be incomplete or outdated until the tasks finish.`,
		);

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

	function updatePageContent(data) {
		if (checksSummaryContainer && data.checks_summary_html !== undefined) {
			checksSummaryContainer.innerHTML = data.checks_summary_html;
		}
		if (filesTableContainer && data.files_table_html !== undefined) {
			filesTableContainer.innerHTML = data.files_table_html;
			reattachCollapseToggleListeners();
		}
	}

	function reattachCollapseToggleListeners() {
		document.querySelectorAll(".page-collapse-toggle").forEach((button) => {
			button.removeEventListener("click", handleCollapseToggle);
			button.addEventListener("click", handleCollapseToggle);
		});
	}

	function pollOngoingTasks() {
		if (currentCount === 0) return;

		setProgressPolling();
		fetch(apiUrl)
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((data) => {
				setProgressIdle();
				const newCount = data.ongoing || 0;
				if (newCount !== currentCount) {
					updateBanner(newCount);
				}
				updatePageContent(data);
				if (newCount > 0) {
					restartProgress();
					setTimeout(pollOngoingTasks, pollInterval);
				}
			})
			.catch((error) => {
				console.error("Error polling ongoing tasks:", error);
				setProgressIdle();
				restartProgress();
				// Double the interval when there's an error
				setTimeout(pollOngoingTasks, pollInterval * 2);
			});
	}

	restartProgress();
	setTimeout(pollOngoingTasks, pollInterval);
})();
