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
const HASH_SET = 'block_hashes_ordered_reversed';

class PersistenceStore {
    constructor() {
        this._keySet = [];
        this.redisClient = redis.createClient();
        // voor demo doeleinde wordt hier een andere database geselecteerd
        // in productie situatie niet nodid, daar elke node een eigen redis
        // instantie heeft
        if (process.env.RANDOM_NODE_PORT) {
            this.redisClient.select(5, (err, reply) => {
                if (err) return console.error('error by redis:', err);
                console.log('reply by redis:', reply);
            })
        }
    }

    /** ASYNC functie. Slaat de nieuwe block op in de DATABASE */
    store({ newBlock }) {
        return new Promise((resolve, reject) => {
            const { hash } = newBlock;
            const stringifiedBlock = JSON.stringify(newBlock);

            /** Voeg de nieuwe BLOCK toe aan de database */
            this.redisClient.set(hash, stringifiedBlock, (err, reply) => {
                // bij een error wordt de Promise gereject.
                if (err) {
                    console.error('error by redis: ', err);
                    return reject(err);
                }
                /** Bewaar de KEY van de nieuwe block in de KEYS list als eerste in de list (reverse order list) */
                this.redisClient.lpush(HASH_SET, hash, (err, reply) => {
                    if (err) {
                        console.error('error by redis', err);
                        return reject(err);
                    }
                    resolve(reply);
                });                
            });
        });
    }

    replace({ chain }) {
        for (let i=0; i<chain.length; i++) {
            const block = chain[i];
            const { hash } = block;
            const stringifiedBlock = JSON.stringify(block);
            this.redisClient.set(hash, stringifiedBlock);
        }
    }

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

    fetchAll({ endingKey, index = 0 }) {
        return new Promise((resolve, reject) => {
            this._recursiveFetch({ endingKey, index, resolve, reject });
        });
    }

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
    _recursiveFetch({ endingKey, index = 0, resolve, reject }) {
        this.redisClient.lrange(HASH_SET, index, index + 10, (err, reply) => {
            if (err) {
                console.error('error by redis: ', err);
                return reject(err);
            }
            if (reply.length > 0) {
                this._keySet.push(...reply);
                index += reply.length;
                this._recursiveFetch({ endingKey, index, resolve, reject })
            } else {

                if (this._keySet.length == 0) return reject("no items found")
                
                // fetch all blocks, using the retrieved keyset
                console.log('TOTAL KEYS FETCHED: ', this._keySet);
                this.redisClient.mget(...this._keySet, (err, reply) => {
                    if (err) {
                        console.error('error by redis: ', err);
                        return reject(err);
                    }
                    console.log('blocks retrieved', reply);
                    // make json and reverse list
                    let jsonList = [];
                    for (let i = reply.length - 1; i>=0; i--) {
                        const block = reply[i];
                        const jsonBlock = JSON.parse(block);
                        jsonList.push(jsonBlock);
                    }
                    if (jsonList.length > 0) {
                        resolve(jsonList);
                    } else {
                        reject("no items found");
                    }
                });
            }
        });
    }
}

module.exports = PersistenceStore;