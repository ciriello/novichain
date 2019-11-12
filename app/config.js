const MINEDURATION = 2000;
const INITIAL_DIFFICULTY = 3;
const KILOWATT_USAGE = 1000;

const GENESISBLOCK = {
    hash: 'NOVI_BLOCKCHAIN_GENESIS',
    lastHash: 'NOVI',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: [],
    timestamp: 1,
};

module.exports = { 
    GENESISBLOCK, 
    MINEDURATION, 
    KILOWATT_USAGE,
};