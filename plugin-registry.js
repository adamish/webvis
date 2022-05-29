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
    indexOf(id) {
        var i;
        for (i = 0; i < this.plugins.length; i++) {
            if (this.plugins[i].getId() == id) {
                return i;
            }
        }
        return -1;
    }
}

window.pluginRegistry = new PluginRegistry();