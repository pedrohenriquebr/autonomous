const getHandler = {
    get: (target, property, receiver) => {
        if (typeof target[property] === 'function') {
            return (...args) => {
                const result = target[property](...args);
                return result === undefined ? receiver : result;
            }
        } else {
            return target[property];
        }
    }
}

const chainify = (obj) => new Proxy(obj, getHandler);

module.exports = chainify;