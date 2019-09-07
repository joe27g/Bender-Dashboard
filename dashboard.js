function makeRequest (opts) {
	return new Promise(function (resolve, reject) {
		const xhr = new XMLHttpRequest();
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
    const status = document.getElementById('notif');
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
    const match = document.cookie.match(RegExp('(?:^|;\\s*)' + (name).replace(/([.*+?^${}()|[\]/])/g, '\\$1') + '=([^;]*)'));
    return match ? match[1] : null;
}
// not from StackOverflow :poggers:
function setCookie(name, value, expiry) {
	return document.cookie = `${name}=${value}; domain=.benderbot.co; path=/; expires=${new Date(Date.now() + (expiry || 1000*60*60*24*365))}`;
}
// also modified from StackOverflow
/*function merge(obj, obj2) {
    for (const prop in obj2) {
        const val = obj2[prop];
        if (typeof val === "object" && !Array.isArray(val) && val !== null)
            merge(obj[prop], val);
        else
            obj[prop] = val;
    }
    return obj;
}*/

window.paypal.use( ['login'], function (login) {
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

const defaultGuildSettings = {
	"agreement": {}, "aliases": {}, "automod": {"ignore": {}}, "commandStatus": {}, "config": {}, "cperms": {}, "filter": {}, "gamenews": {}, "giveaways": {}, "gperms": gpTemplate, "groupStatus": {}, "ignore": {'invites': {}, 'selfbots': {}, 'spam': {}, 'filter': {}, 'mentions': {}, 'names': {}}, "joinables": {}, "logging": {}, "memberLog": {}, "modlog": {}, "music": {}, "mutes": {}, "namefilter": {}, "nicknames": {}, "perms": pTemplate, "starboard": {}, "tags": {}, "temproles": {}
};

// eslint-disable-next-line
var page = new Vue({
	el: '#app',
	data: {
		column: null,
		selectedGuildID: null,
		//prevGuildID: null,
		openDropdown: null,
		sidenavOpen: false,
		modalText: '',
		guilds: [],
		user: null,
		gSettings: defaultGuildSettings,
		guildPro: false,
		gRoles: [],
		gChannels: [],
		tzRegions: window.tzRegions,
		tzs: window.tzs,
		navSections: window.navSections,
		ignorePermsTypes: window.permTypes,
		discordPermissionNames: window.discordPermissionNames,
		commandList: window.commandList || {},
		aliasMap: window.aliasMap || {},
		groupNames: window.groupNames || {},
		defaultPerms: window.defaultPerms || {},
		shortcutMap: window.shortcutMap || {},
		moment: window.moment,
		paypalInfo: null,
		loading: false,
		temp: { multi_autorole: false },
		searchValue: null,
		previewEnabled: false,
		ignoreAbbrs: {
			iil: 'invites', iic: 'invitesChans',
			fil: 'filter', fic: 'filterChans',
			nfil: 'names',
			sbil: 'selfbots', sbic: 'selfbotsChans',
			mil: 'mentions', mic: 'mentionsChans',
			sil: 'spam', sic: 'spamChans'
		},
		botNotPresent: false
	},
	watch: {
		selectedGuildID: function (newID) { // , oldID
			/*console.log(oldID, newID);
			this.prevGuildID = oldID;*/
			this.botNotPresent = false;
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
		openDropdown: function() {
			setTimeout(window.calcDropdowns);
		},
		previewEnabled: window.highlightAll,
		'gSettings.perms': {
			deep: true,
			handler: function(value) {
				for (const c in value) {
					if (!value[c]) continue;
					if (value[c].type === 'role_list' && !Array.isArray(value[c].data)) {
						this.gSettings.perms[c].data = [];
					}
					else if (value[c].type !== 'role_list' && Array.isArray(value[c].data)) {
						this.gSettings.perms[c].data = null;
					}
				}
			}
		},
		'gSettings.gperms': {
			deep: true,
			handler: function(value) {
				for (const g in value) {
					if (!value[g]) continue;
					if (value[g].type === 'role_list' && !Array.isArray(value[g].data)) {
						this.gSettings.gperms[g].data = [];
					}
					else if (value[g].type !== 'role_list' && Array.isArray(value[g].data)) {
						this.gSettings.gperms[g].data = null;
					}
				}
			}
		},
		'gSettings.cperms': {
			deep: true,
			handler: function(value) {
				for (const i in value.perms) {
					for (const c in value.perms[i]) {
						if (!value.perms[i][c]) continue;
						if (value.perms[i][c].type === 'role_list' && !Array.isArray(value.perms[i][c].data)) {
							this.gSettings.cperms.perms[i][c].data = [];
						}
						else if (value.perms[i][c].type !== 'role_list' && Array.isArray(value.perms[i][c].data)) {
							this.gSettings.cperms.perms[i][c].data = null;
						}
					}
				}
				for (const i in value.gperms) {
					for (const g in value.gperms[i]) {
						if (!value.gperms[i][g]) continue;
						if (value.gperms[i][g].type === 'role_list' && !Array.isArray(value.gperms[i][g].data)) {
							this.gSettings.cperms.gperms[i][g].data = [];
						}
						else if (value.gperms[i][g].type !== 'role_list' && Array.isArray(value.gperms[i][g].data)) {
							this.gSettings.cperms.gperms[i][g].data = null;
						}
					}
				}
			}
		},
		'gSettings.automod.ignore': function(value) {
			if (value.type === 'role_list' && !Array.isArray(value.data)) {
				this.gSettings.automod.ignore.data = [];
			}
			else if (value.type !== 'role_list' && Array.isArray(value.data)) {
				this.gSettings.automod.ignore.data = null;
			}
		},
		'gSettings.ignore': {
			deep: true,
			handler: function(value) {
				for (const t in value) {
					if (value[t].type === 'role_list' && !Array.isArray(value[t].data)) {
						this.gSettings.ignore[t].data = [];
					}
					else if (value[t].type !== 'role_list' && Array.isArray(value[t].data)) {
						this.gSettings.ignore[t].data = null;
					}
				}
			}
		},
		'temp.multi_autorole': function(value) {
			if (value && !Array.isArray(this.gSettings.autorole)) {
				this.gSettings.autorole = [];
			}
			else if (!value && Array.isArray(this.gSettings.autorole)) {
				this.gSettings.autorole = null;
			}
		}
	},
	methods: {
		reloadGSettings: window.loadGuildSettings,
		saveGSettings: window.saveGuildSettings,
		getGuild: function (id) {
			const guild = this.guilds.filter(g => g.id === id)[0];
			return guild || {};
		},
		getRole: function (id) {
			const role = this.gRoles.filter(r => r.id === id)[0];
			return role || { name: `<deleted role | ID: ${id}>` };
		},
		getChannel: function (id) {
			const chan = this.gChannels.filter(c => c.id === id)[0];
			return chan || { name: `<deleted channel | ID: ${id}>` };
		},
		getTZName: function (id) {
			const tz = this.tzs.filter(c => c.id === id)[0];
			return tz && tz.name ? tz.name : id;
		},
		getType: function (id) {
			const guild = this.guilds.filter(g => g.id === id)[0];
			if (guild) return 'guild';
			const role = this.gRoles.filter(r => r.id === id)[0];
			if (role) return 'role';
			const chan = this.gChannels.filter(c => c.id === id)[0];
			if (chan) return 'channel';
			return 'user';
		},
		add: function(type, cg, com) {
			this.openDropdown = null;
			switch (type) {
				case 'tag':
				case 'alias': {
					if (!this.temp[type+'_name'] || !this.temp[type+'_content']) {
						showNotif('error', `${type[0].toUpperCase()}${type.substr(1)} needs a name and content!`, 3000); return;
					}
					this.gSettings[type === 'tag' ? 'tags' : 'aliases'][this.temp[type+'_name']] = this.temp[type+'_content'];
					this.temp[type+'_name'] = null;
					this.temp[type+'_content'] = null;
					break;
				}
				case 'filter':
				case 'namefilter': {
					let err;
					try {
						new RegExp(this.temp[type], 'gi');
					} catch(e) { err = e; }

					if (err || !this.temp[type]) {
						showNotif('error', `Invalid regex content in ${type}. See the red underlined portions.`, 3000); return;
					}
					if (!Array.isArray(this.gSettings[type].patterns))
						this.gSettings[type].patterns = [];
					this.gSettings[type].patterns.push(this.temp[type]);
					this.temp[type] = null;
					break;
				}
				case 'amil': {
					if (!Array.isArray(this.gSettings.automod.ignore.data))
						this.gSettings.automod.ignore.data = [];
					this.gSettings.automod.ignore.data.push(this.temp.amil);
					this.temp.amil = null;
					break;
				}
				case 'iil':
				case 'fil':
				case 'nfil':
				case 'sbil':
				case 'mil':
				case 'sil': {
					const x = this.ignoreAbbrs[type];
					this.gSettings.ignore[x] = {
						data: Array.isArray(this.gSettings.ignore[x].data) ? this.gSettings.ignore[x].data : [],
						type: 'role_list'
					}
					this.gSettings.ignore[x].data.push(this.temp[type]);
					this.temp[type] = null;
					break;
				}
				case 'amic': {
					if (!Array.isArray(this.gSettings.automod.ignoreChans))
						this.gSettings.automod.ignoreChans = [];
					this.gSettings.automod.ignoreChans.push(this.temp.amic);
					this.temp.amic = null;
					break;
				}
				case 'iic':
				case 'fic':
				case 'nfic':
				case 'sbic':
				case 'mic':
				case 'sic': {
					const x = this.ignoreAbbrs[type];
					this.gSettings.ignore[x] = {
						data: Array.isArray(this.gSettings.ignore[x]) ? this.gSettings.ignore[x] : [],
						type: 'role_list'
					}
					this.gSettings.ignore[x].push(this.temp[type]);
					this.temp[type] = null;
					break;
				}
				case 'perms': {
					if (typeof this.gSettings[com ? 'perms' : 'gperms'][cg] !== 'object')
						this.gSettings[com ? 'perms' : 'gperms'][cg] = {};
					if (!Array.isArray(this.gSettings[com ? 'perms' : 'gperms'][cg].data))
						this.gSettings[com ? 'perms' : 'gperms'][cg].data = [];
					const special = typeof com === 'string';
					this.gSettings[com ? 'perms' : 'gperms'][cg].data.push(this.temp[special ? com : 'pl-'+cg]);
					this.temp[special ? com : 'pl-'+cg] = null;
					break;
				}
				case 'cperms': {
					if (typeof this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan] !== 'object')
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan] = {};
					if (typeof this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg] !== 'object')
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg] = {};
					if (!Array.isArray(this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data))
						this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data = [];
					const special = typeof com === 'string';
					this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data.push(this.temp[special ? com : 'cp-'+cg]);
					this.temp[special ? com : 'cp-'+cg] = null;
					break;
				}
				case 'whitelist_code': {
					const pieces = this.temp[type].split('/');
					this.temp[type] = pieces.pop();
				}
				case 'whitelist_id': {
					if (!Array.isArray(this.gSettings.automod.invite_whitelist))
						this.gSettings.automod.invite_whitelist = [];
					this.gSettings.automod.invite_whitelist.push(this.temp[type]);
					this.temp[type] = null;
					break;
				}
				case 'bl_item':
				case 'bl_chan':
				case 'bl_role': {
					if (!Array.isArray(this.gSettings.blacklist))
						this.gSettings.blacklist = [];
					this.gSettings.blacklist.push(this.temp[type]);
					this.temp[type] = null;
					break;
				}
				case 'arl': {
					if (!Array.isArray(this.gSettings.autorole))
						this.gSettings.autorole = [];
					this.gSettings.autorole.push(this.temp.arl);
					this.temp.arl = null;
					break;
				}

			}
			//this.$forceUpdate();
		},
		del: function(type, index, cg, com) {
			switch (type) {
				case 'tag':
				case 'alias':
					this.gSettings[type === 'tag' ? 'tags' : 'aliases'][index] = null;
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
				case 'mil':
				case 'sil':
					this.gSettings.ignore[this.ignoreAbbrs[type]].data.splice(index, 1);
					break;
				case 'amic':
					this.gSettings.automod.ignoreChans.splice(index, 1);
					break;
				case 'iic':
				case 'fic':
				case 'nfic':
				case 'sbic':
				case 'mic':
				case 'sic':
					this.gSettings.ignore[this.ignoreAbbrs[type]].splice(index, 1);
					break;
				case 'perms':
					this.gSettings[com ? 'perms' : 'gperms'][cg].data.splice(index, 1);
					break;
				case 'cperms':
					this.gSettings.cperms[com ? 'perms' : 'gperms'][this.temp.cperms_chan][cg].data.splice(index, 1);
					break;
				case 'whitelist':
					this.gSettings.automod.invite_whitelist.splice(index, 1);
					break;
				case 'blacklist':
					this.gSettings.blacklist.splice(index, 1);
					break;
				case 'arl':
					this.gSettings.autorole.splice(index, 1);
					break;
			}
			this.$forceUpdate();
			setTimeout( this.$forceUpdate, 69);
			setTimeout( this.$forceUpdate, 690);
		},
		clearPerms: function(group, channel) {
			if (!channel) {
				if (!this.commandList[group]) return;
				for (const command of Object.keys(this.commandList[group])) {
					this.gSettings.perms[command] = {};
				}
			} else if (channel === true) {
				for (const chanID of Object.keys(this.gSettings.cperms.perms)) {
					if (!this.gSettings.cperms.perms[chanID]) continue;
					for (const command in Object.keys(this.commandList[group])) {
						this.gSettings.cperms.perms[chanID][command] = {};
					}
				}
			} else {
				if (!this.gSettings.cperms.perms[channel]) return;
				for (const command of Object.keys(this.commandList[group])) {
					this.gSettings.cperms.perms[channel][command] = {};
				}
			}
		},
		parseMD: function(str, varType = null) {
			// parse markdown (i.e. underlining) and syntax highlighting
			const mdParse = window.SimpleMarkdown.defaultBlockParse;
			const htmlOutput = window.SimpleMarkdown.reactFor(window.SimpleMarkdown.ruleOutput(window.SimpleMarkdown.defaultRules, 'html'));
			str = htmlOutput(mdParse(str))[0];
			str = str.replace(/markdown-code-/g, 'hljs '); // fix code highlighting bullshit
			str = str.replace(/<a href="/g, '<a target="_blank" href="'); // make links open in new tab

			// parse emojis
			str = str.replace(/&lt;(a?):([a-zA-Z_0-9]{2,32}):(\d{17,20})&gt;/g, (match, p1, p2, p3) => {
				return `<img title=":${p2}:" alt=":${p2}:" src="https://cdn.discordapp.com/emojis/${p3}.${p1 ? 'gif' : 'png'}?v=1" style="height:24px!important;vertical-align:middle;">`
			});
			// parse user variables
			if (varType != null) {
				const cg = this.getGuild(this.selectedGuildID);
				const u = this.user;
				if (varType == "welcome") {
					str = str.replace(/{id}/g, `<span class="lightorange">${u.id}</span>`)
							.replace(/{user}/g, `<span class="lightorange">${u.username}#${u.discriminator}</span>`)
							.replace(/{member}/g, `<span class="mention">@${u.username}</span>`)
							.replace(/{server}/g, `<span class="lightorange">${cg.name}</span>`)
							.replace(/{count}/g, `<span class="lightorange">8537</span>`)
							.replace(/{today}/g, `<span class="lightorange">12</span>`)
							.replace(/{thisweek}/g, `<span class="lightorange">192</span>`)
							.replace(/{new}/g, `<span class="lightorange">Created at Apr 20th 2019, 4:20pm UTC</span>`);
				}
				if (varType == "dm") {
					str = str.replace(/{moderator}/g, `<span class="lightorange">Indy#1010</span>`)
							.replace(/{reason}/g, `<span class="lightorange">Not cool enough</span>`)
							.replace(/{user}/g, `<span class="lightorange">Mark.#9999</span>`)
							.replace(/{server}/g, `<span class="lightorange">${cg.name}</span>`)
							.replace(/{duration}/g, `<span class="lightorange">69 minutes</span>`);
				}
				if (varType == "tag") {
					str = str.replace(/{mention}/g, `<span class="mention">@Bender</span>`)
							.replace(/{mention\.tag}/g, `<span class="lightorange">Bender#2282</span>`)
							.replace(/{mention\.id}/g, `<span class="lightorange">300800171988484096</span>`)
							.replace(/{args}/g, `<span class="lightorange">command arguments</span>`)
							.replace(/{author}/g, `<span class="mention">@${u.username}</span>`)
							.replace(/{author\.tag}/g, `<span class="lightorange">${u.username}#${u.discriminator}</span>`)
							.replace(/{author\.id}/g, `<span class="lightorange">${u.id}</span>`)
							.replace(/{p}/g, `<span class="lightorange">${this.gSettings.prefix || ';'}</span>`);
				}
				str = str.replace(/(href="[^"]*)<span[^>]*>([^"]*")/g, '$1$2').replace(/(href="[^"]*)<\/span>([^"]*")/g, '$1$2');
			}
			// parse channel mentions
			const gc = this.gChannels, g = this.selectedGuildID;
			str = str.replace(/&lt;#(\d{17,20})&gt;/g, (match, p1) => {
				for (const i in gc) {
					if (gc[i].id === p1) {
						return `<a target="_blank" href="https://discordapp.com/channels/${g}/${p1}" class="mention">#${gc[i].name}</a>`;
					}
				}
				return '<span class="mention">#deleted-channel</span>';
			});
			// parse role mentions
			const gr = this.gRoles;
			str = str.replace(/&lt;@&amp;(\d{17,20})&gt;/g, (match, p1) => {
				for (const i in gr) {
					if (gr[i].id === p1) {
						return `<span class="mention" style="${gr[i].cssColor}">@${gr[i].name}</span>`;
					}
				}
				return '<span class="mention">@deleted-role</span>';
			});
			// resolve user mentions
			const m = this.gMembers;
			str = str.replace(/(?:<|&lt;)@(\d{17,20})(?:>|&gt;)/g, (match, p1) => {
				for (const i in m) {
					if (m[i].user.id === p1) {
						return `<span class="mention">@${m[i].user.username}</span>`;
					}
				}
				return `<span class="mention">${match}</span>`;
			});

			str = str.replace(/\n/g, '<br>');

			return str;
		},
		hlRegex: window.RegexColorizer.colorizeText, // highlight regex
		getLen(obj, ignore = []) {
			let count = 0;
			for (const key in obj) {
				if (ignore.indexOf(key) === -1 && obj[key])
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
			const m = this.gMembers;
			for (const i in m) {
				if (m[i].user.id === userID) {
					return (m[i].user.avatar ? `<img class="pfp mid" src="https://cdn.discordapp.com/avatars/${m[i].user.id}/${m[i].user.avatar}.${m[i].user.avatar.startsWith('a_') ? 'gif' : 'png'}">` : '') +
					`<span class="mid">${this.escapeHTML(m[i].user.username)}<span class="gray">#${m[i].user.discriminator}</span></span>`;
				}
			}
			return userID;
		},
		automodSpamUnit() {
			switch (this.gSettings.automod.spamTimeUnits) {
				case 'ms':
					this.gSettings.automod.spamTimeUnits = 's';
					break;
				case 's':
					this.gSettings.automod.spamTimeUnits = 'm';
					break;
				case 'm':
					this.gSettings.automod.spamTimeUnits = 'ms';
					break;
			}
		},
		automodMuteUnit() {
			switch (this.gSettings.automod.muteTimeUnits) {
				case 's':
					this.gSettings.automod.muteTimeUnits = 'm';
					break;
				case 'm':
					this.gSettings.automod.muteTimeUnits = 'h';
					break;
				case 'h':
					this.gSettings.automod.muteTimeUnits = 's';
					break;
			}
		},
		muteUnit() {
			switch (this.gSettings.muteTimeUnits) {
				case 'm':
					this.gSettings.muteTimeUnits = 'h';
					break;
				case 'h':
					this.gSettings.muteTimeUnits = 'd';
					break;
				case 'd':
					this.gSettings.muteTimeUnits = 'm';
					break;
			}
		}
	},
	computed: {
		maxPremiumGuilds: function() {
			if (!this.paypalInfo || !this.paypalInfo.plan || typeof this.paypalInfo.plan.description !== 'string') return 0;
			const num = parseInt(this.paypalInfo.plan.description.substr(0, 1));
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
		window.location.assign("https://api.benderbot.co/login_redirect");
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
		let err;
		let gData = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/guild/' + gID, auth: getCookie('token')}).catch(e => err = e);
		if (err && err.status === 418) {
			console.error(err);
			page.loading = false;
			page.column = null;
			page.botNotPresent = true;

			page.gSettings = defaultGuildSettings;
			page.temp.multi_autorole = false;
			page.guildPro = false;
			page.gNames = {};
			//page.unsaved = false;
			page.gRoles = [];
			page.gChannels = [];
			page.gMembers = {};
			page.memberRank = 0;

			//showNotif('pending', 'Bender is not in this server.', 3000);
			return;
		} else if (err) {
			console.error(err);
		} else {
			try {
				gData = JSON.parse(gData);
				// eslint-disable-next-line
			} catch(err) {}
		}

		page.loading = false;
		if (gData && gData.settings) {
			showNotif('success', 'Loaded guild settings!', 4000);
			gData.settings.guildID = gID;
			page.gSettings = gData.settings;
			page.guildPro = gData.pro;
			page.temp.multi_autorole = Array.isArray(page.gSettings.autorole);
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
	setTimeout(window.autoExpandAll, 5);
	// apply syntax highlighting to codeblocks
	setTimeout(window.highlightAll, 5);
}
// eslint-disable-next-line
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
		const temp = {
			guilds: page.paypalInfo.guilds,
			discordID: page.user.id
		};
		//console.log(temp);
		showNotif('pending', 'Saving Bender Pro settings...');
		let err;
		await makeRequest({method: 'POST', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('paypal_token'), auth2: getCookie('token'), body: temp}).catch(er => {
			err = er;
			console.error(er);
		});
		page.loading = false;
		if (err) {
			showNotif('error', `Failed to save Bender Pro settings.\n${err.status} ${err.statusText}`, 6000);
		} else {
			showNotif('success', 'Saved Bender Pro settings!', 4000);
			//page.unsaved = false;
		}
		return;
	}

	page.loading = true;
    showNotif('pending', 'Saving guild settings...');
    let err;
	const response = await makeRequest({method: 'POST', url: 'https://api.benderbot.co/guild/' + gID, auth: getCookie('token'), body: page.gSettings}).catch(er => {
		err = er;
		console.error(er);
	});

	page.loading = false;
	if (err && err.status === 400) {
		page.modalText = err.responseText;
		showNotif('', '');
	} else if (err) {
		showNotif('error', `Failed to save guild settings.\n${err.status} ${err.statusText}`, 6000);
	} else if (response === null) { // response was a 204
		showNotif('pending', 'Saved - No changes were needed.', 5000);
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
        const data = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('paypal_token')}).catch(console.error);
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
        const data = await makeRequest({method: 'GET', url: 'https://api.benderbot.co/paypal_info', auth: getCookie('token')}).catch(console.error);
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

/* more shit from StackOverflow
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
}*/

/*page.$watch('gSettings', function(newValue, oldValue) {
	page.unsaved = oldValue.guildID && oldValue.guildID === newValue.guildID && !compareObj(newValue, oldValue);
	console.log({oldValue, newValue});
	//console.log('oldValue.__ob__ === newValue.__ob__ ? '+(oldValue.__ob__ === newValue.__ob__));
	console.log('unsaved changes? '+page.unsaved);
}, {deep: true});
window.onbeforeunload = function() {
  return page.unsaved ? 'Are you sure you want to discard your changes?' : null;
};*/
