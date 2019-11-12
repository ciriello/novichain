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
                console.log('reply:', reply);
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
     * Recursieve functie.
     * Haalt in blokken van 10 hash waardes op van de laatst toegevoegde blocks
     * totdat de laatst bekende hash waarde van een block bereikt is.
     * 
     * @param {endingKey, index} endingKey de laatse hashwaarde bekend bij de NODE, index volgende cursor set
     */
    fetchAll({ endingKey, index = 0 }) {
        return new Promise((resolve, reject) => {
            this._recursiveFetch({ endingKey, index, resolve, reject });
        });
    }

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