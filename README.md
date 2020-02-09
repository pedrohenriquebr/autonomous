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

> Make sure you have the Google Chrome opened

```javascript
let autonomous = require('./index');
autonomous
    .task('task1')
    .newPage()
    .goto('http://www.google.com')
    .type("input[name='q']", "Why do I have to use Puppeteer ?")
    .waitForSelector("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")
    .click("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")

autonomous
    .build()
    .run()
```

It's build a new source code on main.autonomous.js:

```javascript
const task1 = (async () => {
   const ikCGDtuCgA = await autonomous._browser.newPage()
   await ikCGDtuCgA.goto("http://www.google.com")
   await ikCGDtuCgA.type("input[name='q']","Why do I have to use Puppeteer ?")
   await ikCGDtuCgA.waitForSelector("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")
   await ikCGDtuCgA.click("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")

});

const autonomous = require('./index');
(async () => {
   await autonomous.startConnection('localhost',9444);
   await task1();
   await autonomous.closeConnection();
})()
```

Yes, this is a very ugly thing 🤓

This is basic library on progress...
