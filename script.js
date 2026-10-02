/* =========================================================
   PELOTITA ANTIESTRÉS
   script.js
   ========================================================= */

(() => {
  "use strict";

  const ball = document.getElementById("stressBall");
  const stage = document.getElementById("ballStage");
  const instruction = document.getElementById("instruction");

  const squeezeCountElement = document.getElementById("squeezeCount");
  const stressLevelElement = document.getElementById("stressLevel");
  const footerMessage = document.getElementById("footerMessage");

  const breatheButton = document.getElementById("breatheButton");
  const resetButton = document.getElementById("resetButton");

  const breathingLabel = document.getElementById("breathingLabel");
  const breathingText = document.getElementById("breathingText");
  const breathingProgress = document.getElementById("breathingProgress");

  const soundToggle = document.getElementById("soundToggle");
  const soundIcon = document.getElementById("soundIcon");

  let isPointerDown = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let ballX = 0;
  let ballY = 0;
  let squeezeCount = 0;
  let releasedStress = 0;

  let breathingTimer = null;
  let breathingRunning = false;

  let audioContext = null;
  let soundEnabled = true;

  const messages = [
    "Eso. Un poquito menos de tensión.",
    "No tienes que resolver todo ahora.",
    "Respira. Ya estás haciendo suficiente.",
    "Suelta los hombros. Afloja la mandíbula.",
    "Un problema a la vez.",
    "Cinco segundos de pausa también cuentan.",
    "Aquí no hay prisa.",
    "Inhala. Exhala. Continúa."
  ];

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateBallTransform(scaleX = 1, scaleY = 1) {
    ball.style.setProperty("--x", `${ballX}px`);
    ball.style.setProperty("--y", `${ballY}px`);
    ball.style.setProperty("--scale-x", scaleX.toFixed(3));
    ball.style.setProperty("--scale-y", scaleY.toFixed(3));
  }

  function setRandomMessage() {
    const index = Math.floor(Math.random() * messages.length);
    footerMessage.textContent = messages[index];
  }

  function updateStats() {
    squeezeCountElement.textContent = squeezeCount;
    stressLevelElement.textContent = `${releasedStress}%`;
  }

  /* ---------------------------------------------------------
     Sound
     --------------------------------------------------------- */

  function ensureAudio() {
    if (!soundEnabled) return;

    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  function playTone(frequency = 220, duration = 0.07, volume = 0.025) {
    if (!soundEnabled) return;

    ensureAudio();

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      audioContext.currentTime + 0.012
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  }

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
    soundToggle.setAttribute(
      "aria-label",
      soundEnabled ? "Desactivar sonido" : "Activar sonido"
    );

    if (soundEnabled) {
      playTone(330, 0.10, 0.02);
    }
  });

  /* ---------------------------------------------------------
     Stress ball interaction
     --------------------------------------------------------- */

  function pressBall(event) {
    if (isPointerDown) return;

    isPointerDown = true;
    pointerId = event.pointerId;

    ball.setPointerCapture?.(pointerId);

    const rect = ball.getBoundingClientRect();

    startX = event.clientX - (rect.left + rect.width / 2);
    startY = event.clientY - (rect.top + rect.height / 2);

    ball.classList.add("is-pressed");
    stage.classList.add("is-active");

    ensureAudio();
    playTone(180, 0.08, 0.018);
  }

  function moveBall(event) {
    if (!isPointerDown || event.pointerId !== pointerId) return;

    const stageRect = stage.getBoundingClientRect();

    const maxX = Math.max(30, stageRect.width * 0.28);
    const maxY = Math.max(20, stageRect.height * 0.16);

    const movementX = event.clientX - stageRect.left - stageRect.width / 2;
    const movementY = event.clientY - stageRect.top - stageRect.height / 2;

    ballX = clamp(movementX - startX, -maxX, maxX);
    ballY = clamp(movementY - startY, -maxY, maxY);

    const horizontalPressure =
      1 - Math.min(Math.abs(ballX) / maxX, 1) * 0.10;

    const verticalPressure =
      1 - Math.min(Math.abs(ballY) / maxY, 1) * 0.04;

    const squeeze = 0.80 + (Math.abs(ballX) / maxX) * 0.10;

    updateBallTransform(
      horizontalPressure * squeeze,
      verticalPressure * (1.10 - squeeze * 0.10)
    );
  }

  function releaseBall(event) {
    if (!isPointerDown) return;
    if (event && event.pointerId !== pointerId) return;

    isPointerDown = false;

    try {
      if (pointerId !== null) {
        ball.releasePointerCapture?.(pointerId);
      }
    } catch (_) {
      // Pointer capture may already have been released.
    }

    pointerId = null;

    ball.classList.remove("is-pressed");

    squeezeCount += 1;

    const gained = Math.floor(8 + Math.random() * 13);
    releasedStress = clamp(releasedStress + gained, 0, 100);

    updateStats();
    setRandomMessage();

    playTone(280 + Math.random() * 70, 0.10, 0.022);

    ball.animate(
      [
        {
          transform:
            `translate3d(${ballX}px, ${ballY}px, 0) scaleX(0.86) scaleY(1.08)`
        },
        {
          transform:
            `translate3d(${ballX * 0.45}px, ${ballY * 0.45}px, 0) scaleX(1.06) scaleY(0.96)`
        },
        {
          transform:
            "translate3d(0px, 0px, 0) scaleX(1) scaleY(1)"
        }
      ],
      {
        duration: 520,
        easing: "cubic-bezier(.2,.8,.2,1)"
      }
    );

    ballX = 0;
    ballY = 0;
    updateBallTransform(1, 1);

    if (releasedStress >= 100) {
      footerMessage.textContent =
        "✨ Listo. Te ganaste una pausa. Ahora respira.";
      playTone(440, 0.12, 0.025);
      setTimeout(() => playTone(550, 0.16, 0.022), 90);
    }
  }

  ball.addEventListener("pointerdown", pressBall);
  ball.addEventListener("pointermove", moveBall);
  ball.addEventListener("pointerup", releaseBall);
  ball.addEventListener("pointercancel", releaseBall);
  ball.addEventListener("lostpointercapture", () => {
    if (isPointerDown) {
      releaseBall();
    }
  });

  /* ---------------------------------------------------------
     Keyboard accessibility
     --------------------------------------------------------- */

  ball.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();

      if (!isPointerDown) {
        squeezeCount += 1;
        releasedStress = clamp(releasedStress + 10, 0, 100);

        ball.classList.add("is-pressed");
        updateBallTransform(0.86, 1.08);
        updateStats();
        playTone(190, 0.08, 0.018);
      }
    }
  });

  ball.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();

      ball.classList.remove("is-pressed");
      ballX = 0;
      ballY = 0;
      updateBallTransform(1, 1);

      setRandomMessage();
      playTone(300, 0.10, 0.022);
    }
  });

  /* ---------------------------------------------------------
     Guided breathing
     4 sec inhale / 2 sec hold / 6 sec exhale
     --------------------------------------------------------- */

  const breathingSteps = [
    { label: "INHALA", text: "Lentamente por 4 segundos", duration: 4000 },
    { label: "MANTÉN", text: "Quédate aquí por 2 segundos", duration: 2000 },
    { label: "EXHALA", text: "Suelta lentamente por 6 segundos", duration: 6000 }
  ];

  function stopBreathing() {
    clearTimeout(breathingTimer);
    breathingTimer = null;
    breathingRunning = false;

    breatheButton.innerHTML = "<span>◌</span> Respiración guiada";
    breathingLabel.textContent = "RESPIRA";
    breathingText.textContent = "Inhala lentamente";
    breathingProgress.style.width = "0%";
  }

  function runBreathingStep(stepIndex = 0) {
    if (!breathingRunning) return;

    const step = breathingSteps[stepIndex];

    breathingLabel.textContent = step.label;
    breathingText.textContent = step.text;

    const start = performance.now();

    function animateProgress(now) {
      if (!breathingRunning) return;

      const elapsed = now - start;
      const progress = clamp(elapsed / step.duration, 0, 1);

      breathingProgress.style.width = `${progress * 100}%`;

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    }

    requestAnimationFrame(animateProgress);

    breathingTimer = setTimeout(() => {
      runBreathingStep((stepIndex + 1) % breathingSteps.length);
    }, step.duration);
  }

  breatheButton.addEventListener("click", () => {
    if (breathingRunning) {
      stopBreathing();
      return;
    }

    ensureAudio();
    breathingRunning = true;
    breatheButton.innerHTML = "<span>Ⅱ</span> Detener respiración";

    runBreathingStep(0);
    playTone(330, 0.12, 0.018);
  });

  /* ---------------------------------------------------------
     Reset
     --------------------------------------------------------- */

  resetButton.addEventListener("click", () => {
    stopBreathing();

    squeezeCount = 0;
    releasedStress = 0;
    ballX = 0;
    ballY = 0;

    ball.classList.remove("is-pressed");
    stage.classList.remove("is-active");

    updateBallTransform(1, 1);
    updateStats();

    footerMessage.textContent =
      "No tienes que resolver todo ahora. Solo suelta un poco.";

    playTone(250, 0.08, 0.018);
  });

  /* ---------------------------------------------------------
     Prevent accidental context menu while interacting
     --------------------------------------------------------- */

  ball.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  /* Initial state */
  updateStats();
  updateBallTransform(1, 1);
})();
