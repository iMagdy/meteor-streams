class EV {
    constructor() {
        this.handlers = {};
    }

    emit( event ) {
        let args = Array.prototype.slice.call(arguments, 1);
        if (this.handlers[event]) {
            for (let lc = 0; lc < this.handlers[event].length; lc++) {
                let handler = this.handlers[event][lc];
                handler.apply(this, args);
            }
        }
    }

    on(event, callback) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(callback);
    }

    once(event, callback) {
        this.on(event, function onetimeCallback() {
            callback.apply(this, arguments);
            this.removeListener(event, onetimeCallback);
        });
    }

    removeListener(event, callback) {
        if (this.handlers[event]) {
            let index = this.handlers[event].indexOf(callback);
            this.handlers[event].splice(index, 1);
        }
    }

    removeAllListeners( event ) {
        this.handlers[event] = undefined;
    };

}

export {EV};
