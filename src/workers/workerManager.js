import { startImageWorker, stopImageWorker } from "./imageWorker.js"

function startAllWorkers(){
    console.log('>> [BullMQ] Acordando workers...')
    startImageWorker()
}

async function stopAllWorkers(){
    console.log('>> [BullMQ] Encerrando todos os workers...')
    await Promise.all([
        stopImageWorker(),
    ])
}

export {startAllWorkers, stopAllWorkers}