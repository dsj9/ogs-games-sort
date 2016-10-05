// ==UserScript==
// @name         OGS Games Sort
// @version      1
// @description  Sort OGS observe games pages by player strength
// @author       Kjetil Hjartnes
// @homepageURL  https://github.com/dsj9/ogs-games-sort
// @match        *://online-go.com/*
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    waitForKeyElements (
    '#server_games_container',
    ogs_sort_games
    );
})();

function parse_rank(s) {
    var grades = {
        k: { base: 2100, multi: -100 },
        d: { base: 2000, multi: +100 },
        p: { base: 2900, multi: +100 }
    };
    var p = /[\(\[](\d+)([dkp])[\)\]]$/;
    s = s.trim();
    if (!p.test(s)) {
        return null;
    }
    var m = s.match(p);
    return grades[m[2]].base + (+m[1] * grades[m[2]].multi);
}

function is_list_view() {
    return window.site_preferences.show_game_list_view;
}

function sort_games(games) {
    games.sort(function (x, y) {
        var xhi = Math.max(x.w_rating, x.b_rating);
        var xlo = Math.min(x.w_rating, x.b_rating);
        var yhi = Math.max(y.w_rating, y.b_rating);
        var ylo = Math.min(y.w_rating, y.b_rating);

        if (yhi - xhi !== 0) {
            return yhi - xhi;
        } else if (ylo - xlo !== 0) {
            return ylo - xlo;
        } else if (x.b_name !== y.b_name) {
            return (x.b_name < y.b_name ? -1 : (x.b_name > y.b_name ? 1 : 0));
        } else if (x.w_name !== y.w_name) {
            return (x.w_name < y.w_name ? -1 : (x.w_name > y.w_name ? 1 : 0 ));
        } else return (x.id < y.id ? -1 : (x.id > y.id ? 1 : 0 ));
    });
    return games;
}

function get_grid(container) {
    var games = [];
    var items = container.find("div.board_container");
    $.each(items, function(i){
        var b = $(this).find(".board_title_black .player-name").text();
        var w = $(this).find(".board_title_white .player-name").text();
        if (!b.length || !w.length) {
            return games;
        }
        games[i] = {
            id: "container-" + $(this).find("a.board").attr("id"),
            b_name: b,
            w_name: w,
            b_rating: parse_rank(b),
            w_rating: parse_rank(w)
        };
        $(this).attr("id", games[i].id);
    });
    return games;
}

function get_list(container) {
    var games = [];
    var rows = container.find("tr.board");
    if (!rows.length) {
        return games;
    }
    var count = rows.length;
    for (var i = 0; i < count; i++) {
        games[i] = {
            id: rows[i].attributes.id.textContent,
            b_name: rows[i].children[2].textContent,
            w_name: rows[i].children[4].textContent,
            b_rating: parse_rank(rows[i].children[2].textContent),
            w_rating: parse_rank(rows[i].children[4].textContent)
        };
    }
    return games;
}

function ogs_sort_games(jNode) {

    var container, games;

    if (is_list_view()) {
        container = jNode.find(".game-list");
        games = get_list(container);
    } else {
        container = jNode.find(".minigobans");
        games = get_grid(container);
    }

    if (games.length) {
        // sort games by rating, name, and id
        games = sort_games(games);

        // reposition items into container by sorted id
        $.each(games, function(){
            container.append($("#" + this.id));
        });
    }
    setTimeout(function() {
        ogs_sort_games(jNode);
    }, 500);
}
