(function () {
  'use strict';

  // Read API endpoint from script tag's data-api attribute
  var scriptTag = document.currentScript;
  var API_URL = scriptTag && scriptTag.getAttribute('data-api');
  if (!API_URL) {
    console.warn('[VDT] data-api attribute missing on script tag');
    return;
  }

  // ---- Viewer ID (cookie-based UUID) ----
  function getViewerId() {
    var match = document.cookie.match(/(?:^|; )vdt_viewer_id=([^;]*)/);
    if (match) return match[1];

    var id;
    try {
      id = crypto.randomUUID();
    } catch (e) {
      // fallback for older browsers
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    }

    // Try cookie first (30-day expiry)
    try {
      var expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = 'vdt_viewer_id=' + id + '; expires=' + expires + '; path=/; SameSite=Lax';
      // Verify cookie was set
      if (!document.cookie.match(/vdt_viewer_id/)) throw new Error('cookie blocked');
    } catch (e) {
      // sessionStorage fallback
      try {
        var stored = sessionStorage.getItem('vdt_viewer_id');
        if (stored) return stored;
        sessionStorage.setItem('vdt_viewer_id', id);
      } catch (e2) {
        // No storage available — new UUID each time (accepted)
      }
    }

    return id;
  }

  // ---- State ----
  var trackedPlayers = {}; // keyed by iframe id
  var sent = false;

  // ---- Find YouTube iframes ----
  function findIframes() {
    var iframes = document.querySelectorAll('iframe[src*="youtube.com/embed"]');
    var result = [];
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      // Assign id if missing
      if (!iframe.id) {
        iframe.id = 'vdt-player-' + i;
      }
      // Inject enablejsapi=1 if missing
      var src = iframe.src;
      if (src.indexOf('enablejsapi=1') === -1) {
        var separator = src.indexOf('?') === -1 ? '?' : '&';
        iframe.src = src + separator + 'enablejsapi=1';
      }
      result.push(iframe.id);
    }
    return result;
  }

  // ---- Load YouTube IFrame API ----
  function loadYTApi(callback) {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) prev();
      callback();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  }

  // ---- Extract video ID from iframe src ----
  function extractVideoId(src) {
    var match = src.match(/youtube\.com\/embed\/([^?&#]+)/);
    return match ? match[1] : 'unknown';
  }

  // ---- getDuration with retry ----
  function getDurationWithRetry(player, state, attempt) {
    attempt = attempt || 0;
    var dur = player.getDuration ? player.getDuration() : 0;
    if (dur > 0) {
      state.duration = Math.floor(dur);
    } else if (attempt < 5) {
      setTimeout(function () {
        getDurationWithRetry(player, state, attempt + 1);
      }, 500);
    }
    // After 5 attempts, duration stays null
  }

  // ---- Initialize players ----
  function initPlayers(iframeIds) {
    iframeIds.forEach(function (id) {
      var iframe = document.getElementById(id);
      if (!iframe) return;

      var videoId = extractVideoId(iframe.src);

      var state = {
        videoId: videoId,
        duration: null,
        totalWatchTime: 0,
        maxSecondReached: 0,
        currentTime: 0,
        isPlaying: false,
        pollInterval: null,
      };
      trackedPlayers[id] = state;

      var player = new YT.Player(id, {
        events: {
          onReady: function () {
            // Delay getDuration to avoid 0 return
            setTimeout(function () {
              getDurationWithRetry(player, state);
            }, 500);
          },
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              state.isPlaying = true;
              if (!state.pollInterval) {
                state.pollInterval = setInterval(function () {
                  if (!state.isPlaying) return;
                  try {
                    var ct = player.getCurrentTime();
                    if (typeof ct === 'number') {
                      state.currentTime = ct;
                      var sec = Math.floor(ct);
                      if (sec > state.maxSecondReached) {
                        state.maxSecondReached = sec;
                      }
                      state.totalWatchTime++;
                    }
                  } catch (e) {
                    // Player might be destroyed
                  }
                }, 1000);
              }
            } else {
              state.isPlaying = false;
            }
          },
        },
      });
    });
  }

  // ---- Send tracking data ----
  function sendTrackingData() {
    if (sent) return;
    sent = true;

    var viewerId = getViewerId();
    var pageUrl = window.location.href;

    var keys = Object.keys(trackedPlayers);
    for (var i = 0; i < keys.length; i++) {
      var state = trackedPlayers[keys[i]];

      // Skip if never played
      if (state.totalWatchTime === 0 && state.currentTime === 0) continue;

      // Stop polling
      if (state.pollInterval) {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
      }

      var payload = JSON.stringify({
        viewer_id: viewerId,
        video_id: state.videoId,
        page_url: pageUrl,
        duration_seconds: state.duration,
        total_watch_time: state.totalWatchTime,
        max_second_reached: state.maxSecondReached,
        drop_off_second: Math.floor(state.currentTime),
      });

      // sendBeacon with plain string (text/plain, no CORS preflight)
      var beaconSent = false;
      try {
        if (navigator.sendBeacon) {
          beaconSent = navigator.sendBeacon(API_URL, payload);
        }
      } catch (e) {
        // sendBeacon not available or failed
      }

      // Fallback: fetch with keepalive
      if (!beaconSent) {
        try {
          fetch(API_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'text/plain' },
            keepalive: true,
          });
        } catch (e) {
          // Data loss accepted
        }
      }
    }
  }

  // ---- Exit detection ----
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      sendTrackingData();
    }
  });
  window.addEventListener('pagehide', sendTrackingData);

  // ---- Bootstrap ----
  function init() {
    var iframeIds = findIframes();
    if (iframeIds.length === 0) return;
    loadYTApi(function () {
      initPlayers(iframeIds);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
