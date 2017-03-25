// ==UserScript==
// @name         OGS Games Sort
// @version      2
// @description  Sort OGS observe games pages by player strength
// @author       Kjetil Hjartnes
// @match        *://online-go.com/*
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    waitForKeyElements (
    '.GameList',
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
    return $('.GameList').hasClass('GobanLineSummaryContainer');
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
    var items = container.find(".MiniGoban");
    $.each(items, function(i){
        var b = $(this).find(".title-black .player-name").text();
        var w = $(this).find(".title-white .player-name").text();
        if (!b.length || !w.length) {
            return games;
        }
        games[i] = {
            id: "game-" + i,
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
    var items = container.find(".GobanLineSummary");
    $.each(items, function(i){
        var b = $(this).find(".Player").first();
        var w = $(this).find(".Player").last();
        games[i] = {
            id: "game-"+i,
            b_name: b.text(),
            w_name: w.text(),
            b_rating: parse_rank(b.attr( "data-rank" )),
            w_rating: parse_rank(w.attr( "data-rank" ))
        };
        $(this).attr("id", games[i].id);
    });
    return games;
}

function ogs_sort_games(jNode) {

    var games;
    var container = jNode;

    if (is_list_view()) {
        games = get_list(jNode);
    } else {
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
