// Feature check
if (!('webkitSpeechRecognition' in window)) {
  alert("Speech Recognition not supported. Please use Chrome.");
}

// Get DOM elements
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcriptEl = document.getElementById("transcript");
const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");

// Resize canvas
canvas.width = canvas.offsetWidth;
canvas.height = 100;

// Speech Recognition setup
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";

// Start/stop handlers
startBtn.onclick = () => {
  recognition.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  startVisualizer();
};

stopBtn.onclick = () => {
  recognition.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  stopVisualizer();
};

// Update transcript
let finalTranscript = "";
recognition.onresult = (event) => {
  let interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript + " ";
    } else {
      interimTranscript += transcript;
    }
  }

  transcriptEl.innerText = finalTranscript + interimTranscript;
};

// Visualizer using Web Audio API
let audioContext;
let analyser;
let microphone;
let dataArray;
let animationId;

function startVisualizer() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      function draw() {
        animationId = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = "#1e1e1e";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          canvasCtx.fillStyle = `rgb(${barHeight + 100}, 255, 200)`;
          canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
          x += barWidth + 1;
        }
      }

      draw();
    })
    .catch((err) => {
      alert("Mic permission denied or unavailable.");
      console.error(err);
    });
}

function stopVisualizer() {
  if (audioContext) {
    audioContext.close();
    cancelAnimationFrame(animationId);
  }
}


const toggleBtn = document.getElementById("toggleModeBtn");

toggleBtn.onclick = () => {
  document.body.classList.toggle("light-mode");

  const isLight = document.body.classList.contains("light-mode");
  toggleBtn.textContent = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
};


const copyBtn = document.getElementById('copyBtn');

copyBtn.onclick = () => {
    const text = transcriptEl.innerText;

    if(!text.trim()) {
        alert("No text to copy.");
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
                copyBtn.textContent = "Copy Transcript";
            }, 1500);
        })
         .catch(err => {
            console.error('Failed to copy text: ', err);
            alert("Failed to copy text. Please try again.");
         });
};
