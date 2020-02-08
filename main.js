let autonomous = require('./index');
(async () => {
    await autonomous.startConnection('localhost', 9444);
    let task1 = autonomous
        .task('task1')
        .standby()
        .newPage()

    console.log(task1);
    await autonomous.closeConnection();
})();

