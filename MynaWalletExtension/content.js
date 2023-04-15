class Ethereum {
    constructor() {
        this._events = {};
    }

    selectedAddress = "hoge";

    request = function(message) {
        console.log(message);
        alert("We need to write wallet connection logic!");
        this.emit('connect', 'test');
    }

    on(name, listener) {
        console.log("hoge");
        if (!this._events[name]) {
            this._events[name] = [];
        }
        this._events[name].push(listener);
    }

    removeListener(name, listenerToRemove) {
        if (!this._events[name]) {
            throw new Error("Error on removeListener");
        }
        const filterListeners = (listener) => listener !== listenerToRemove;
        this._events[name] = this._events[name].filter(filterListeners);
    }

    emit(name, data) {
        if (!this._events[name]) {
            throw new Error("Error on emit");
        }

        const fireCallbacks = (callback) => {
            callback(data);
        };

        this._events[name].forEach(fireCallbacks);
    }

}

const ethereum = new Ethereum();


