/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (PublischSubscribeManger)
 Omschrijving: Redis implementatie van de PublishSubscribeManager

 ****   ***** ****  *****  ***
 *   *  *     *   *   *   *   
 * *    ***   *   *   *    ***
 *  *   *     *   *   *       *
 *   *  ***** ****  *****  ***
 
*/

const redis = require('redis');

/**
 * Channels voor het publiceren en abonneren door verschillende nodes:
 * 
 * SYNC_CHANNEL      : pubsub kanaal voor het synchroniseren van een 'op startende' node.
 * MINER_CHANNEL     : pubsub kanaal voor het aanmelden als miner
 * BLOCKCHAIN_CHANNEL: pubsub kanaal voor het publiceren van een nieuw block en op miners de block
 *                     te laten 'minen' en aan de chain toe te laten voegen.
 * TRANSACTION_CHANNEL: synchroniseert de transacties over all nodes
 */
const PUBSUB_CHANNELS = {
    BLOCKCHAIN_CHANNEL: 'BLOCKCHAIN_CHANNEL',
    TRANSACTION_CHANNEL: 'TRANSACTION_CHANNEL',
    MINER_CHANNEL: 'MINER_CHANNEL',
    SYNC_CHANNEL: 'SYNC_CHANNEL',
};

class PublishSubscribeManager {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;

        this.pubClient = redis.createClient();
        this.subClient = redis.createClient();

        this.subscribe();
        this.subClient.on('message', (channel, message) => {
            return this.processMessage(channel, message)
        });
    }

    processMessage(channel, message) {
        console.log(`Message received. Channel: ${channel}. Message: ${message}`);

        const parsedMessageJSON = JSON.parse(message);

        switch(channel) {
            case PUBSUB_CHANNELS.BLOCKCHAIN_CHANNEL:
                this.blockchain.updateLocalChain(parsedMessageJSON, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessageJSON
                    });
                });
                break;

            case PUBSUB_CHANNELS.TRANSACTION_CHANNEL:
                this.transactionPool.setTransaction(parsedMessageJSON);
                break;

            default:
                return;
        }

    }

    subscribe() {
        Object.values(PUBSUB_CHANNELS).forEach(channel => {
            this.subClient.subscribe(channel);
        });
    }

    publish({ channel, message }) {
        this.subClient.unsubscribe(channel, () => {
            this.pubClient.publish(channel, message, () => {
                this.subClient.subscribe(channel);
            });
        });
    }

    broadcastChain() {
        this.publish({
            channel: PUBSUB_CHANNELS.BLOCKCHAIN_CHANNEL,
            message: JSON.stringify(this.blockchain.chain),
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: PUBSUB_CHANNELS.TRANSACTION_CHANNEL,
            message: JSON.stringify(transaction)
        });
    }
}

module.exports = PublishSubscribeManager;
