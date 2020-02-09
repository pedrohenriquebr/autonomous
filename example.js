let autonomous = require('./index');
autonomous
    .task('task1')
    .newPage()
    .goto('http://www.google.com')
    .type("input[name='q']", "Why do I have to use Puppeteer ?")
    .waitForSelector("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")
    .click("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")

autonomous
    .task('task2')
    .newPage()
    .goto('http://google.com/')
    .type("input[name='q']", "How to use Puppeteer?")
    .waitForSelector("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")
    .click("#tsf > div:nth-child(2) > div.A8SBwf.emcav > div.UUbT9 > div.aajZCb > div.tfB0Bf > center > input.gNO89b")

autonomous
    .build()
    .run()