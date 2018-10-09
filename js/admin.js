$(document).ready(function() {
    // save rosters
    $("#roster-form button").click(saveRosters);

    // check all functionality
    $("#roster-form .team-name input").change(function() {
        $(this).parents(".team-name").siblings("input").prop("checked", this.checked);
    });
});

function saveRosters(e) {
    var form = $(e).parents("form");
    var gameId = game.gameId;
    var rosters = [];

    // update button text
    var button = $(this);
    $(button).text("Saving...").prop("disabled", true);

    // clear statuses
    $(".error, .success").remove();

    // get away players
    $("#roster-form .check-list:first-of-type input[type=checkbox]:checked:not(.all)").each(function() {
        rosters.push({ GameId: gameId, TeamId: game.awayId, PlayerId: this.value, Number: $(this).attr("data-num") });
    });

    // get home players
    $("#roster-form .check-list:last-of-type input[type=checkbox]:checked:not(.all)").each(function () {
        rosters.push({ GameId: gameId, TeamId: game.homeId, PlayerId: this.value, Number: $(this).attr("data-num") });
    });

    // send players. If none, send gameId to clear rosters for game
    $.post("/game/savegamerosters", rosters.length > 0 ? { rosters: rosters } : { gameId: gameId }).always(function(result) {
        if (result.status == null) {
            if (result.success) {
                $(".dynamic").prepend("<div class='success'>" + result.message + "</div");
                $("#roster-form").parents(".modal").find(".cancel").click();
            }

            else {
                $("#roster-form").prepend("<div class='error'>" + result.message + "</div>");
            }
        }

        else {
            $("#roster-form").prepend("<div class='error'>Connection error. Please try again shortly.</div>");
        }

        // reset button back to normal
        $(button).text("Save Rosters").prop("disabled", false);
    });

}