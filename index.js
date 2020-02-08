const core = require('./core');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const chainify = require('./chainify');

//I don't know when use it
function makeChainable(fn) {
    let p = Promise.resolve(true);
    return (...args) => {
        p = p.then(() => fn(...args));
        return p;
    };
}

class Task {
    constructor(browser) {
        this.browser = browser;
        this.name = '';
        this.isStandby = false;
        this.pool = [];
    }

    newPage(...args) {
        //I need help here
    }

    standby() {
        this.standby = true;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }


}

class Autonomous {
    constructor() {
        this.attemptsCount = 10;
        this.target = undefined;
        this.browser = undefined;
    }

    async tryConnect(host, port) {
        try {
            return await axios.get(`http://${host}:${port}/json/version`);
        } catch (error) {
            console.error(`Trying connect again... ${this.attemptsCount--} attempts remaining...`);
            await core.sleep(1000);
            return this.attemptsCount >= 0 ? await this.tryConnect(host, port) : process.exit();
        }
    }


    async startConnection(host, port) {
        const response = await this.tryConnect(host, port);
        const url = (response.data)['webSocketDebuggerUrl'];
        this.browser = await puppeteer.connect({
            browserWSEndpoint: url,
            defaultViewport: null
        });
    }

    async waitForTarget(predicate) {
        this.target = await this.browser.waitForTarget(predicate, {
            timeout: 0
        });
    }



    async waitForAll(page, itemSelectors) {
        return Promise.all(Object.values(itemSelectors)
            .map(d => page.waitFor(d)));
    }

    async closeConnection() {
        return await this.browser.disconnect();
    }

    async getPages() {
        return await this.browser.pages();
    }

    async getTargetPage() {
        return await this.target.page()
    }

    async getTitles() {
        return Promise.all((await this.getPages()).map(d => d.title()))
    }

    task(name) {
        return chainify(new Task(this.browser))
            .setName(name);
    }

}

module.exports = new Autonomous();