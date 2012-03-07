hudson.options = function(conf) {
    var hudsonUrlTextbox, pollIntervallTextbox, saveButton, saveStatus, iconSize;

    function showSaveStatus(show) {
        saveStatus.style.display = show ? '' : "none";
        saveButton.disabled = show;
    }

    function display() {
        hudsonUrlTextbox.value = conf.hudsonURL();
        pollIntervallTextbox.value = conf.pollIntervall();
		document.getElementById(conf.iconSize()).checked = true;
		document.getElementById(conf.successColor()).checked = true;
        saveButton.disabled = true;
		var checks = document.getElementById('checks');
		checks.innerHTML = "";
		var checkedArray = conf.ignoreList().split(",");
		checks.appendChild(getListOfJobs(checkedArray));
    }

    function link(url, name) {
        if (name == undefined) {
            name = url;
        }
        var link = document.createElement('a');
        link.innerText = name;
        link.href = url;
        link.addEventListener("click", showUrl);
        return link;
    }

    function createList(jobs, checkedArray) {
        var list = document.createElement('table');
        jobs.forEach(function(r) {
            var tr = document.createElement('tr'), 
                tdIcon = document.createElement('td'),
                tdName = document.createElement('td');
            tr.className = "feedList";
			var cb = document.createElement('input');
			cb.type = "checkbox";
			cb.name="ignoreList";
			cb.id=r.name.replace(" ", "_");
			cb.checked = checkedArray.indexOf(cb.id) < 0;
			cb.onclick = function() { showSaveStatus(false); };
			tdIcon.appendChild(cb);
			tdName.innerText = r.name;
            tr.appendChild(tdIcon);
            tr.appendChild(tdName);
            list.appendChild(tr);
        });
        return list;
    }
	
	function getListOfJobs(checkedArray) {
		var backgroundPage = chrome.extension.getBackgroundPage().hudson;
		return createList(backgroundPage.results.hudson.jobs, checkedArray);
	}
	
	function getIgnoreList(urlChange) {
		var result = "";
		if (urlChange) {
			return result;
		}
		var checkboxes = document.getElementsByName("ignoreList");
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked == false) {
				result = result + checkboxes[i].id + ",";
			}
		}
		return result;
	}
	
	function getIconSize() {
		if (document.optionForm.small.checked) {
			return document.optionForm.small.value;
		} if (document.optionForm.medium.checked) {
			return document.optionForm.medium.value;
		} if (document.optionForm.large.checked) {
			return document.optionForm.large.value;
		}
	}
	
	function getSuccessColor() {
		if (document.optionForm.blue.checked) {
			return document.optionForm.blue.value;
		} if (document.optionForm.green.checked) {
			return document.optionForm.green.value;
		}
	}

    return { 
        save : function () {
			var urlChange = hudsonUrlTextbox.value != conf.hudsonURL();
            conf.set({ 
                hudsonURL : hudsonUrlTextbox.value,
                pollIntervall: pollIntervallTextbox.value,
				iconSize: getIconSize(),
				successColor: getSuccessColor(),
				ignoreList: getIgnoreList(urlChange)
            });
            showSaveStatus(true);
            chrome.extension.getBackgroundPage().hudson.init.init();
            display();
        },

        markDirty : function () {
            showSaveStatus(false);
        },


        init : function () {
            hudsonUrlTextbox = document.getElementById("hudson-url");
            pollIntervallTextbox = document.getElementById("poll-intervall");
            saveButton = document.getElementById("save-button");
            saveStatus = document.getElementById("save-status");
            display();
        }
    };
}(hudson.conf);

