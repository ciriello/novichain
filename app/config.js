const MINEDURATION = 2000;
const INITIAL_DIFFICULTY = 3;
const KILOWATT_USAGE = 1000;
const GENESIS_HASH = 'NOVI_BLOCKCHAIN_GENESIS';

const GENESISBLOCK = {
    hash: GENESIS_HASH,
    lastHash: 'NOVI',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: [],
    timestamp: 1,
};

module.exports = {
    GENESIS_HASH,
    GENESISBLOCK, 
    MINEDURATION, 
    KILOWATT_USAGE,
};