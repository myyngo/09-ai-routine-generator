// Load preferences from localStorage and prefill the form on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('routinePreferences');
  if (saved) {
    const prefs = JSON.parse(saved);
    if (prefs.timeOfDay) document.getElementById('timeOfDay').value = prefs.timeOfDay;
    if (prefs.focusArea) document.getElementById('focusArea').value = prefs.focusArea;
    if (prefs.timeAvailable) document.getElementById('timeAvailable').value = prefs.timeAvailable;
    if (prefs.energyLevel) document.getElementById('energyLevel').value = prefs.energyLevel;
    if (Array.isArray(prefs.activities)) {
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = prefs.activities.includes(cb.value);
      });
    }
  }
});

// Add an event listener to the form that runs when the form is submitted
document.getElementById('routineForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get values from all form inputs
  const timeOfDay = document.getElementById('timeOfDay').value;
  const focusArea = document.getElementById('focusArea').value;
  const timeAvailable = document.getElementById('timeAvailable').value;
  const energyLevel = document.getElementById('energyLevel').value;

  // Collect all checked checkboxes
  const selectedActivities = Array.from(
    document.querySelectorAll('input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  // Save preferences to localStorage
  localStorage.setItem('routinePreferences', JSON.stringify({
    timeOfDay,
    focusArea,
    timeAvailable,
    energyLevel,
    activities: selectedActivities
  }));

  // Build the detailed prompt
  const userPrompt = `You are a daily routine coach. Create a DETAILED, structured daily routine with the following parameters:

- Time of day: ${timeOfDay}
- Focus area: ${focusArea}
- Time available: ${timeAvailable}
- Energy level: ${energyLevel}
- Preferred activities: ${selectedActivities.length > 0 ? selectedActivities.join(', ') : 'None selected'}

Output a step-by-step routine with EXACT time blocks. For each step include:
1. The time slot (e.g. "0:00–0:05")
2. The activity name
3. A 2–3 sentence description of how to do it and why it fits their energy/focus

Format it like:

**Your ${timeOfDay} Routine (${timeAvailable} | Focus: ${focusArea})**

⏱ 0:00–0:05 — Activity Name
Description here.

⏱ 0:05–0:15 — Next Activity
Description here.

...and so on until the full time is used. Do not give a brief summary. Give the full routine.`;

  // Show loading state
  const button = document.querySelector('button[type="submit"]');
  button.textContent = 'Generating...';
  button.disabled = true;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are a daily routine coach. Always output a full detailed step-by-step routine. Never give a brief summary.' },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const routine = data.choices[0].message.content;

    document.getElementById('result').classList.remove('hidden');
    document.getElementById('routineOutput').innerHTML = routine.replace(/\n/g, '<br>');

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('routineOutput').textContent = 'Sorry, there was an error generating your routine. Please try again.';
    document.getElementById('result').classList.remove('hidden');
  } finally {
    button.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate My Routine';
    button.disabled = false;
  }
}); 