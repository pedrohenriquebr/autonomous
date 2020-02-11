let autonomous = require('./index');
autonomous
    .task('task1')
    .newPage()
    .goto('https://www.openprocessing.org/sketch/186320/')
    .evaluate(d => alert('Olá !'))

autonomous
    .task('task2')
    .newPage()
    .goto('https://www.openprocessing.org/sketch/186320/')
    .evaluate(d => alert('Olá !'))


autonomous
    .task('task3')
    .newPage()
    .goto('https://www.openprocessing.org/sketch/186320/')
    .evaluate(d => alert('Olá !'))

autonomous
    .task('task4')
    .newPage()
    .goto('https://www.openprocessing.org/sketch/186320/')
    .evaluate(d => alert('Olá !'))
autonomous
    .parallel(['task1', 'task2'])
    .series(['task4', 'task3'])
    .build()
    // .run({ stdio: 'inherit' })