const ball = document.getElementById("stressBall");
const stage = document.getElementById("ballStage");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const breatheButton = document.getElementById("breatheButton");
const resetButton = document.getElementById("resetButton");
const squeezeCountEl = document.getElementById("squeezeCount");
const stressLevelEl = document.getElementById("stressLevel");
const breathingLabel = document.getElementById("breathingLabel");
const breathingText = document.getElementById("breathingText");
const breathingProgress = document.getElementById("breathingProgress");
const footerMessage = document.getElementById("footerMessage");

let squeezes = 0;
let isPressed = false;
let activePointerId = null;
let soundEnabled = true;
let audioContext = null;
let breathingTimer = null;
let breathingRunning = false;

const messages = [
  "Eso. Suelta un poquito más.",
  "No tienes que resolver todo ahora.",
  "Respira. Vas bien.",
  "Un momento a la vez.",
  "Puedes darte cinco minutos.",
  "Bien. Deja que la tensión baje.",
  "Aquí no tienes que demostrar nada."
];

function updateStats() {
  squeezeCountEl.textContent = squeezes;
  const level = Math.min(100, squeezes * 8);
  stressLevelEl.textContent = `${level}%`;
}

function playPop() {
  if (!soundEnabled) return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      90,
      audioContext.currentTime + 0.12
    );

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.08,
      audioContext.currentTime + 0.01
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.13
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.14);
  } catch (error) {
    // El sonido es opcional; la aplicación continúa funcionando sin él.
  }
}

function pressBall() {
  if (isPressed) return;

  isPressed = true;
  ball.classList.add("pressed");
  squeezes += 1;
  updateStats();

  footerMessage.textContent =
    messages[(squeezes - 1) % messages.length];

  playPop();
}

function releaseBall() {
  if (!isPressed) return;

  isPressed = false;
  ball.classList.remove("pressed");
}

ball.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;

  try {
    ball.setPointerCapture(event.pointerId);
  } catch (error) {}

  pressBall();
});

ball.addEventListener("pointerup", (event) => {
  if (activePointerId !== event.pointerId) return;
  releaseBall();
  activePointerId = null;
});

ball.addEventListener("pointercancel", (event) => {
  if (activePointerId !== event.pointerId) return;
  releaseBall();
  activePointerId = null;
});

ball.addEventListener("lostpointercapture", () => {
  releaseBall();
  activePointerId = null;
});

ball.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    pressBall();
  }
});

ball.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    releaseBall();
  }
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
  soundToggle.setAttribute(
    "aria-label",
    soundEnabled ? "Desactivar sonido" : "Activar sonido"
  );
});

const breathingPhases = [
  { name: "INHALA", text: "Inhala lentamente", duration: 4000 },
  { name: "MANTÉN", text: "Mantén el aire suavemente", duration: 2000 },
  { name: "EXHALA", text: "Suelta el aire despacio", duration: 6000 }
];

function runBreathingPhase(index = 0) {
  if (!breathingRunning) return;

  const phase = breathingPhases[index];
  const start = performance.now();

  breathingLabel.textContent = phase.name;
  breathingText.textContent = phase.text;

  function animate(now) {
    if (!breathingRunning) return;

    const elapsed = now - start;
    const progress = Math.min(100, (elapsed / phase.duration) * 100);
    breathingProgress.style.width = `${progress}%`;

    if (elapsed < phase.duration) {
      breathingTimer = requestAnimationFrame(animate);
    } else {
      runBreathingPhase((index + 1) % breathingPhases.length);
    }
  }

  breathingTimer = requestAnimationFrame(animate);
}

breatheButton.addEventListener("click", () => {
  breathingRunning = !breathingRunning;

  if (breathingRunning) {
    breatheButton.innerHTML = "<span>Ⅱ</span> Detener respiración";
    runBreathingPhase(0);
  } else {
    cancelAnimationFrame(breathingTimer);
    breathingProgress.style.width = "0%";
    breathingLabel.textContent = "RESPIRA";
    breathingText.textContent = "Inhala lentamente";
    breatheButton.innerHTML = "<span>◌</span> Respiración guiada";
  }
});

resetButton.addEventListener("click", () => {
  squeezes = 0;
  releaseBall();
  updateStats();

  footerMessage.textContent =
    "No tienes que resolver todo ahora. Solo suelta un poco.";

  breathingRunning = false;
  cancelAnimationFrame(breathingTimer);
  breathingProgress.style.width = "0%";
  breathingLabel.textContent = "RESPIRA";
  breathingText.textContent = "Inhala lentamente";
  breatheButton.innerHTML = "<span>◌</span> Respiración guiada";
});

updateStats();
