"use strict";
/**
 * @Author Jonathan - Erialos
 * @Email erialos@thesilverfox.pro
 * @Date 2023-07-27 11:31:41
 * @Last Modified by: Jonathan - Erialos
 * @Last Modified time: 2023-08-02 08:17:17
 * @Description This Javascript program uses the GitHub API to query the Cosmos Registry API to get directory names for
 *      Mainnet and Testnet chains. It also reads the chains specific 'chain.json' file, and puts specific information
 *      into a key object based on the chains folder name in the Cosmos Registry.
 */

const fs = require("fs");
const path = require("path");
const dataDir = path.resolve(__dirname, "../data");
const configDir = path.resolve(__dirname, "../config");

const ghCRMainnet =
    "https://api.github.com/repos/cosmos/chain-registry/contents";
const ghCRTestnet =
    "https://api.github.com/repos/cosmos/chain-registry/contents/testnets";
const ghHeaders = require(`${configDir}/config.json`);
const ghAuthHeader = {
    method: "GET",
    headers: {
        Authorization: `Bearer ${ghHeaders.token}`,
        "User-Agent": `${ghHeaders.user}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    },
};

async function sortArr(arr) {
    return await Promise.resolve(
        arr.sort((a, b) => {
            return a - b;
        })
    );
}

async function ghAPIVersion() {
    const version = await Promise.resolve(
        fetch("https://api.github.com/versions")
            .then((res) => res.json())
            .then((data) => data[0])
    );
    ghAuthHeader.headers["X-GitHub-Api-Version"] = version;
}

async function getChainList(url) {
    const list = await fetch(url, ghAuthHeader)
        .then((res) => {
            if (res.status !== 200) {
                console.log("chain list status:  " + res.status);
            }
            return res.json();
        })
        .catch((err) => console.log(`Error:  ${err}`))
        .then(async (data) => {
            const arr = [];
            data.forEach((el) => {
                if (
                    !el.name.includes(".") &&
                    !el.name.includes("_") &&
                    el.name !== "LICENSE" &&
                    el.name !== "testnets"
                )
                    arr.push(el.name);
            });
            return await sortArr(arr);
        });
    return await Promise.all(list);
}

async function getModifiedDate(chain) {
    let path = "";
    if (chain.includes("testnet") || chain.includes("devnet")) {
        path = `testnets/${chain}`;
    } else {
        path = chain;
    }
    const url = `https://api.github.com/repos/cosmos/chain-registry/commits?path=${path}`;
    const result = await fetch(url, ghAuthHeader)
        .then((res) => {
            if (res.status !== 200) {
                console.log(
                    "Mod Date, Path:  " + path + "  status:  " + res.status
                );
            }
            return res.json();
        })
        .catch((err) => console.log(`Error:  ${err}`));
    const datetime = result[0]?.commit.committer.date;
    const utcDate = new Date(datetime).toDateString();
    return utcDate;
}

async function getChainInfo(url) {
    Object.assign(ghAuthHeader["headers"], {
        Accept: "application/vnd.github.VERSION.raw",
    });

    const chainList = await getChainList(url);
    let chainListObj = {};
    let arr = [];

    chainList.forEach((el) => {
        const chainDataURL = `${url}/${el}/chain.json`;
        arr.push(chainDataURL);
    });

    let sortedArr = await sortArr(arr);

    await Promise.allSettled(
        await sortedArr.map(async (el) => {
            await fetch(el, ghAuthHeader)
                .then(async (res) => {
                    if (res.status !== 200) {
                        console.log(
                            "Chain info, Element:  " +
                                el +
                                "  Status:  " +
                                res.status
                        );
                    }
                    return await res.json();
                })
                .catch((err) => console.log(`Error:  ${err}`))
                .then(async (data) => {
                    const chainName =
                        data?.network_type == "testnet" &&
                        !data?.chain_name.includes("testnet") &&
                        !data?.chain_name.includes("devnet")
                            ? data?.chain_name + "testnet"
                            : data?.chain_name;
                    const denom = data?.staking?.staking_tokens[0]?.denom
                        ? data?.staking?.staking_tokens[0]?.denom
                        : data?.fees?.fee_tokens[0]?.denom;

                    chainListObj[chainName] = {
                        name: chainName,
                        pretty_name: data?.pretty_name,
                        network_type: data?.network_type,
                        website: data?.website,
                        daemon_name: data?.daemon_name,
                        chain_id: data?.chain_id,
                        node_home: data?.node_home,
                        denom: denom,
                        git_repo: data?.codebase?.git_repo,
                        recommended_version:
                            data?.codebase?.recommended_version,
                        last_modified: await getModifiedDate(chainName),
                    };
                });
        })
    );
    return chainListObj;
}

(async () => {
    // Set GitHub API Version
    await ghAPIVersion();

    const mainnet = await getChainInfo(ghCRMainnet);
    const testnet = await getChainInfo(ghCRTestnet);
    let chainList = {
        mainnet: await getChainList(ghCRMainnet),
        testnet: await getChainList(ghCRTestnet),
        ...mainnet,
        ...testnet,
    };

    const data = JSON.stringify(chainList, undefined, 4);
    fs.writeFile(`${dataDir}/data.json`, data, (err) => {
        if (err) {
            console.error(`Error:  ${err}`);
            throw err;
        }
        console.log("Success");
    });
})();
