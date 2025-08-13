const express = require('express');
const currentPort = process.env.PORT || 3000;
const app = express();

app.use(express.json());

let counter = 0;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const axios = require('axios');

function simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 200));
}

app.get('/increment', async (req, res) => {
    await simulateLatency();
    counter++;
    for (const peer of peers){
        try {
            await axios.get(`http://${peer}/increment-remote`);
        } catch (err) {
            console.log(`Konnte ${peer} nicht erreichen`);
        }
    }
    res.json({ counter });
});

app.get('/increment-remote', async (req, res) => {
    await simulateLatency();
    counter++;
    res.json({ counter });
});

async function syncCounter() {
    for (const peer of peers) {
        try {
            const { data } = await axios.get(`http://${peer}/counter`);
            counter = data.counter;
            console.log(`Synced counter from ${peer}: ${counter}`);
            break;
        } catch {}
    }
}

app.get('/counter', (req, res) => {
    res.json({ counter });
});

app.listen(currentPort, async () => {
    console.log(`Server running on port ${currentPort}`);
    await syncCounter();
});