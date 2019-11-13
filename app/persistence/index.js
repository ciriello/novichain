/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (PersistenceStore class)
 Omschrijving: REDIS database Persistence Class. Deze classe handeld alle persistence operaties voor de blockchain.
               elke block wordt als key->value paar opgeslagen in de REDIS database. De hash van de block wordt
               gebruikt als KEY voor de database
*/

const redis = require('redis');
const HASH_SET = 'REVERSE_ORDER_BLOCK_KEYS';
const PREFIX_SENDER = 'sender:';

class PersistenceStore {
    constructor() {
        // voor demo doeleinde wordt hier een andere database geselecteerd
        // in productie situatie niet nodid, daar elke node een eigen redis
        // instantie heeft
        this.redisClient = redis.createClient();
        if (process.env.RANDOM_NODE_PORT) {
            this.redisClient.select(5, (err, reply) => {
                if (err) return console.error('error by redis:', err);
                console.log('reply by redis:', reply);
            })
        }
    }

    // Public Methodes --------------

    /** 
     * ASYNC functie. Slaat de nieuwe block op in de DATABASE
     * als dat succesvol is wordt ook de index e.d. bijgewerkt.
     * als alles succesvol is. Is de async functie voltooid.
     * Anders komt de async functie terug met een error.
     */
    store({ newBlock }) {
        return new Promise((resolve, reject) => {
            const { hash } = newBlock;
            const stringifiedBlock = JSON.stringify(newBlock);

            /** Fetch de Block uit de database, als deze nog niet bestaat, maak alleen dan aan */
            this.redisClient.get(hash, (err, storedBlock) => {
                if (storedBlock) return resolve(storedBlock);
                this.redisClient.set(hash, stringifiedBlock, (err, reply) => {
                    // bij een error wordt de Promise gereject. Hier eindigt de transactie
                    if (err) {
                        console.error('error by redis: ', err);
                        return reject(err);
                    }
                    /** Bewaar de KEY van de nieuwe block in de KEYS list als eerste in de list (reverse order list) */
                    this._storeBlockKey({ reject, resolve, block: newBlock });
                });
            });
        });
    }

    /**
     * Ophalen van een block op basis van een block-key (hash)
     * @param {key} param0 hash van een block om op te halen
     */
    fetch({ key }) {
        this.redisClient.get(key, (err, reply) => {
            if (err) {
                console.error('error by redis: ', err);
                return reject(error);
            }
            console.log('reply:', reply);
            const block = JSON.parse(reply);
            return block;
        });
    }

    /**
     * Haalt de volledige blockchain lijst op tot de 'endingKey' hash van een block
     * bereikt/gevonden is.
     * 
     * @param {endingKey, index} param0 endingKey = hash van het laatst bekende blok, index start positie default 0
     */
    fetchAll({ endingKey, index = 0 }) {
        return new Promise((resolve, reject) => {
            this._recursiveFetch({ endingKey, index, resolve, reject });
        });
    }

    /**
     * Haalt de blocks op waar de sender adres in voorkomt
     * @param {address} param0 sender adres
     */
    fetchByAddress({ address }) {
        return new Promise((resolve, reject) => {
            const key = PREFIX_SENDER + address;
            this.redisClient.smembers(key, (err, keys) => {
                if (err) {
                    console.error('error by redis ', err);
                    return resolve({statusCode: 400, status: 'error', message: err.message});
                }
                if (keys.length === 0) return resolve([]);
                this.redisClient.mget(keys, (err, blocks) => {
                    if (err) {
                        console.error('error by redis ', err);
                        return resolve([]);
                    }
                    const result = this._jsonTransformBlocks({ blocks })
                    resolve(result);
                });
            });
        });
    }

    /**
     * Haalt het laatste block op uit de chain
     *
     */
    fetchLast() {
        return new Promise((resolve, reject) => {
            this.redisClient.lrange(HASH_SET, 0, 0, (err, key) => {
                if (err) return resolve({});
                if (key.length === 0) return resolve({});
                this.redisClient.get(key, (err, block) => {
                    if (err) return resolve({});
                    resolve(this._transformBlock(block));
                })
            });
        });
    }

    /**
     * Update alle blocks in de database met de huidige blocks in memory
     * by een synchronisatie wordt dit uitgevoerd
     */
    replace({ chain }) {
        for (let i=0; i<chain.length; i++) {
            const block = chain[i];
            const { hash } = block;
            // maak de block aan, als deze nog niet bestaat
            this.redisClient.get(hash, (err, found) => {
                if (err || found) return;
                const stringifiedBlock = JSON.stringify(block);
                this.redisClient.set(hash, stringifiedBlock);
                this._storeBlockKey({ block })
            });
        }
    }


    // Private Methodes --------------

    /**
     * Recursieve functie. ( The Magic Happends here :) )
     * Haalt in blokken van 10, hashwaardes (de keys) van de laatste toegevoegde blocks op.
     * totdat de laatst bekende hashwaarde van een het laatste block, gevonden wordt.
     * 
     * De REDIS database slaat elke geminde block  op. De hash van dit block word ook
     * opgeslagen. Alle hashes van de blocken worden in een lijst opgeslagen in omgekeerde volgorde
     * zodat de laatste, als eerste in deze lijst staat. 
     * 
     * @param {endingKey, index} endingKey de laatse hashwaarde bekend bij de NODE, index volgende cursor set
     */
    _recursiveFetch({ endingKey, index = 0, keySet = [], resolve, reject }) {
        this.redisClient.lrange(HASH_SET, index, index + 10, (err, keys) => {
            if (err) {
                console.error('error by redis: ', err);
                return resolve([]);
            }
            console.log('reply:', keys);
            if (keys.length > 0 && !keys.includes(endingKey)) {
                keySet.push(...keys);
                index += keys.length;
                this._recursiveFetch({ endingKey, index, keySet, resolve, reject })
            } else {
                keySet.push(...keys);
                if (keySet.length == 0) return resolve([]);
                // fetch all blocks, using the retrieved keyset
                console.log('TOTAL KEYS FETCHED: ', keySet);
                this.redisClient.mget(...keySet, (err, blocks) => {
                    if (err) {
                        console.error('error by redis: ', err);
                        return resolve([]);
                    }
                    // make json and reverse list
                    const jsonList = this._jsonTransformBlocks({ blocks, order: 1 })
                    if (jsonList.length > 0) {
                        resolve(jsonList);
                    } else {
                        return resolve([]);
                    }
                });
            }
        });
    }

    /** 
     * Bewaar de KEY van de nieuwe block in de KEYS list als eerste in de list (reverse order list) 
     */
    _storeBlockKey({reject, resolve, block}) {
        const { hash } = block;
        this.redisClient.lindex(hash, 0, (err, reply) => {

        });
        this.redisClient.lpush(HASH_SET, hash, (err, reply) => {
            if (err) {
                console.error('error by redis', err);
                if (reject) return reject(err);
                return;
            }
            this._storeSenderIndex({ block });
            if (resolve) resolve(reply);
        }); 
    }

    _storeSenderIndex({ block }) {
        // deconstruct de hash en de sender uit het block object
        const { hash, data } = block;
        for (let transaction of data) {
            const key = PREFIX_SENDER + transaction.sender.address;
            this.redisClient.sadd(key, hash);
        }
    }

    // converteer redis stringyfied object naar JSON
    // order 0 is normaal, order 1 is reversed order
    _jsonTransformBlocks({ blocks, order = 0 }) {
        let jsonList = [];
        if (order === 1) { // reversed
            for (let i = blocks.length - 1; i >= 0; i--) {
                jsonList.push(this._transformBlock(blocks[i]));
            }
        } else { // normal order
            for (let i = 0; i < blocks.length; i++) {
                jsonList.push(this._transformBlock(blocks[i]));
            }
        }
        return jsonList;
    }
    _transformBlock(stringBlock) {
        return JSON.parse(stringBlock);
    }
}

module.exports = PersistenceStore;