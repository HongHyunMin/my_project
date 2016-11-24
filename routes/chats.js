var express = require('express');
var router = express.Router();
var app = express();

router.get('/chating', function(req, res) {
    res.render("chats/chat", {
        user: req.user
    });
});

module.exports = router;
