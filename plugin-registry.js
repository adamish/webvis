class PluginRegistry {
	constructor() {
		this.plugins = [];
	}
	add(plugin) {
		this.plugins.push(plugin);
	}
	getAll() {
		return this.plugins;
	}
}

window.pluginRegistry = new PluginRegistry();