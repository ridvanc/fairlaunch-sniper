"use strict";
const retry = require("async-retry");
const { approveToken } = require('./approve');

const buySettings = {
    buyDelay: 1,
    buyRetries: 3,
    retryMinTimeout: 250,
    retryMaxTimeout: 3000,
    deadline: 60,
};

const buyToken = async (token, purchaseAmount, gasLimit, gasPrice, myAddress, router) => {
    const buyPair = {
        pair: [
            "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            token.toString()
        ]
    }
    const tx = await retry(
        async () => {
            spinner = ora(`Buying ${token}`).start();
            const amountOutMin = 0;
            let buyConfirmation = await router.swapExactETHForTokens(
                amountOutMin,
                buyPair.pair,
                myAddress,
                Date.now() + 1000 * buySettings.deadline,
                {
                    value: purchaseAmount,
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                }
            );
            return buyConfirmation;
        },
        {
            retries: buySettings.buyRetries,
            minTimeout: buySettings.retryMinTimeout,
            maxTimeout: buySettings.retryMaxTimeout,
            onRetry: (err, number) => {
                spinner.warn("Buy Failed - Retrying", number);
                console.log("Error", err.reason);
                if (number === buySettings.buyRetries) {
                    spinner.fail("Sniping has failed...");
                    console.log("")
                }
            },
        }
    );
    spinner.succeed(`Bought ${token}!`);
    console.log("  Transaction receipt: https://www.bscscan.com/tx/" + tx.hash);
    console.log("  Poocoin chart: https://poocoin.app/tokens/" + token);

    console.log("")
    await approveToken(token);
};

module.exports = {
    buyToken,
};