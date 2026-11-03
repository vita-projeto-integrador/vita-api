import { createRedisConnection } from '../config/redis-config.js';
import { setRedisState } from '../utils/redis-state.js';
let mainClient = null;
function startMainClient() {
    if (mainClient)
        return mainClient;
    // cliente geral
    const client = createRedisConnection({
        connectionName: 'mainClient',
        maxRetriesPerRequest: null,
    });
    // listeners exclusivos
    client.on('connect', async () => {
        setRedisState('connect');
    });
    client.on('ready', async () => {
        setRedisState('ready');
    });
    client.on('end', async () => {
        setRedisState('end');
    });
    client.on('error', () => {
        setRedisState('wait');
    });
    mainClient = client;
    return mainClient;
}
function getMainClient() {
    return mainClient;
}
export { startMainClient, getMainClient };
