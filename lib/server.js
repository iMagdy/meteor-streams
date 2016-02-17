import {EventEmitter} from 'events';
import {default as util} from 'util';
import {EV} from './ev.js';
import {Permissions} from './stream_permission.js';
import 'fibers';

class Stream {
    constructor(name) {
        this.name             = name;
        this.streamName       = 'stream-' + name;
        this.allowResultCache = true;
        this.allowResults     = {};
        this.filters          = [];
        this.events           = new EventEmitter();

        this.events.setMaxListeners(0);
        this.disconnectEvents = new EV();
        this._emit            = this.emit;
        this.defaultResult    = (typeof(Package) == 'object' && Package.insecure) ? true : Meteor.Collection.insecure === true;
        this.PERMISSIONS      = new Permissions(this.defaultResult, true);

        this.methods          = {};

        Meteor.publish(this.streamName, function() {
            check(arguments, Match.Any);
            let subscriptionId = Random.id();
            let publication    = this;

            //send subscription id as the first document
            publication.added(this.streamName, subscriptionId, {
                type: 'subscriptionId'
            });
            publication.ready();
            this.events.on('item', onItem);

            function onItem(item) {
                Fibers(function() {
                    let id = Random.id();
                    if (this.PERMISSIONS.checkPermission('read', subscriptionId, publication.userId, item.args)) {
                        if (subscriptionId != item.subscriptionId) {
                            publication.added(this.streamName, id, item);
                            publication.removed(this.streamName, id);
                        }
                    }
                }).run();
            }

            publication.onStop(function() {
                Fibers(function() {
                    this.disconnectEvents.emit(subscriptionId);
                    this.disconnectEvents.removeAllListeners(subscriptionId);
                }).run();
                this.events.removeListener('item', onItem);
            });
        });

        this.methods[this.streamName] = function(subscriptionId, args) {
            check(arguments, Match.Any);
            //in order to send this to the server callback
            let userId = this.userId;
            Fibers(function() {
                let methodContext = {};
                methodContext.userId = userId;
                methodContext.subscriptionId = subscriptionId;

                //in order to send this to the serve callback
                methodContext.allowed = this.PERMISSIONS.checkPermission('write', subscriptionId, methodContext.userId, args);
                if (methodContext.allowed) {
                    //apply filters

                    function applyFilters(args, context) {
                        let eventName = args.shift();
                        this.filters.forEach(function(filter) {
                            args = filter.call(context, eventName, args);
                        });
                        args.unshift(eventName);
                        return args;
                    }

                    args = applyFilters(args, methodContext);
                    self.emitToSubscriptions(args, subscriptionId, methodContext.userId);
                    //send to firehose if exists
                    if (self.firehose) {
                        self.firehose(args, subscriptionId, methodContext.userId);
                    }
                }
                //need to send this to server always
                self._emit.apply(methodContext, args);

                //register onDisconnect handlers if provided
                if (typeof(methodContext.onDisconnect) == 'function') {
                    disconnectEvents.on(subscriptionId, methodContext.onDisconnect)
                }

            }).run();
        };
        Meteor.methods(this.methods);

    }

    emit() {
        this.emitToSubscriptions(arguments, null, null);
    }

    addFilter(callback) {
        this.filters.push(callback);
    }

    emitToSubscriptions(args, subscriptionId, userId) {
        this.events.emit('item', {
            args: args,
            userId: userId,
            subscriptionId: subscriptionId
        });
    }
}

Meteor.Stream = Stream;
// util.inherits(Meteor.Stream, EV);
