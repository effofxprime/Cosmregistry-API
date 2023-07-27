"use strict";

/*
1. Use github api to get directory lists for mainnet and testnet
2. Drill into directorys and grab a few pieces of info from the cooresponding chain.json
3. Structure the object for JSON output
    1. Group by mainnet and testnet
    2. Use full directory name
    3. Show type (dir)
    4. Have update timestamp
    5. Create chain array for data from chain.json
        1. Pretty chain name
        2. Daemon name
        3. chain id
        4. node home location
        5. github repo
*/

// gh = github, CR = chain registry
const ghCRMainnet =
    "https://api.github.com/repos/cosmos/chain-registry/contents";
const ghCRTestnet =
    "https://api.github.com/repos/cosmos/chain-registry/contents/testnets";
// After 'master' would be the chain name and then chain.json.  'testnets' would need to go after master to access them too.
const ghRaw = "https://raw.githubusercontent.com/cosmos/chain-registry/master";
const ghRawTestnet =
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets";

// To query the chain.json, use this to get it once we get the directory names.
// https://raw.githubusercontent.com/cosmos/chain-registry/master/$chain/chain.json
// Testnet chains have 'testnet' at the end of the chainname
// https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/$chainnametestnet/chain.json

const ghToken = require("./ghtoken.json");
const ghAuthHeader = {
    headers: { Authorization: `token ${ghToken.token}` },
};

const fs = require("fs");
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

// const puppeteer = require("puppeteer");
// process.setMaxListeners(Infinity); // <== Important line

async function getChainList(url) {
    const list = await fetch(url, ghAuthHeader)
        .then((data) => data.json())
        .then((res) => {
            const arr = [];
            res.forEach((el) => {
                if (
                    !el.name.includes(".") &&
                    !el.name.includes("_") &&
                    el.name != "testnets"
                )
                    arr.push(el.name);
            });
            return arr;
        });
    return await Promise.all(list);
}

async function getModifiedDate(chain) {
    // const browser = await puppeteer.launch({ headless: "new" });
    // const page = await browser.newPage();
    let path = "";
    if (chain.includes("testnet")) {
        path = `testnets/${chain}`;
    } else {
        path = chain;
    }

    // const url = `https://github.com/cosmos/chain-registry/tree/master/${path}`
    // page.goto(
    //     url,
    //     { waitUntil: "domcontentloaded" }
    // );
    // await page.waitForSelector("relative-time");

    // const time = await page.evaluate(() =>
    //     document.querySelector("relative-time").getAttribute("datetime")
    // );
    // // console.log(time);
    // await browser.close();

    // return await Promise.all(time);

    /**
     * New magic
     */
    //     curl -sL https://api.github.com/repos/cosmos/chain-registry/commits?path=8ball | jq '.[0].commit.committer.date'
    // "2023-05-06T03:14:53Z"
    const url = `https://api.github.com/repos/cosmos/chain-registry/commits?path=${path}`;
    const result = await fetch(url).then((res) => res.json());
    const datetime = result[0].commit.committer.date;
    const utcDate = new Date(datetime).toDateString();
    return utcDate;

    // const repoHTML = await fetch("https://github.com/cosmos/chain-registry")
    //     .then((res) => res.text())
    //     .then((html) => {
    //         const dom = new JSDOM(html).window.document;
    //         // const result = dom
    //         //     .querySelector(
    //         //         "div.js-details-container.Details"
    //         //     ).querySelector("relative-time").textContent
    //         console.log(html);
    //         const result = dom.querySelector('[datetime]').textContent
    //         console.log(result);

    //         /*
    //         * ## The below is when the url to fetch doesn't include a chain and is just top level
    //         const result = dom.querySelector('div.js-details-container.Details')
    //         const name = result.querySelector('a[title="8ball"]')
    //         const datetime = result.querySelector('[datetime]').textContent

    //         console.log(name);
    //         console.log(datetime);
    //         return name;
    //          */
    //     });

    /**
         *   const dom = new jsdom.JSDOM(html);
        // const doc = parser.parseFromString(html, 'text/html')
        return dom
    }
         */
    // console.log(repoHTML);
    // const dom = new JSDOM(repoHTML).window.document;
    // console.log(dom);
    // console.log(dom.querySelector("relative-time"));
}

async function getChainInfo(url) {
    let ghRawURL = "";
    if (url.includes("testnets")) {
        ghRawURL = ghRawTestnet;
    } else {
        ghRawURL = ghRaw;
    }

    const chainList = await getChainList(url);
    let chainListObj = {};
    let arr = [];

    chainList.forEach((el) => {
        const chainDataURL = `${ghRawURL}/${el}/chain.json`;
        arr.push(chainDataURL);
    });
    await Promise.allSettled(
        arr.map(async (el) => {
            const chainJson = await fetch(el).then((data) =>
                Promise.resolve(data.json())
            );
            /**
             * List of object keys we want
             *
             * chain_name == dir name as well
             * network_type
             * website
             * pretty_name
             * daemon_name
             * chain_id
             * node_home
             * staking.staking_tokens[0].denom
             * codebase.git_repo
             * codebase.recommended_version
             * Match version # from above and find it in the versions array => versions[##].tag - When we find the ##, we can then find cosmos sdk & tendermint versions to use and check against any versions that may be listed in the prop.
             *      versions[x].{tag, cosmos_sdk_version, consensus.version} // These may or may not exist in chain.json for chain registry
             */

            chainListObj[chainJson.chain_name] = {
                name: chainJson.chain_name,
                pretty_name: chainJson.pretty_name,
                network_type: chainJson.network_type,
                website: chainJson.website,
                daemon_name: chainJson.daemon_name,
                chain_id: chainJson.chain_id,
                node_home: chainJson.node_home,
                demon: chainJson.staking.staking_tokens[0].denom,
                git_repo: chainJson.codebase.git_repo,
                recommended_version: chainJson.codebase.recommended_version,
                //last_modified: #TODO ## document.querySelector("#repo-content-pjax-container > div > div > div.Layout.Layout--flowRow-until-md.Layout--sidebarPosition-end.Layout--sidebarPosition-flowRow-end > div.Layout-main > div.Box.mb-3 > div.js-details-container.Details > div.Details-content--hidden-not-important.js-navigation-container.js-active-navigation-container.d-md-block > div:nth-child(15) > div.color-fg-muted.text-right > relative-time").getAttribute("datetime") ##
                last_modified: await getModifiedDate(chainJson.chain_name),
            };
        })
    );
    // console.log(chainListObj);
    return chainListObj;
}

(async () => {
    const mainnet = await getChainInfo(ghCRMainnet);
    const testnet = await getChainInfo(ghCRTestnet);
    let chainList = {
        mainnet: await getChainList(ghCRMainnet),
        testnet: await getChainList(ghCRTestnet),
        ...mainnet,
        ...testnet,
    };
    // console.log(mainnet);
    // console.log(JSON.stringify(chainList, null, 2));
    // console.dir(chainList, { maxArrayLength: null });
    // await getChainInfo(ghCRMainnet);
    // console.log(chainList);
    const data = JSON.stringify(chainList);
    fs.writeFile("data.json", data, (err) => {
        if (err) {
            console.error(err);
            throw err;
        }
        console.log("Success");
    });
    // await getModifiedDate("8ball");
})();
