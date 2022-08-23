const dotenv = require('dotenv').config();
const pvKey = process.env.PRIVATEKEY;
const from =  process.env.FROM;
const to =  process.env.OUTPUTADDRESS;

const yesno = require("yesno");

const BigNumber = require("bignumber.js");
let bitcoin = require("bitcoinjs-lib");


let network = {
    messagePrefix: '\x18SoliduscoinSigned Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x3f,
    scriptHash: 0x32,
    wif: 0xb0,
};

const BN = BigNumber.clone({ DECIMAL_PLACES: 8 });

async function construct({ client, limit }) {
    let unspent = await client.listUnspent(1, 9999999, [from]);
    
    var inputsTotal = unspent.length;
    while (inputsTotal > 300) {
        if (unspent.length === 0) {
            throw new Error("No suitable UTXO found");
        }

        if (limit) {
            unspent = unspent.slice(0, limit);
        }

        let amount;
        let fee;
        let hex;
        let vsize;
        let start = 0;
        let end = unspent.length;
        let sliceTo = end;
        let success = false;

        console.info("Picking up maximum number of inputs...");

        
        while (!success) {
            let res;
            console.info(" trying:", sliceTo);
            const unspentSlice = unspent.slice(0, sliceTo);
            const inputs = unspentSlice.map((u) => ({
                txid: u.txid,
                vout: u.vout,
            }));
            amount = unspentSlice
                .reduce((prev, { amount }) => prev.plus(amount), new BN(0))
                .toNumber();

            var tx = new bitcoin.TransactionBuilder(network);
            
            inputs.forEach( e => {
                tx.addInput(e.txid, e.vout);
            });
            
            fee = ((
                192 + ( (inputsTotal - 1) * 148) + 
                ( (34*1)) 
                ) * 2000); // change 2000 to appropriate fee
                
            console.log("Input Length : ",inputs.length, fee);

            amount = parseInt(amount * 1e8 - fee);
            tx.addOutput(to, amount);

            try {
                // create and try to send transaction here check if transaction is large or small
                var keyPair = bitcoin.ECPair.fromWIF(pvKey, network);
                inputs.forEach( (e, i) => {
                    tx.sign(i, keyPair);
                });

                hex = tx.build().toHex();

                // checking tx vsize show be below 100000
                res = await client.decodeRawTransaction(hex);
                vsize = res.vsize

                if (vsize > 100000) {
                    end = sliceTo;
                    sliceTo = start + Math.floor((end - start) / 2);
                    inputsTotal = sliceTo - start;
                    continue;
                }

                if (sliceTo === end || end - start <= 1) {
                    console.log("success");
                    success = true;
                } else {
                    start = sliceTo;
                    sliceTo = start + Math.floor((end - start) / 2);
                    inputsTotal = sliceTo - start;
                }


                console.info();
                console.info("Number of inputs:", sliceTo);
                console.info("Inputs total amount:", amount);
                console.info("Output amount:", amount - fee);
                console.info("Fee:", fee);
                console.info();

                // const ok = await yesno({
                //     question: "Are you sure you want to broadcast the transaction?",
                // });
                // if (!ok) process.exit(0);

                const txid = await broadcast({ client, hex: hex });
                console.log(txid)
                inputsTotal = (await client.listUnspent(1, 9999999, [from])).length;
                unspent = await client.listUnspent(1, 9999999, [from]);
            } catch (e) {
                if (e.message === "Transaction too large") {
                    end = sliceTo;
                    sliceTo = start + Math.floor((end - start) / 2);
                    inputsTotal = sliceTo - start;
                    continue;
                }
                console.error(e);
                throw e;
            }
        }
    }
}

async function broadcast({ client, hex }) {
    console.log("Broadcasting transaction...");
    const txid = await client.sendRawTransaction(hex);
    console.log("Done!");
    return txid;
}

module.exports = {
    construct,
    broadcast,
};