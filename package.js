Package.describe({
  name: 'skykode:streams',
  version: '1.0.0',
  summary: 'DB Less realtime communications',
  git: 'github.com:iMagdy/meteor-streams.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2');
    api.use('ecmascript');
    api.use('modules');
    api.use('underscore', ['client', 'server']);
    // api.addFiles('lib/ev.js', ['client', 'server']);
    api.addFiles(['lib/server.js', 'lib/stream_permission.js'], 'server');
    api.addFiles('lib/client.js', 'client');
    api.mainModule('lib/ev.js');
});
