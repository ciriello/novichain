/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: pubnub-impl.js (Pub-Nub implementatie)
 Omschrijving: Pub-Nub implementatie van de PublischSubscribeManger

 ****   *   *  ****   *****  *   * ****
 *   *  *   *  *   *  *   *  *   * *   *
 * *    *   *  ****   *   *  *   * ****
 *      *   *  *   *  *   *  *   * *   *
 *      *****  ****   *   *  ***** **** 

*/

const PubNub = require('pubnub');

/**
 * PubNub connect keys
 */
const PUBLISH_KEY = process.env.PUBLISH_KEY || 'dummy_pub_key';
const SUBSCRIBE_KEY = process.env.SUBSCRIBE_KEY || 'dummy_sub_key';
const SECRET_KEY = process.env.SECRET_KEY || 'dummy_sec_key';
const credentials = {
    publishKey: PUBLISH_KEY,
    subscribeKey: SUBSCRIBE_KEY,
    secretKey: SECRET_KEY,
};

console.log('credentials', credentials);

/**
 * Channels voor het publiceren en abonneren door verschillende nodes:
 * 
 * SYNCCHANNEL: pubsub kanaal voor het synchroniseren van een 'op startende' node.
 * MINERCHANNEL: pubsub kanaal voor het aanmelden als miner
 * BLOCKCHAIN: pubsub kanaal voor het publiceren van een nieuw block en op miners de block
 *             te laten 'minen' en aan de chain toe te laten voegen.
 */
const PUBSUB_CHANNELS = {
    BLOCKCHAIN_CHANNEL: 'BLOCKCHAIN_CHANNEL',
    TRANSACTION_CHANNEL: 'TRANSACTION_CHANNEL',
    MINER_CHANNEL: 'MINER_CHANNEL',
    SYNC_CHANNEL: 'SYNC_CHANNEL',
};

class PublishSubscribeManager {
    constructor({ blockchain }) {
        this.blockchain = blockchain;
        this.pubnub = new PubNub(credentials);

        this.subscribe();
        this.pubnub.addListener(this.processMessage());
    }

    processMessage() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;
                const parsedMessageJSON = JSON.parse(message);
                console.log(`Message received. Channel: ${channel}. Message: ${message}`);
                if (channel === PUBSUB_CHANNELS.BLOCKCHAIN_CHANNEL) {
                    this.blockchain.updateLocalChain(parsedMessageJSON);
                }
            }
        };
    }

    subscribe() {
        this.pubnub.subscribe({ channels: [Object.values(PUBSUB_CHANNELS)]});
    }

    publish({channel, message}) {
        this.pubnub.publish({ channel, message });
    }

    broadcast() {
        const jsonMessage = JSON.stringify(this.blockchain.chain);
        this.publish({
            channel: PUBSUB_CHANNELS.BLOCKCHAIN_CHANNEL,
            message: jsonMessage
        });
    }
}

module.exports = PublishSubscribeManager;
