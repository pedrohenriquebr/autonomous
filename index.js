const puppeteer = require('puppeteer-core');
const axios = require('axios');
const fs = require('fs');

const chainify = require('./chainify');
const { sleep, makeid } = require('./helpers');

const ENV = process.env.ENV || 'production';

class Task {
    constructor() {
        this._name = '';
        this._vars = [];
        this._lastVar = '';
        this._pool = [];
        this._executionMode = 'series';
    }

    newPage(...args) {
        this._lastVar = makeid(10);
        this._vars.push(this._lastVar);
        this._pool.push({
            type: 'VarDeclaration',
            var: this._lastVar,
            const: true,
            value: {
                fn: { call: 'await autonomous._browser.newPage', args: args }
            }
        })
    }

    goto(...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.goto', args: args }
        })
    }

    click(...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.click', args: args }
        })
    }

    type(...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.type', args: args }
        })
    }

    waitForSelector(...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.waitForSelector', args: args }
        })
    }

    waitForNavigation(...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.waitForNavigation', args: args }
        })
    }

    clickWaitFor(selector, ...options) {
        this.waitForSelector(selector, ...options)
        this.click(selector, ...options)
    }

    evaluate(fn, ...args) {
        this._pool.push({
            type: 'ObjectCallFunction',
            Obj: this._lastVar,
            fn: { call: 'await ' + this._lastVar + '.evaluate', args: [...arguments] }
        })
    }

    setName(name) {
        this._name = name;
    }

    getName() {
        return this._name;
    }

}


class Autonomous {
    constructor() {
        this._attemptsCount = 10;
        this._target = undefined;
        this._browser = undefined;
        this._launchBrowser = false;
        this._tasks = [];
        this._executionBlocks = [];
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

    series(arrTasks) {
        this._executionBlocks.push({ type: 'series', tasks: arrTasks });

    }

    parallel(arrTasks) {
        this._executionBlocks.push({ type: 'parallel', tasks: arrTasks });
    }

    build() {

        // //Se não for definido series ou parallel, todas as tasks vão para series
        // if (this._executionBlocks.length == 1) {
        //     this._executionBlocks[0].pool = this._tasks.map(d => d.name);
        //     console.log(this._executionBlocks);
        // }

        let code = '';
        let thisInstance = this;

        if (this._executionBlocks.length == 0) {
            this._executionBlocks = [{
                type: 'series',
                tasks: this._tasks.map(d => d._name)
            }];
            console.log(this._executionBlocks)
        }

        this._tasks.forEach(t => {
            code += `const ${t._name} = (async () => {\n`
            t._pool.forEach(d => {
                switch (d.type) {
                    case 'VarDeclaration': {
                        code += '   ' + (d.const ? 'const' : 'let') + ' ' + d.var + ' = ';
                        if (d.value !== undefined) {
                            code += (
                                d.value.fn.call + '(' +
                                (d.value.fn.args.map(i => JSON.stringify(i) || i.toString())) + ')'
                            )
                                ;
                        }
                        break;
                    }

                    case 'ObjectCallFunction': {
                        code += `   ${d.fn.call}(${d.fn.args.map(i => JSON.stringify(i) || i.toString())})`
                        break;
                    }
                }
                code += ';\n';
            })

            code += `\n});\n\n`
        })
        code += `const autonomous = require(${ENV === 'development' ? "\'./index\'" : "\'@pedrobr/autonomous\'"});\n` +
            `(async () => {\n` +
            `   ${this._launchBrowser
                ? 'await autonomous._browser.launch()'
                : "await autonomous.startConnection('localhost',9444)"};\n`;

        code += (
            this._executionBlocks.map(d => {
                return d.type == 'series' ?
                    d.tasks.map(t =>
                        `   await ${thisInstance._tasks
                            .filter(i =>
                                i._name == t)[0]._name}();`).join('\n')
                    : `   await Promise.all([` + (
                        d.tasks.map(t =>
                            `${thisInstance._tasks
                                .filter(i =>
                                    i._name == t)[0]._name}()`).join(',')
                    ) + ']);'
            })
        ).join('\n') + '\n';
        code +=
            `   await autonomous.closeConnection();\n` +
            `})()`
        // console.log(code)
        fs.writeFileSync('main.autonomous.js', code, { encoding: 'UTF-8' });

    }

    run(...args) {
        const { spawn } = require('child_process');
        const out = fs.openSync('./autonomous.log', 'w');
        const err = fs.openSync('./autonomous.log', 'w');

        spawn('node', ['main.autonomous.js'], Object.assign({
            stdio: [
                'inherit',
                out,
                err
            ],
            detached: false
        }, ...args))

    }

    launch() {
        this._launchBrowser = true;
    }

}

module.exports = chainify(new Autonomous());