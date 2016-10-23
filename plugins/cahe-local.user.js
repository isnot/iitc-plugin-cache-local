// ==UserScript==
// @id             iitc-plugin-cache-local@isnot
// @name           IITC plugin: Cache local
// @category       Misc
// @version        0.7.20160903
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @author         isnot
// @updateURL      none
// @downloadURL    none
// @description    [iitc-plugins] Cache to localStrage
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
  // ensure plugin framework is there, even if iitc is not yet loaded
  if (typeof window.plugin !== 'function') window.plugin = function() {};

  // PLUGIN START ////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.cacheLocal = function() {};
  window.plugin.cacheLocal.cache_local_is_loaded = false;

  window.plugin.cacheLocal.inject_to_cache = function inject_to_cache () {

    // if the Cache plugin is not available, quit now
    if (!window.plugin.cachePortalDetailsOnMap) {
      return console.warn('[Cache local] This plugin is dependent on the Cache plugin.');
    }

    var cache = window.plugin.cachePortalDetailsOnMap;
    cache.KEY_LOCALSTRAGE = 'plugin-cache-local-v1';

    cache.getPortalByGuid = function (guid) {
      var portal_cache = cache.cache[guid];
      if (!portal_cache || !typeof portal_cache.ent) return;

      var ent = portal_cache.ent;
      // what is this?
      if (Array.isArray(ent) && (ent.length === 3)) {
        ent = ent[2];
      }

      // ent should be Array and have 18 elements.
      if (Array.isArray(ent)) {
        return window.decodeArray.portalSummary(ent);
      }
    };

    cache.storeToLocal = function () {
      var lc = cache.cache;
      if (Object.keys(lc).length) {
        $.each(lc, function(guid, data) {
          // if (data.ent) console.log(data.ent);// for DEBUG
          var d = {};
          // I dont know what I do...
          if (data.ent && Array.isArray(data.ent) && (data.ent.length === 3)) {
            d.loadtime = data.ent[1];
            d.ent = data.ent[2];
          } else {
            d.loadtime = data.loadtime;
            d.ent = data.ent;
          }
          lc[guid] = d;
        });
        localStorage.setItem(cache.KEY_LOCALSTRAGE, JSON.stringify(lc));
      }

      console.log('plugin-cache-local: storeToLocal ' + Object.keys(lc).length);
    };

    cache.loadFromLocal = function () {
      // if an existing portal cache, load it
      var raw = window.localStorage[cache.KEY_LOCALSTRAGE];
      if (raw) {
        cache.merge(JSON.parse(raw));
        console.log('plugin-cache-local: loadFromLocal ' + Object.keys(cache.cache).length);
      } else {
        // make a new cache
        window.localStorage[cache.KEY_LOCALSTRAGE] = '{}';
        console.log('plugin-cache-local: init');
      }
    };

    cache.merge = function (inbound) {
      $.each(inbound, function (guid, data) {
        console.log('plugin-cache-loacl: merge ' + data.ent.toString());// for DEBUG
        if (data.ent && !cache.cache[guid]) {
          cache.cache[guid] = data;
        }
      });
    };

    cache.loadFromLocal();
    addHook('mapDataRefreshEnd', window.plugin.cachePortalDetailsOnMap.storeToLocal);
    window.plugin.cacheLocal.cache_local_is_loaded = true;
  };

  var setup = function() {
    addHook('iitcLoaded', window.plugin.cacheLocal.inject_to_cache);
  };

  // PLUGIN END //////////////////////////////////////////////////////////

  setup.info = plugin_info; //add the script info data to the function as a property
  if(!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  // if IITC has already booted, immediately run the 'setup' function
  if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
