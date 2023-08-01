/**
 * @Author Jonathan - Erialos
 * @Email erialos@thesilverfox.pro
 * @Date 2023-07-31 17:46:56
 * @Last Modified by: Jonathan - Erialos
 * @Last Modified time: 2023-07-31 17:47:47
 * @Description This script uses Bree to schudel running the script to gather data to serve over the json-server api
 */

const path = require("path");
const Graceful = require("@ladjs/graceful");
const Bree = require("bree");

const configDir = path.join(__dirname, "../config");
const config = require(`${configDir}/config.json`);

const bree = new Bree({
    root: path.join(__dirname),
    jobs: [
        {
            name: "gatherData",
            interval: `${config.interval}`,
        },
    ],
});

const graceful = new Graceful({ brees: [bree] });
graceful.listen();

(async () => {
    await bree.start();
})();
