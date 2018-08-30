function makeRequest (opts) {
	return new Promise(function (resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(opts.method, opts.url);
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: this.statusText,
					responseText: this.responseText
				});
			}
		};
		xhr.onerror = function () {
			reject({
				status: this.status,
				statusText: this.statusText,
				responseText: this.responseText
			});
		};
		if (opts.method == 'POST') {
			xhr.setRequestHeader("Content-Type", "application/json");
		}
        if (opts.auth) {
			xhr.setRequestHeader("Authorization", opts.auth);
		}
		if (opts.auth2) {
			xhr.setRequestHeader("X-Discord-Authorization", opts.auth2);
		}
		xhr.send(opts.body ? JSON.stringify(opts.body) : undefined);
	});
}
function showNotif (type, text, time) {
    let status = document.getElementById('notif');
    if (!status) return false;
    status.className = type;
    status.innerHTML = text;

    if (time) {
        setTimeout(() => {
        	status.className = '';
        	status.innerHTML = '';
        }, time);
    }
}

// lazily copied from StackOverflow tbh
function getCookie(name) {
    function escape(s) { return s.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1'); };
    var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
    return match ? match[1] : null;
}

paypal.use( ['login'], function (login) {
  login.render ({
	"appid":"AWH-Iqw8uRLsMZH4j_XI59OrCy2As3ueNRTD-ReaeCKc7ZSJGU9MMQkxHKYvjSMSTMKi2mE4fjHBG9m8",
	"scopes":"openid profile email",
	"containerid":"paypalLogin",
	"locale":"en-us",
	"returnurl":"https://api.benderbot.co/paypal_login"
  });
});

window.nav = [
	[{
		name: 'Bender Pro',
		id: 'pro',
		ro: true
	}, {
		name: 'General Settings',
		id: 'general'
	}, {
		name: 'Aliases',
		id: 'aliases'
	}, {
		name: 'Welcome Messages',
		id: 'welcome'
	}, {
		name: 'Giveaways',
		id: 'giveaways',
		cs: true,
		ro: true
	}, {
		name: 'Tags',
		id: 'tags'
	}, {
		name: 'Agreement',
		id: 'agreement'
	}], [{
		name: 'Automod',
		id: 'automod',
		cs: true
	}], [{
		name: 'Filter',
		id: 'filter',
		cs: true
	}, {
		name: 'Name Filter',
		id: 'namefilter',
		cs: true
	}], [{
		name: 'Logging Settings',
		id: 'logging'
	}, {
		name: 'Mod Log (cases)',
		id: 'modlog',
		ro: true
	}, {
		name: 'Mutes',
		id: 'mutes',
		ro: true
	}, {
		name: 'Name History',
		id: 'names',
		cs: true,
		ro: true
	}], [{
		name: 'Permissions',
		id: 'perms',
		cs: true
	}], [{
		name: 'Channel Permissions',
		id: 'cperms',
		cs: true
	}], [{
		name: 'Selfroles',
		id: 'selfroles'
	}, {
		name: 'Disabled Commands & Groups ',
		id: 'cmdstatus',
		cs: true
	}]
];

var page = new Vue({
	el: '#app',
	data: {
		column: null,
		selectedGuildID: null,
		//prevGuildID: null,
		openDropdown: null,
		sidenavOpen: false,
		guilds: [],
		getGuild: function (id) {
			let guild = this.guilds.filter(g => g.id === id)[0];
			return guild || {};
		},
		user: null,
		gSettings: {
	    	"agreement": {}, "aliases": {}, "automod": {}, "commandStatus": {}, "config": {}, "cperms": {}, "filter": {}, "gameNews": {}, "giveaways": {}, "gperms": {}, "groupStatus": {}, "ignore": {}, "joinables": {}, "logging": {}, "memberLog": {}, "modlog": {}, "music": {}, "mutes": {}, "namefilter": {}, "nicknames": {}, "perms": {}, "tags": {}, "temproles": {}
	    },
		gRoles: [],
		getRole: function (id) {
			let role = this.gRoles.filter(r => r.id === id)[0];
			return role || {};
		},
		gChannels: [],
		getChannel: function (id) {
			let chan = this.gChannels.filter(c => c.id === id)[0];
			return chan || {};
		},
		tzRegions: window.tzRegions,
		tzs: window.tzs,
		navSections: window.nav,
		paypalInfo: null,
		loading: false,
		tagTemp: {
			name: '',
			content: ''
		}
	},
	watch: {
		selectedGuildID: function (newID, oldID) {
			/*console.log(oldID, newID);
			this.prevGuildID = oldID;*/
			this.openDropdown = null;
			if (!this.column) this.column = 'general';
			loadGuildSettings(newID);
		},
		column: function () {
			this.sidenavOpen = false;
		},
		openDropdown: calcDropdowns
	},
	methods: {
		reloadGSettings: window.loadGuildSettings,
		saveGSettings: window.saveGuildSettings,
		addTag: function() {
			if (!this.tagTemp.name || !this.tagTemp.content) {
				showNotif('error', 'Needs a name and content!', 3000); return;
			}
			this.gSettings.tags[this.tagTemp.name] = this.tagTemp.content;
			this.tagTemp = {
				name: '',
				content: ''
			};
			this.dummyProp = 1;
		},
		deleteTag: function(name) {
			delete this.gSettings.tags[name];
			page.$forceUpdate();
		}
	}
});

if (window.location.hash) {
	page.column = window.location.hash.substr(1);
}
//let _blockNext = false;

async function loadUserInfo() {
	if (getCookie('token')) {
		page.loading = true;
	    showNotif('pending', 'Fetching user info...');
	    let userinfo = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/userinfo', auth: getCookie('token')}).catch(console.error);
		if (userinfo)
			userinfo = JSON.parse(userinfo);
		//console.log(userinfo);
		page.loading = false;
	    if (userinfo && userinfo.guilds && userinfo.user) {
	        showNotif('success', 'Loaded user info + guilds!', 4000);
	        page.guilds = userinfo.guilds;
	        page.user = userinfo.user;
	    } else {
	        showNotif('error', 'Failed to load user info + guilds.', 6000);
	    }
	} else {
	    showNotif('pending', 'Log in already u heckin nerd', 4000);
	}
}

async function loadGuildSettings(gID) {
	if (!gID) return;
	/*if (_blockNext) {
		_blockNext = false;
		return;
	}
	if (page.unsaved) {
		if (window.confirm('Are you sure you want to discard your changes?') === false) {
			page.selectedGuildID = page.prevGuildID;
			_blockNext = true;
			return;
		}
	}*/
	if (gID === 'PAYPAL') {
		return updatePaypalInfo();
	}
	if (getCookie('token')) {
		page.loading = true;
	    showNotif('pending', 'Fetching guild settings...');
	    let gData = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/guild/' + gID, auth: getCookie('token')}).catch(console.error);
		gData = JSON.parse(gData);
		//console.log(gSet);
		page.loading = false;
	    if (gData) {
	        showNotif('success', 'Loaded guild settings!', 4000);
			gData.settings.guildID = gID;
	        page.gSettings = gData.settings;
			//page.unsaved = false;
			page.gRoles = gData.roles;
			page.gChannels = gData.channels;
	    } else {
	        showNotif('error', 'Failed to load guild settings.', 6000);
	    }
	} else {
	    showNotif('pending', 'You are not logged in. Cannot fetch settings.', 4000);
	}
	// trigger auto-expand of textareas
	setTimeout(() => {
		let ta = document.querySelectorAll('textarea');
		ta.forEach(el => {
		    if (!el.value) return;
		    setTimeout(() => autoExpand(el), 5);
			setTimeout(() => autoExpand(el), 50);
			setTimeout(() => autoExpand(el), 500);
		});
	}, 5);
}

async function saveGuildSettings(gID) {
	if (!gID) return;
	/*if (!page.unsaved) {
		showNotif('success', 'No changes needed.', 2000); return;
	}*/
	if (!page.user || !getCookie('token'))
		return showNotif('error', 'You are not logged in. Cannot save settings.', 4000);

	if (gID === 'PAYPAL') {
		if (!page.paypalInfo || !getCookie('paypal_token'))
			return showNotif('error', 'You are not logged in to PayPal. Cannot save Bender Pro settings.', 4000);
		let temp = {
			guilds: page.paypalInfo.guilds,
			discordID: page.user.id
		};
		console.log(temp);
		showNotif('pending', 'Saving Bender Pro settings...');
	    let err, gData = await makeRequest({method: 'POST', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('paypal_token'), auth2: getCookie('token'), body: temp}).catch(er => {
			err = er;
			console.error(er);
		});
		page.loading = false;
	    if (err) {
			showNotif('error', 'Failed to save Bender Pro settings.', 6000);
		} else {
	        showNotif('success', 'Saved Bender Pro settings!', 4000);
			//page.unsaved = false;
	    }
		return;
	}

	// TODO: actually do this shit
	alert('Saving settings is not done yet! Come back soon™'); return;

	let temp = Object.assign({}, page.gSettings);
	delete temp.guildID;
	page.loading = true;
    showNotif('pending', 'Saving guild settings...');
    let err, gData = await makeRequest({method: 'POST', url: 'https://api.benderbot.co/guild/' + gID, auth: getCookie('token'), body: temp}).catch(er => {
		err = er;
		console.error(er);
	});

	page.loading = false;
    if (err) {
		showNotif('error', 'Failed to save guild settings.', 6000);
	} else {
        showNotif('success', 'Saved guild settings!', 4000);
		//page.unsaved = false;
    }
}

let firstPP = true;
async function updatePaypalInfo() {
    if (getCookie('paypal_token')) {
		page.loading = true;
		if (!firstPP)
			showNotif('pending', 'Fetching PayPal info...');
        let data = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('paypal_token')}).catch(console.error);
		page.loading = false;
        if (data) {
			if (!firstPP)
				showNotif('success', 'Loaded PayPal info!', 4000);
            page.paypalInfo = JSON.parse(data);
			firstPP = false;
        } else {
			if (!firstPP)
				showNotif('error', 'Failed to load PayPal info.', 6000);
        }
    } else {
		if (!firstPP)
			showNotif('pending', 'Log in to PayPal already u heckin nerd', 4000);
    }
}

loadUserInfo();
updatePaypalInfo();

// more shit from StackOverflow
function compareObj(obj1, obj2) {
	for (let p in obj1) {
		if (p === '__ob__') continue;
		//console.log(p);
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
		switch (typeof (obj1[p])) {
			case 'object':
				if (!compareObj(obj1[p], obj2[p])) return false;
				break;
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}
	for (let p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};

/*page.$watch('gSettings', function(newValue, oldValue) {
	page.unsaved = oldValue.guildID && oldValue.guildID === newValue.guildID && !compareObj(newValue, oldValue);
	console.log({oldValue, newValue});
	//console.log('oldValue.__ob__ === newValue.__ob__ ? '+(oldValue.__ob__ === newValue.__ob__));
	console.log('unsaved changes? '+page.unsaved);
}, {deep: true});
window.onbeforeunload = function() {
  return page.unsaved ? 'Are you sure you want to discard your changes?' : null;
};*/
