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

document.addEventListener("DOMContentLoaded", () => {
	let debounceTimeout;
	const debounceDelay = 500;

	const bodyTextarea = document.getElementById("body");
	const voteDurationInput = document.getElementById("vote_duration");
	const textPreviewContent = document.getElementById(
		"vote-body-preview-content",
	);
	const voteForm = document.querySelector("form.atr-canary");
	const configElement = document.getElementById("vote-config");

	if (!bodyTextarea || !voteDurationInput || !textPreviewContent || !voteForm) {
		console.error("Required elements for vote preview not found. Exiting.");
		return;
	}

	const previewUrl = configElement ? configElement.dataset.previewUrl : null;
	const minHours = configElement ? configElement.dataset.minHours : "72";
	const csrfTokenInput = voteForm.querySelector('input[name="csrf_token"]');

	if (!previewUrl || !csrfTokenInput) {
		console.error(
			"Required data attributes or CSRF token not found for vote preview.",
		);
		return;
	}
	const csrfToken = csrfTokenInput.value;

	function fetchAndUpdateVotePreview() {
		const bodyContent = bodyTextarea.value;
		const voteDuration = voteDurationInput.value || minHours;

		fetch(previewUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"X-CSRFToken": csrfToken,
			},
			body: new URLSearchParams({
				body: bodyContent,
				duration: voteDuration,
				csrf_token: csrfToken,
			}),
		})
			.then((response) => {
				if (!response.ok) {
					return response.text().then((text) => {
						throw new Error(`HTTP error ${response.status}: ${text}`);
					});
				}
				return response.text();
			})
			.then((previewText) => {
				textPreviewContent.textContent = previewText;
			})
			.catch((error) => {
				console.error("Error fetching email preview:", error);
				textPreviewContent.textContent = `Error loading preview:\n${error.message}`;
			});
	}

	bodyTextarea.addEventListener("input", () => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(fetchAndUpdateVotePreview, debounceDelay);
	});

	voteDurationInput.addEventListener("input", () => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(fetchAndUpdateVotePreview, debounceDelay);
	});

	fetchAndUpdateVotePreview();
});
