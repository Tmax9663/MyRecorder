'use strict'
let audioRecorder, audioChunks, audioMedia, audioStream, audioRecording = false;
let videoRecorder, videoChunks, videoMedia, videoStream, videoRecording = false;
let timestamp, eventTimeStamp;
let startRecordTime;
const audioInputSelect = document.querySelector('#audioSource');
const videoInputSelect = document.querySelector('#videoSource');
const startAudioBtn = document.querySelector('#startAudio');
const startVideoBtn = document.querySelector('#startVideo');
const previewUl = document.querySelector('#previewUl');
const videoShow = document.querySelector('#videoShow');
const level = document.querySelector('#level');
const selector = document.querySelector('#selector');
const audioDuration=document.querySelector('#audioDuration');

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
	console.log("enumerateDevices() not supported.");
}

navigator.mediaDevices.enumerateDevices().then( devices => {
	devices.forEach( device => {
		const option = document.createElement('option');
		option.value = device.deviceId;
		if (device.kind === 'audioinput') {
			console.log(device.kind + ": " + device.label + " id = " + device.deviceId + " groupid = " + device.groupId);
			if (device.deviceId != 'default' && device.deviceId != 'communications') {
				option.text = device.label;
				audioInputSelect.appendChild(option);
			}
		}
		if (device.kind === 'videoinput') {
			console.log(device.kind + ": " + device.label + " id = " + device.deviceId + " groupid = " + device.groupId);
			if (device.deviceId != 'default' && device.deviceId != 'communications') {
				option.text = device.label;
				videoInputSelect.appendChild(option);
			}
		}
	});
}).catch(err=> {
	console.log(err.name + ": " + err.message);
});

const start = (constraints) => {
	navigator.mediaDevices.getUserMedia(constraints).then(_stream => {
		audioStream = _stream;
		makeWaveform(audioStream);
		audioRecorder = new MediaRecorder(audioStream);
		audioRecording = true;
		audioRecorder.start();
		audioRecorder.ondataavailable = e => {
			audioChunks.push(e.data);
			if (audioRecorder.state == 'inactive') makeWavLink();
		};
		console.log('got media successfully :' + audioSource);
	}).catch(err=> {
		console.log(err.name + ": " + err.message);
	});
}

const startButton = (event) => {
	if (audioRecording) {
		audioRecorder.stop();
		if (audioStream) {
			audioStream.getTracks().forEach(track => {
				track.stop();
				console.log('audio timeLapse : ' + timesInSec(Math.round(parseInt(event.timeStamp) - parseInt(eventTimeStamp)) / 1000));
				level.style.display = 'none';
				startAudioBtn.style.color = "#666";
				replaceClass(startAudioBtn, 'blinking', 'normal');
			});
		}
		audioRecording = false;
		return;
	} else {
		const audioSource = audioInputSelect.value;
		const constraints = {
			audio: {
				tag: 'audio',
				type: 'audio/wav',
				ext: '.wav',
				deviceId: audioSource ? {
					exact: audioSource
				} : undefined,
				gUM: {
					audio: true
				}
			},
			video: false
		};
		audioMedia = constraints.audio;
		timestamp = GetTimeStamp();
		startRecordTime=parseInt(performance.now());
		start(constraints);
		level.style.display = "inline-block";
		startAudioBtn.style.color = "#f00";
		replaceClass(startAudioBtn, 'normal', 'blinking');
		audioChunks = [];
		eventTimeStamp = event.timeStamp;
	}
}

const makeWavLink = () => {
	let blob = new Blob(audioChunks, {
			type: audioMedia.type
		}),
		url = URL.createObjectURL(blob),
		li = document.createElement('li'),
		hf = document.createElement('a');
	hf.href = url;
	hf.download = `${timestamp}${audioMedia.ext}`;
	hf.innerHTML = ' ' + `${hf.download}`;
	let audio = document.createElement('audio');
	audio.autoplay = true;
	audio.src = url;
	audio.volume = 0.4;
	audio.controls = true;
	li.appendChild(audio);
	li.appendChild(hf);
	previewUl.appendChild(li);
	//hf.click();		
}

const makeWaveform = (stream) => {
	window.persistAudioStream = stream;
	let audioContent = new AudioContext();
	let audioStream = audioContent.createMediaStreamSource(stream);
	let analyser = audioContent.createAnalyser();
	let bufferLength = analyser.frequencyBinCount;
	let dataArray = new Uint8Array(bufferLength);
	let width = 300,
		height = 50;
	let canvasCtx = level.getContext("2d");
	audioStream.connect(analyser);
	canvasCtx.clearRect(0, 0, width, height);

	 const draw=()=> {
		let drawVisual = requestAnimationFrame(draw);
		analyser.getByteTimeDomainData(dataArray);
		canvasCtx.fillStyle = '#666'; //rgb(125,125,125)';
		canvasCtx.fillRect(0, 0, width, height);
		canvasCtx.lineWidth = 2;
		canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
		canvasCtx.beginPath();
		let sliceWidth = width * 1.0 / bufferLength;
		let x = 0;
		for (let i = 0; i < bufferLength; i++) {
			let v = dataArray[i] / 128.0;
			let y = v * height / 2;
			if (i === 0) {
				canvasCtx.moveTo(x, y);
			} else {
				canvasCtx.lineTo(x, y);
			}
			x += sliceWidth;
		}
		canvasCtx.lineTo(width, height / 2);
		canvasCtx.stroke();
		if (audioRecording) {
			audioDuration.innerHTML=timesInSec(Math.round(parseInt(performance.now())-startRecordTime)/ 1000);   
		}
	};
	draw();
}

const startVideo = (constraints) => {
	navigator.mediaDevices.getUserMedia(constraints).then(_stream => {
		videoStream = _stream;
		videoShow.srcObject = videoStream;
		videoRecorder = new MediaRecorder(videoStream);
		videoRecording = true;
		videoRecorder.start();
		videoRecorder.ondataavailable = e => {
			videoChunks.push(e.data);
			if (videoRecorder.state == 'inactive') makeVideoLink();
		};
		console.log('got video media successfully :' + videoSource);
	}).catch( err=> {
		console.log(err.name + ": " + err.message);
	});
}

const startVideoButton = (event) => {
	if (videoRecording) {
		videoRecorder.stop();
		if (videoStream) {
			videoStream.getTracks().forEach(track => {
				track.stop();
				startVideoBtn.style.color = "#666";
				replaceClass(startVideoBtn, 'blinking', 'normal');
				videoShow.style.display = "none"
			});
			console.log('video timeLapse : ' + timesInSec(Math.round(parseInt(event.timeStamp) - parseInt(eventTimeStamp)) / 1000));
		}
		videoRecording = false;
		return;
	} else {
		const videoSource = videoInputSelect.value;
		const constraints = {
			audio: true,
			video: {
				type: 'video/mp4',
				ext: '.mp4',
				deviceId: videoSource ? {
					exact: videoSource
				} : undefined,
			}
		};
		videoMedia = constraints.video;
		timestamp = GetTimeStamp();
		startVideo(constraints);
		replaceClass(startVideoBtn, 'normal', 'blinking');
		videoShow.style.display = "inline-block"
		startVideoBtn.style.color = "#f00";
		videoChunks = [];
		eventTimeStamp = event.timeStamp;
	}
}

const makeVideoLink = () => {
	let blob = new Blob(videoChunks, {
			type: videoMedia.type
		}),
		url = URL.createObjectURL(blob),
		li = document.createElement('li'),
		hf = document.createElement('a');
	hf.href = url;
	hf.download = `${timestamp}${videoMedia.ext}`;
	hf.innerHTML = ' ' + `${hf.download}`;
	let video = document.createElement('video');
	video.autoplay = true;
	video.style.width = "120px";
	video.style.height = "90px";
	video.src = url;
	li.appendChild(video);
	li.appendChild(hf);
	previewUl.appendChild(li);
}

const replaceClass = (obj, fromClass, toClass) => {
	obj.classList.remove(fromClass);
	obj.classList.add(toClass);
}

const setting = () => {
	selector.style.display = "inline-block";
}

const closeSelector = () => {
	selector.style.display = "none";
}

const pad = (n) => {
	return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

const GetTimeStamp = () => {
	let d = new Date();
	return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

const timesInSec = (tick) => {
	const result = new Date(tick * 1000).toISOString().substr(11, 8);
	return (result.substr(3, 2) + ':' + result.substr(6, 2) + ' s');
};
