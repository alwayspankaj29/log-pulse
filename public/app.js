// app.js - frontend logic to fetch errors and render list

const API_URL = '/api/errors';

const errorListEl = document.getElementById('errorList');
const template = document.getElementById('errorItemTemplate');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const statusEl = document.getElementById('status');

async function fetchErrors() {
	setStatus('Loading errors...');
	try {
		const res = await fetch(API_URL, { headers: { 'Accept': 'application/json' } });
		if (!res.ok) throw new Error('Failed to load errors');
		const data = await res.json();
		return data.errors || [];
	} catch (err) {
		console.error(err);
		setStatus('Failed to load errors');
		return [];
	}
}

function renderErrors(errors) {
	errorListEl.innerHTML = '';
	if (!errors.length) {
		errorListEl.innerHTML = '<li>No errors found.</li>';
		setStatus('No errors to display');
		return;
	}
	const fragment = document.createDocumentFragment();
	errors.forEach(err => {
		const node = template.content.cloneNode(true);
		node.querySelector('.error-title').textContent = err.title;
		node.querySelector('.error-description').textContent = err.description;
		node.querySelector('.error-recommendation').textContent = 'Recommendation: ' + err.recommendation;
		if (err.slackThreadSuggestion && err.slackThreadSuggestion.url) {
			const slackP = node.querySelector('.error-slack');
			const anchor = slackP.querySelector('.slack-link');
			anchor.href = err.slackThreadSuggestion.url;
			const labelText = err.slackThreadSuggestion.label || 'Slack Thread';
			anchor.textContent = labelText;
			anchor.setAttribute('aria-label', 'Open Slack thread: ' + labelText);
		} else {
			node.querySelector('.error-slack').remove();
		}
		fragment.appendChild(node);
	});
	errorListEl.appendChild(fragment);
	setStatus(`Showing ${errors.length} errors`);
}

function setStatus(msg) {
	statusEl.textContent = msg;
}

function filterErrors(all, term) {
	if (!term) return all;
	const lower = term.toLowerCase();
	return all.filter(e =>
		e.title.toLowerCase().includes(lower) ||
		e.description.toLowerCase().includes(lower) ||
		e.recommendation.toLowerCase().includes(lower)
	);
}

let loadedErrors = [];

async function loadAndRender() {
	loadedErrors = await fetchErrors();
	renderErrors(filterErrors(loadedErrors, searchInput.value));
}

refreshBtn.addEventListener('click', loadAndRender);
searchInput.addEventListener('input', () => {
	renderErrors(filterErrors(loadedErrors, searchInput.value));
});

// Initial load
loadAndRender();
