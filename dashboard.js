function makeRequest (opts) {
	return new Promise(function (resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(opts.method, opts.url);
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response || null);
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
    let match = document.cookie.match(RegExp('(?:^|;\\s*)' + (name).replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1') + '=([^;]*)'));
    return match ? match[1] : null;
}
// not from StackOverflow :poggers:
function setCookie(name, value, expiry) {
	return document.cookie = `${name}=${value}; domain=.benderbot.co; path=/; expires=${new Date(Date.now() + (expiry || 1000*60*60*24*365))}`;
}

paypal.use( ['login'], function (login) {
    login.render ({
		appid:       "ASalasGVCX8iXiOGrGrm9PqGuTW-4fbaPikTmZN4mWzLvhFwsA2N5rFok2FcwVLbT0GHGZQAIWeWwg-k",
		scopes:      "openid profile email https://uri.paypal.com/services/paypalattributes",
		containerid: "paypalLogin",
		locale:      "en-us",
		buttonType:  "CWP",
		buttonSize:  "sm",
		returnurl:   "https://api.benderbot.co/paypal_login"
    });
});

const gpTemplate = {}, pTemplate = {};
for (const group in window.commandList) {
	gpTemplate[group] = {};
	for (const command in window.commandList[group]) {
		pTemplate[command] = {};
	}
}

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
	    	"agreement": {}, "aliases": {}, "automod": {"ignore": {}}, "commandStatus": {}, "config": {}, "cperms": {}, "filter": {}, "gamenews": {}, "giveaways": {}, "gperms": gpTemplate, "groupStatus": {}, "ignore": {'invites': {}, 'selfbots': {}, 'spam': {}, 'filter': {}, 'mentions': {}, 'names': {}}, "joinables": {}, "logging": {}, "memberLog": {}, "modlog": {}, "music": {}, "mutes": {}, "namefilter": {}, "nicknames": {}, "perms": pTemplate, "tags": {}, "temproles": {}
	    },
		gRoles: [],
		getRole: function (id) {
			let role = this.gRoles.filter(r => r.id === id)[0];
			return role || { name: `<deleted role | ID: ${id}>` };
		},
		gChannels: [],
		getChannel: function (id) {
			let chan = this.gChannels.filter(c => c.id === id)[0];
			return chan || { name: `<deleted channel | ID: ${id}>` };
		},
		tzRegions: window.tzRegions,
		tzs: window.tzs,
		navSections: window.navSections,
		ignorePermsTypes: window.permTypes,
		discordPermissionNames: window.discordPermissionNames,
		commandList: window.commandList || {},
		aliasMap: window.aliasMap || {},
		groupNames: window.groupNames || {},
		defaultPerms: window.defaultPerms || {},
		moment: window.moment,
		paypalInfo: null,
		loading: false,
		temp: {},
		searchValue: null,
		previewEnabled: false,
		ignoreAbbrs: {
			iil: 'invites',
			fil: 'filter',
			nfil: 'names',
			sbil: 'selfbots'
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
			window.autoExpandAll();
			this.searchValue = null;
			this.previewEnabled = false;
		},
		openDropdown: calcDropdowns,
		previewEnabled: window.highlightAll
	},
	methods: {
		reloadGSettings: window.loadGuildSettings,
		saveGSettings: window.saveGuildSettings,
		add: function(type, cg, com) {
			this.openDropdown = null;
			switch (type) {
				case 'tag':
				case 'alias':
					if (!this.temp[type+'_name'] || !this.temp[type+'_content']) {
						showNotif('error', `${type[0].toUpperCase()}${type.substr(1)} needs a name and content!`, 3000); return;
					}
					this.gSettings[type === 'tag' ? 'tags' : 'aliases'][this.temp[type+'_name']] = this.temp[type+'_content'];
					this.temp[type+'_name'] = null;
					this.temp[type+'_content'] = null;
					break;
				case 'filter':
				case 'namefilter':
					// TODO: check for errors in regex (invalid sequences)
					if (!this.temp[type]) {
						showNotif('error', `Invalid regex content in ${type}.`, 3000); return;
					}
					this.gSettings[type].patterns.push(this.temp[type]);
					this.temp[type] = null;
					break;
				case 'amil':
					if (!Array.isArray(this.gSettings.automod.ignore.data))
						this.gSettings.automod.ignore.data = [];
					this.gSettings.automod.ignore.data.push(this.temp.amil);
					this.temp.amil = null;
					break;
				case 'iil':
				case 'fil':
				case 'nfil':
				case 'sbil':
					const x = this.ignoreAbbrs[type];
					this.gSettings.ignore[x] = {
						data: Array.isArray(this.gSettings.ignore[x].data) ? this.gSettings.ignore[x].data : [],
						type: 'role_list'
					}
					this.gSettings.ignore[x].data.push(this.temp[type]);
					this.temp[type] = null;
					break;
				case 'perms':
					if (typeof this.gSettings[com ? 'perms' : 'gperms'][cg] !== 'object')
						this.gSettings[com ? 'perms' : 'gperms'][cg] = {};
					if (!Array.isArray(this.gSettings[com ? 'perms' : 'gperms'][cg].data))
						this.gSettings[com ? 'perms' : 'gperms'][cg].data = [];
					this.gSettings[com ? 'perms' : 'gperms'][cg].data.push(this.temp['pl-'+cg]);
					this.temp['pl-'+cg] = null;
					break;
				case 'cperms':
					if (typeof this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan] !== 'object')
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan] = {};
					if (typeof this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg] !== 'object')
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg] = {};
					if (!Array.isArray(this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data))
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data = [];
					this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data.push(this.temp['cp-'+cg]);
					this.temp['cp-'+cg] = null;
					break;

			}
			//this.$forceUpdate();
		},
		del: function(type, index, cg, com) {
			console.log(`deleting ${index} of type ${type}`);
			switch (type) {
				case 'tag':
				case 'alias':
					this.$delete(this.gSettings[type === 'tag' ? 'tags' : 'aliases'], index);
					break;
				case 'filter':
				case 'namefilter':
					this.gSettings[type].patterns.splice(index, 1);
					break;
				case 'amil':
					this.gSettings.automod.ignore.data.splice(index, 1);
					break;
				case 'iil':
				case 'fil':
				case 'nfil':
				case 'sbil':
					this.gSettings.ignore[this.ignoreAbbrs[type]].data.splice(index, 1);
					break;
				case 'perms':
					this.gSettings[com ? 'perms' : 'gperms'][cg].data.splice(index, 1);
					break;
				case 'cperms':
					this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data.splice(index, 1);
					break;
			}
			//this.$forceUpdate();
			//setTimeout( this.$forceUpdate, 69);
			//setTimeout( this.$forceUpdate, 690);
		},
		parseMD: function(str) {
			// parse markdown (i.e. underlining) and syntax highlighting
			let mdParse = SimpleMarkdown.defaultBlockParse;
		    let htmlOutput = SimpleMarkdown.reactFor(SimpleMarkdown.ruleOutput(SimpleMarkdown.defaultRules, 'html'));
			str = htmlOutput(mdParse(str))[0];
			str = str.replace(/markdown-code-/g, 'hljs '); // fix code highlighting bullshit
			str = str.replace(/<a href="/g, '<a target="_blank" href="'); // make links open in new tab

			// parse emojis
			str = str.replace(/&lt;(a?):([a-zA-Z_0-9]{2,32}):(\d{17,20})&gt;/g, (match, p1, p2, p3) => {
				return `<img title=":${p2}:" alt=":${p2}:" src="https://cdn.discordapp.com/emojis/${p3}.${p1 ? 'gif' : 'png'}?v=1" style="height:24px!important;vertical-align:middle;">`
			});
			// parse channel mentions
			let gc = this.gChannels, g = this.selectedGuildID;
			str = str.replace(/&lt;#(\d{17,20})&gt;/g, (match, p1) => {
				for (let i in gc) {
					if (gc[i].id === p1) {
						return `<a target="_blank" href="https://discordapp.com/channels/${g}/${p1}" class="mention">#${gc[i].name}</a>`;
					}
				}
				return '<span class="mention">#deleted-channel</span>';
			});
			// parse role mentions
			let gr = this.gRoles;
			str = str.replace(/&lt;@&amp;(\d{17,20})&gt;/g, (match, p1) => {
				for (let i in gr) {
					if (gr[i].id === p1) {
						return `<span class="mention" style="${gr[i].cssColor}">@${gr[i].name}</span>`;
					}
				}
				return '<span class="mention">@deleted-role</span>';
			});
			// resolve user mentions
			let m = this.gMembers;
			str = str.replace(/(?:<|&lt;)@(\d{17,20})(?:>|&gt;)/g, (match, p1) => {
				for (let i in m) {
					if (m[i].user.id === p1) {
						return `<span class="mention">@${m[i].user.username}</span>`;
					}
				}
				return `<span class="mention">${match}</span>`;
			});

			str = str.replace(/\n/g, '<br>');

			return str;
		},
		hlRegex: RegexColorizer.colorizeText, // highlight regex
		getLen(obj, ignore = []) {
			let count = 0;
			for (let key in obj) {
				if (ignore.indexOf(key) === -1)
					count++;
			}
			return count;
		},
		escapeHTML(text) {
			return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
		},
		resolveUser(userID) {
			if (userID === this.user.id) {
				return (this.user.pfp ? `<img class="pfp mid" src="${this.user.pfp}">` : '') +
				`<span class="mid">${this.escapeHTML(this.user.username)}<span class="gray">#${this.user.discriminator}</span></span>`;
			}
			let m = this.gMembers;
			for (let i in m) {
				if (m[i].user.id === userID) {
					return (m[i].user.avatar ? `<img class="pfp mid" src="https://cdn.discordapp.com/avatars/${m[i].user.id}/${m[i].user.avatar}.${m[i].user.avatar.startsWith('a_') ? 'gif' : 'png'}">` : '') +
					`<span class="mid">${this.escapeHTML(m[i].user.username)}<span class="gray">#${m[i].user.discriminator}</span></span>`;
				}
			}
			return userID;
		}
	},
	computed: {
		maxPremiumGuilds: function() {
			if (!this.paypalInfo || !this.paypalInfo.plan || typeof this.paypalInfo.plan.description !== 'string') return 0;
			let num = parseInt(this.paypalInfo.plan.description.substr(0, 1));
			return isNaN(num) ? 0 : (num > 5 ? 5 : num);
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
	} else if (getCookie('refresh_token')) {
		page.loading = true;
	    let data = await makeRequest({method: 'POST', url: 'https://api.benderbot.co/refresh', auth: getCookie('refresh_token')}).catch(console.error);
		page.loading = false;
		if (typeof data === 'string') {
			try {
				data = JSON.parse(data);
			} catch(err) {
				console.error(err);
				showNotif('error', 'Failed to refresh token. Please log out and back in.', 6000);
				return;
			}
		}
        if (data) {
			setCookie('token', data.access_token, (parseInt(data.expires_in) * 1000));
			setCookie('refresh_token', data.refresh_token);
	        return loadUserInfo();
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
		try {
			gData = JSON.parse(gData);
		} catch(err) {}
		//console.log(gSet);
		page.loading = false;
	    if (gData) {
	        showNotif('success', 'Loaded guild settings!', 4000);
			gData.settings.guildID = gID;
			for (let group in commandList) {
				if (gData.settings.groupStatus[group] === undefined)
					gData.settings.groupStatus[group] = true;
				for (let command in commandList[group]) {
					if (gData.settings.commandStatus[command] === undefined)
						gData.settings.commandStatus[command] = true;
				}
			}
	        page.gSettings = gData.settings;
			page.gNames = gData.usernames;
			//page.unsaved = false;
			page.gRoles = gData.roles;
			page.gChannels = gData.channels;
			page.gMembers = gData.members || [];
			page.memberRank = gData.highestRolePosition;
	    } else {
	        showNotif('error', 'Failed to load guild settings.', 6000);
	    }
	} else {
	    showNotif('pending', 'You are not logged in. Cannot fetch settings.', 4000);
	}
	// trigger auto-expand of textareas
	setTimeout(autoExpandAll, 5);
	// apply syntax highlighting to codeblocks
	setTimeout(highlightAll, 5);
}

async function saveGuildSettings(gID) {
	if (!gID) return;
	/*if (!page.unsaved) {
		showNotif('success', 'No changes needed.', 2000); return;
	}*/
	if (!page.user || !getCookie('token'))
		return showNotif('error', 'You are not logged in. Cannot save settings.', 4000);

	if (gID === 'PAYPAL') {
		if (!page.paypalInfo || (!getCookie('paypal_token') && !getCookie('token')))
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
			showNotif('error', 'Failed to save Bender Pro settings.\n'+err, 6000);
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
		showNotif('error', 'Failed to save guild settings.\n'+err, 6000);
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
    } else if (getCookie('pp_refresh_token')) {
		page.loading = true;
        let data = await makeRequest({method: 'POST', url: 'https://api.benderbot.co/refresh_paypal', auth: getCookie('pp_refresh_token')}).catch(console.error);
		if (typeof data === 'string') {
			try {
				data = JSON.parse(data);
			} catch(err) {
				console.error(err);
				return;
			}
		}
        if (data) {
			setCookie('paypal_token', data.access_token, (parseInt(data.expires_in) * 1000));
			setCookie('pp_refresh_token', data.refresh_token);
			return updatePaypalInfo();
        }
	} else if (getCookie('token')) {
		page.loading = true;
		if (!firstPP)
			showNotif('pending', 'Attempting to fetch PayPal info via Discord info (for gifted subs)...');
        let data = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('token')}).catch(console.error);
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
