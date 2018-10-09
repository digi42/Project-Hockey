$(document).ready(function() {
    // update surface selection when rink changes
    $("select[name=RinkId]").change(updateSurfaces);

    // load game for editing
    $(".edit-game").click(loadGame);

    // forfeit game
    $(".forfeit").click(forfeit);

    // remove forfeit
    $(".remove-forfeit").click(removeForfeit);

    // delete game
    $(".delete-game").click(deleteGame);

    // validate game
    $("#game-form").submit(validateGame);

    // validate forfeit
    $("#forfeit-form").submit(validateForfeit);

});

function updateSurfaces() {
    var rinkId = $(this).val();
    var s = $.grep(surfaces, function(e) { return e.RinkId == rinkId; });
    var field = $("select[name=SurfaceId]");

    if (s.length > 0) {
        var options = "<option></option>";

        $(s).each(function (i, e) {
            options += "<option value='" + e.SurfaceId + "'>" + e.Name + "</option>";
        });

        $(field).html(options);
        $(field).parents(".field").show();
    }

    else {
        $(field).html("");
        $(field).parents(".field").hide();
    }
}

function loadGame() {
    var gameId = $(this).attr("data-id");
    var g = $.grep(games, function(e) { return e.GameId == gameId; });

    if (g.length == 1) {
        var game = g[0];
        var form = $("#game-form");

        // set date
        if (game.Date != null) {
            var ticks = parseInt(game.Date.match(/\d+/)[0]);
            var date = new Date(ticks);
            $("input[name=Date]", form).val(date.formatted());
        }
        
        // set time
        if (game.Time != null) {
            var t = time(game.Time);
            $("input[name=Time]", form).val(t);
        }

        $("input[name=GameId]", form).val(game.GameId);
        $("select[name=RinkId]", form).val(game.RinkId).change();
        $("select[name=SurfaceId]", form).val(game.SurfaceId);
        $("select[name=GameType]", form).val(game.GameType);
        $("select[name=HomeId]", form).val(game.HomeId);
        $("select[name=AwayId]", form).val(game.AwayId);
        $("input[name=Description]", form).val(game.Description);

        showModal($(form).parents(".modal"), "Edit Game");
    }

    else
        $(".dynamic").prepend("<div class='error'>Error. Game not found. Please refresh the page.</div>");

    $(this).parents("ul").slideUp(250);
}

function forfeit() {
    var gameId = $(this).attr("data-id");
    var g = $.grep(games, function (e) { return e.GameId == gameId; });

    if (g.length == 1) {
        var game = g[0];
        var form = $("#forfeit-form");
        var away = $("input[data-id=" + game.AwayId + "]").attr("data-name");
        var home = $("input[data-id=" + game.HomeId + "]").attr("data-name");
        $("input[name=gameId]", form).val(gameId);
        $("label[for=away-forfeit]", form).html(away);
        $("label[for=home-forfeit]", form).html(home);

        showModal($(form).parents(".modal"), "Forfeit");
    }

    else
        $(".dynamic").prepend("<div class='error'>Error. Game not found. Please refresh the page.</div>");

    $(this).parents("ul").slideUp(250);
}

function removeForfeit() {
    if (confirm("Are you sure you want to remove this forfeit?")) {
        var gameId = $(this).attr("data-id");
        var form = $("#forfeit-form");
        $("input[name=gameId]", form).val(gameId);
        $("input[name=forfeit]", form).val(false);
        form.submit();
    }
}

function deleteGame() {
    if (confirm("Are you sure you want to delete this game? This cannot be undone.")) {
        var gameId = $(this).attr("data-id");
        post("/game/delete", { gameId: gameId });
    }
}

function validateGame(e) {
    var form = $("#game-form");
    var date = $("input[name=Date]", form).val();
    var away = $("select[name=AwayId]", form).val();
    var home = $("select[name=HomeId]", form).val();

    var errors = [];

    if (date == "" && away == "" && home == "")
        errors.push("Game must have a date OR at least one team present.");

    if (home == away && away != "")
        errors.push("Home and away team are the same.");

    if (errors.length > 0) {
        e.preventDefault();
        $(".error", form).remove();
        $(form).prepend("<div class='error'>" + errors.join("<br/>") + "</div>");
    }
}

function validateForfeit(e) {
    var form = $("#forfeit-form");
    var away = $("input[name=away]", form).is(":checked");
    var home = $("input[name=home]", form).is(":checked");
    var forfeit = $("input[name=forfeit]", form).val() == "true";

    if (!home && !away && forfeit) {
        e.preventDefault();
        $(".error", form).remove();
        $(form).prepend("<div class='error'>At least one team must be selected for forfeit.</div>");
    }
}