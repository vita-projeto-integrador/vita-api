let isRedisConnected = 'wait';
const setRedisState = (status) => {
    isRedisConnected = status;
};
const getRedisState = () => {
    return isRedisConnected;
};
export { setRedisState, getRedisState };
