var hudson = hudson || {};
hudson.results = { lastUpdate : 'never' };
hudson.refreshTimerId = undefined;

hudson.open = function() {
    function sameUrl(orig, other) {
        if (other.indexOf(orig) !== 0)
            return false;
        return other.length == orig.length ||
            other[orig.length] == '?' ||
            other[orig.length] == '#';
    }

    return function (url) {
        chrome.tabs.getAllInWindow(undefined, function(tabs) {
            for (var i = 0, tab; tab = tabs[i]; i++) {
                if (tab.url && sameUrl(url, tab.url)) {
                    chrome.tabs.update(tab.id, { selected : true });
                    return;
                }
            }
            chrome.tabs.create({ url: url });
        });
    };
}();

hudson.init = function (conf, results) {
    var xhr = undefined,
        timeoutId = undefined,
		ignoreList = conf.ignoreList().split(","),
        successColors = /(blue|grey|disabled)/,
        build = {
            ok :   {    msg : "OK",     color : [0, 128, 0, 255] },
            failed : {  msg : "Fail",   color : [255, 0, 0, 255] },
            unknown: {  msg : "?",      color : [128, 128, 128, 255] }
        };

    function setState(state, msg) {
        console.log(state, msg, new Date());
        chrome.browserAction.setBadgeText({ text:  state.msg });
        chrome.browserAction.setBadgeBackgroundColor({ color:  state.color });
        chrome.browserAction.setTitle({ title : msg +"\nRight click for options" });
    }

    function onerror(msg) {
        console.log(msg);
        results.error = msg;
        setState(build.unknown, msg);
    }
	
	var isJobSuccess = function(job) {
		if (ignoreList.indexOf(job.name) >= 0) {
			return true;
		}
		return successColors.test(job.color);
	};

    function areAllJobsSuccessful(jobs) {
        return jobs.every(isJobSuccess);
    }

    function timeout () {
        console.log("timeout");
        if (xhr) {
            xhr.abort();
        }
        newRequest();
    }

    function newRequest() {
        hudson.refreshTimerId = window.setTimeout(start, 60 * 1000 * conf.pollIntervall());
    }
	
	this.resetTimer = function() {
	};
	
	function clearTimer() {
	}

    function start() {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onchange;
        xhr.open("GET", conf.apiURL(), true);
        try {
            xhr.send("");
            timeoutId = window.setTimeout(timeout, 10 * 1000);
        } catch (err) {
            console.log(err);
        }
    }

    function onchange () {
        if (xhr.readyState != 4) return;
        results.lastUpdate = new Date();
        console.log("onchange", xhr);
        window.clearTimeout(timeoutId);
        if (xhr.status != 200) {
            onerror("Failed to load data: " + xhr.statusText +  " (" + xhr.status + ")");
        } else {
            display(xhr.responseText);
        }
        newRequest();
    }

    function display(text) {
        try {
            results.hudson = JSON.parse(text);
        } catch (e) {
            onerror("Failed to parse JSON data from " + conf.hudsonUrl() + ": " + e);
            return;
        }
        results.error = undefined;
        if (areAllJobsSuccessful(results.hudson.jobs)) {
            setState(build.ok, "Build OK");
        } else {
            setState(build.failed, "Build Failed!");
        }
    }
	
	return {
		init : function () {
			results = { lastUpdate : 'never' };
			setState(build.unknown, "Build status unknown");
			start();
		},
		
		reset : function () {
			window.clearTimeout(hudson.refreshTimer);
			start();
		}
	};

}(hudson.conf, hudson.results);
