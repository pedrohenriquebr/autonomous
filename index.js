const core = require('./core');
const puppeteer = require('puppeteer-core');
const axios = require('axios');

class Autonomous {
    constructor() {
        this.attemptsCount = 10;
        this.target = undefined;
    }

    tryConnect = async (host, port) => {
        try {
            return await axios.get(`http://${host}:${port}/json/version`);
        } catch (error) {
            console.error(`Trying connect again... ${this.attemptsCount--} attempts remaining...`);
            await core.sleep(1000);
            return this.attemptsCount >= 0 ? await this.tryConnect(host, port) : process.exit();
        }
    }


    startConnection = async (host, port) => {
        const response = await this.tryConnect(host, port);
        const url = (response.data)['webSocketDebuggerUrl'];
        this.browser = await puppeteer.connect({
            browserWSEndpoint: url,
            defaultViewport: null
        });
    }

    waitForTarget = async (predicate) => {
        this.target = await this.browser.waitForTarget(predicate, {
            timeout: 0
        });
    };

    waitForAll = async (page, itemSelectors) => Promise.all(Object.values(itemSelectors)
        .map(d => page.waitFor(d)));

    closeConnection = async () => await this.browser.disconnect();

    getPages = async () => await this.browser.pages();

    getTargetPage = async () => await this.target.page();

    getTitles = async () => Promise.all((await this.getPages()).map(d => d.title()));

}

module.exports = Autonomous;