function Player(id) {
    this.id = id;
    this.role = null;
    this.view = null;
};

Player.prototype.updateView = function (view) {
    this.view = view;
};

Player.prototype.setRole = function(role) {
    this.role = role;
};

module.exports = Player;
