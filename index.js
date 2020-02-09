const { sleep, makeid } = require('./helpers');
const puppeteer = require('puppeteer-core');
const axios = require('axios');
const chainify = require('./chainify');

class Task {
    constructor() {
        this.name = '';
        this.vars = [];
        this.lastVar = '';
        this.pool = [];
    }

    newPage(...args) {
        this.lastVar = makeid(10);
        this.vars.push(this.lastVar);
        this.pool.push({
            type: 'VarDeclaration',
            var: this.lastVar,
            const: true,
            value: {
                fn: { call: 'await autonomous._browser.newPage', args: args }
            }
        })
    }

    goto(...args) {
        this.pool.push({
            type: 'ObjectCallFunction',
            Obj: this.lastVar,
            fn: { call: 'await ' + this.lastVar + '.goto', args: args }
        })
    }

    click(...args) {
        this.pool.push({
            type: 'ObjectCallFunction',
            Obj: this.lastVar,
            fn: { call: 'await ' + this.lastVar + '.click', args: args }
        })
    }

    type(...args) {
        this.pool.push({
            type: 'ObjectCallFunction',
            Obj: this.lastVar,
            fn: { call: 'await ' + this.lastVar + '.type', args: args }
        })
    }

    waitForSelector(...args) {
        this.pool.push({
            type: 'ObjectCallFunction',
            Obj: this.lastVar,
            fn: { call: 'await ' + this.lastVar + '.waitForSelector', args: args }
        })
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
        this._attemptsCount = 10;
        this._target = undefined;
        this._browser = undefined;
        this._launchBrowser = false;
        this._tasks = [];
    }

    async tryConnect(host, port) {
        try {
            return await axios.get(`http://${host}:${port}/json/version`);
        } catch (error) {
            console.error(`Trying connect again... ${this._attemptsCount--} attempts remaining...`);
            await sleep(1000);
            return this._attemptsCount >= 0 ? await this.tryConnect(host, port) : process.exit();
        }
    }

    async startConnection(host, port) {
        const response = await this.tryConnect(host, port);
        const url = (response.data)['webSocketDebuggerUrl'];
        this._browser = await puppeteer.connect({
            browserWSEndpoint: url,
            defaultViewport: null
        });
    }

    async waitForTarget(predicate) {
        this._target = await this._browser.waitForTarget(predicate, {
            timeout: 0
        });
    }

    async waitForAll(page, itemSelectors) {
        return Promise.all(Object.values(itemSelectors)
            .map(d => page.waitFor(d)));
    }

    async closeConnection() {
        return await this._browser.disconnect();
    }

    async getPages() {
        return await this._browser.pages();
    }

    async getTargetPage() {
        return await this._target.page()
    }

    async getTitles() {
        return Promise.all((await this.getPages()).map(d => d.title()))
    }

    task(name) {
        let obj = chainify(new Task(this._browser))
            .setName(name);
        this._tasks.push(obj)
        return obj;
    }

    build() {
        let code = '';

        this._tasks.forEach(t => {
            code += `const ${t.name} = (async () => {\n`
            t.pool.forEach(d => {
                switch (d.type) {
                    case 'VarDeclaration': {
                        if (d.var !== undefined) {
                            code += '   ' + (d.const ? 'const' : 'let') + ' ' + d.var + ' = ' +
                                (
                                    d.value.fn.call + '(' +
                                    (d.value.fn.args.map(i => JSON.stringify(i))) + ')'
                                )
                                ;
                        }
                        break;
                    }

                    case 'ObjectCallFunction': {
                        code += `   ${d.fn.call}(${d.fn.args.map(i => JSON.stringify(i))})`
                        break;
                    }
                }
                code += '\n';
            })

            code += `\n});\n\n`
        })

        code += `const autonomous = require('./index');\n` +
            `(async () => {\n` +
            `   ${this._launchBrowser
                ? 'await autonomous._browser.launch()'
                : "await autonomous.startConnection('localhost',9444)"};\n`;

        code += this._tasks.map(t => `   await ${t.name}();`).join('\n') + '\n';
        code +=
            `   await autonomous.closeConnection();\n` +
            `})()`
        // console.log(code)

        const fs = require('fs');
        fs.writeFileSync('main.autonomous.js', code, { encoding: 'UTF-8' });

    }

    run() {
        const { spawn } = require('child_process');

        spawn('node', ['main.autonomous.js'], {
            stdio: 'inherit',
            detached: true
        }).unref();
    }

    launch() {
        this._launchBrowser = true;
    }

}

module.exports = chainify(new Autonomous());