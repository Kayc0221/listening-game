async function fetchAudioBuffer(audioContext, filename) {
    const url = `/audio/game1/${filename}`;
    let response;
    try {
        response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Failed to fetch ${url}: ${error.message}`);
        throw error; 
    }

    let arrayBuffer;
    try {
        arrayBuffer = await response.arrayBuffer();
    } catch (error) {
        console.error(`Failed to parse response to ArrayBuffer: ${error.message}`);
        throw error; 
    }

    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.error(`Audio decoding failed: ${error.message}`);
        throw error;
    }
}

export async function createMixedAudio(signalFilename, noiseFilename, SNR) {
    // 只用來解碼與建立 buffer；用完要關閉，否則每播一次就多一個沒釋放的 AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    try {
        return await mixAtSNR(audioContext, signalFilename, noiseFilename, SNR);
    } finally {
        audioContext.close();
    }
}

async function mixAtSNR(audioContext, signalFilename, noiseFilename, SNR) {
    const signalBuffer = await fetchAudioBuffer(audioContext, signalFilename);
    const noiseBuffer = await fetchAudioBuffer(audioContext, noiseFilename);

    const numberOfChannels = Math.min(signalBuffer.numberOfChannels, noiseBuffer.numberOfChannels);
    const minLength = Math.min(signalBuffer.length, noiseBuffer.length);
    const outputBuffer = audioContext.createBuffer(
        numberOfChannels,
        minLength,
        signalBuffer.sampleRate
    );

    for (let channel = 0; channel < numberOfChannels; channel++) {
        const signalData = signalBuffer.getChannelData(channel);
        const noiseData = noiseBuffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);

        const signalPower = signalData.reduce((acc, val) => acc + val * val, 0) / signalData.length;
        const noisePower = noiseData.reduce((acc, val) => acc + val * val, 0) / noiseData.length;

        const scalingFactor = Math.sqrt((signalPower / noisePower) * Math.pow(10, -SNR / 10));

        for (let i = 0; i < minLength; i++) {
            outputData[i] = signalData[i] + scalingFactor * noiseData[i];
        }
    }

    return outputBuffer; // Return the mixed audio buffer
}