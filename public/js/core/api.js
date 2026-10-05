// Shared API client — auto-injects auth, handles errors
(function() {
  var token = localStorage.getItem('token');

  function _fetch(method, url, body) {
    var opts = { method: method, headers: {} };
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function(r) {
      var parse = r.headers.get('content-type') && r.headers.get('content-type').indexOf('application/json') !== -1;
      if (!parse) {
        if (!r.ok) {
          var err = new Error('Request failed (' + r.status + ')');
          err.status = r.status;
          throw err;
        }
        return null;
      }
      return r.json().then(function(data) {
        if (!r.ok) {
          var err = new Error(data.error || 'Request failed');
          err.status = r.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  window.API = {
    get: function(url) { return _fetch('GET', url); },
    post: function(url, body) { return _fetch('POST', url, body); },
    put: function(url, body) { return _fetch('PUT', url, body); },
    del: function(url) { return _fetch('DELETE', url); },
    setToken: function(t) { token = t; }
  };
})();
