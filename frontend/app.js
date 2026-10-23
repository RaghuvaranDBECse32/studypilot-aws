const notesEl = document.getElementById('notes');
const charCountEl = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoader = generateBtn.querySelector('.btn-loader');
const emptyState = document.getElementById('emptyState');
const resultArea = document.getElementById('resultArea');
const resultContent = document.getElementById('resultContent');
const storedBadge = document.getElementById('storedBadge');
const errorArea = document.getElementById('errorArea');
const errorText = document.getElementById('errorText');
const copyBtn = document.getElementById('copyBtn');
const goalButtons = document.querySelectorAll('.goal-btn');

let selectedGoal = 'Revise today';

// Character counter
notesEl.addEventListener('input', () => {
  const len = notesEl.value.length;
  charCountEl.textContent = len;
  if (len > 5000) {
    charCountEl.style.color = '#ef4444';
  } else {
    charCountEl.style.color = '';
  }
});

// Goal selection
goalButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    goalButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGoal = btn.dataset.goal;
  });
});

// Generate
generateBtn.addEventListener('click', async () => {
  const notes = notesEl.value.trim();

  if (notes.length < 50) {
    showError('Please provide at least 50 characters of notes.');
    return;
  }
  if (notes.length > 5000) {
    showError('Notes must be under 5,000 characters.');
    return;
  }

  setLoading(true);
  hideError();
  hideResult();

  try {
    const res = await fetch('/api/study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, goal: selectedGoal }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    showResult(data.response, data.storedAt);
  } catch (err) {
    showError(err.message || 'StudyPilot could not process the notes.');
  } finally {
    setLoading(false);
  }
});

// Copy
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultContent.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to clipboard';
    }, 2000);
  } catch {
    copyBtn.textContent = 'Copy failed';
  }
});

function setLoading(loading) {
  generateBtn.disabled = loading;
  if (loading) {
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

function showResult(text, storedAt) {
  emptyState.classList.add('hidden');
  errorArea.classList.add('hidden');
  resultArea.classList.remove('hidden');
  resultContent.textContent = text;

  if (storedAt) {
    storedBadge.classList.remove('hidden');
  } else {
    storedBadge.classList.add('hidden');
  }
}

function hideResult() {
  resultArea.classList.add('hidden');
  emptyState.classList.remove('hidden');
}

function showError(msg) {
  emptyState.classList.add('hidden');
  resultArea.classList.add('hidden');
  errorArea.classList.remove('hidden');
  errorText.textContent = msg;
}

function hideError() {
  errorArea.classList.add('hidden');
}
