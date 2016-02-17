class Permissions {
    constructor(acceptAll, cacheAll) {
        this.options = {
            "read": {
                results: {}
            },
            "write": {
                results: {}
            }
        };
    }

    read(func, cache) {
        this.options['read']['func'] = func;
        this.options['read']['doCache'] = (cache === undefined) ? cacheAll : cache;
    };

    write(func, cache) {
        this.options['write']['func'] = func;
        this.options['write']['doCache'] = (cache === undefined) ? cacheAll : cache;
    };

    checkPermission(type, subscriptionId, userId, args) {
        let eventName = args[0];
        let namespace = subscriptionId + '-' + eventName;
        let result = this.options[type].results[namespace];

        if (result === undefined) {
            let func = this.options[type].func;
            if (func) {
                let context = { subscriptionId, userId };
                result = func.apply(context, args);
                if (this.options[type].doCache) {
                    this.options[type].results[namespace] = result;
                }
                return result;
            } else { return acceptAll; }
        } else { return result; }
    };

}

export {Permissions}
