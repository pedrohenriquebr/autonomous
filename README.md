# Autonomous

A puppeteer-core based library for Processes Automation.

## Installation

Follow the following steps:

```console
$ yarn add @pedrobr/autonomous
```
or 

```console
$ npm install --save @pedrobr/autonomous
```

## Using

```javascript
// We need to 'require' it first
const Autonomous = require('@pedrobr/autonomous');

(async () => {
    // Let's create a object
    const auto = new Autonomous();
    // Now, it's looking for debugging mode browser opened at 'http://localhost:9222'
    await auto.startConnection('localhost',9222);
    console.log("I'm connected to Google Chrome!");
})();
```
It's attachs automatically to Google Chrome, it's simple and easy !
