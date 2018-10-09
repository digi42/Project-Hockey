$(document).ready(function () {
    // #region Universal Actions

    // toggler
    $(".toggler").click(function() {
        $(this).next(".collapsable").slideToggle();
    });

    // open collapsables
    $("button.opener").click(function() {
        $("#" + $(this).attr("name")).slideToggle();
    });

    // open options 
    $(".options-opener").click(function() {
        $(this).siblings("ul").slideToggle(250);
    });

    // close options
    $(".options-cancel").click(function () {
        $(this).parents("ul").slideUp(250);
    });

    // tab behavior
    $(".tab:not(.links)").click(function() {
        var name = $(this).attr("data-name");
        $(".tab-page").hide();
        $(".tab-page[data-name=" + name + "]").show();
        $(".tab").removeClass("active");
        $(this).addClass("active");
    });

    // form validators
    $("form:not(.ajax)").submit(function (e) {
        var errors = formErrors(this);     

        if (errors.length > 0) {
            $(".error", this).remove();
            $(this).prepend("<div class='error'>" + errors.join("<br />") + "</div>");
            e.preventDefault();
        }
    });

    // masks
    $(".mask").inputmask();

    // open modals
    $("button.open-modal").click(function () {
        var modal = $("#" + $(this).attr("name")).parents(".modal");
        var id = $(this).attr("data-id");
        if (id != null) {
            var player = $.grep(players, function (e) { return e.PlayerInstanceId == id; });
            if (player.length > 0) {
                $("input[name=PlayerId]", modal).val(player[0].PlayerId);
                $("input[name=ProfileId]", modal).val(player[0].ProfileId);
                $("input[name=FirstName]", modal).val(player[0].FirstName);
                $("input[name=LastName]", modal).val(player[0].LastName);
            }
            else {
                $(".dynamic").prepend("<div class='error'>Error. Player not found. Please refresh the page.</div>");
                return;
            }
        }

        var title = $(this).attr("data-modal-title");
        var modal = $("#" + $(this).attr("name")).parents(".modal");
        var overlay = "<div class='overlay'></div>";
        $(".top h4", modal).html(title);
        $(modal).fadeIn();
        $(overlay).hide().prependTo("body").fadeIn();
        $("body").animate({ scrollTop: 0 }, "fast");
    });

    // close modals
    $(".modal .bottom .cancel, .modal .close").click(function() {
        var modal = $(this).parents(".modal");
        var form = $("form", modal);
        var id = $(form).attr("id");
        $(modal).fadeOut();
        $(".rest-of-form", form).hide();

        if (id == "find-player") {
            $("#player-instance").parents(".modal").fadeIn();
            resetForm(form);
            $("#find-player .results").html("");
        }

        else if (id == "player-form" && $(form).hasClass("ajax")) {
            $("#player-instance").parents(".modal").fadeIn();
            $(form).removeClass("ajax");
            resetForm(form);
        }

        else if (id == "roster-form") {
            $(".overlay").fadeOut(400, function () {
                $(".overlay").remove();
            });
        }

        else {
            $(".overlay").fadeOut(400, function () {
                $(".overlay").remove();
                resetForm(form);
            });
        }
    });

    // toggle mobile actions
    $(".action-toggle").click(function(e) {
        $(this).next().slideToggle();
    });

    // toggle edit actions
    $(".actions button").click(function () {
        $(this).next("ul").slideToggle(250);
    });
    // #endregion

    // #region Player Actions

    // set title for search form 
    $("#find-player").parents(".modal").find(".top h4").html("Find Player");

    // show search modal
    $("#find-player-button").click(function() {
        $(this).parents(".modal").fadeOut();
        $("#find-player").parents(".modal").fadeIn();
    });

    // show create player
    $("#create-player-button").click(function () {
        var form = $("#player-form");
        $(this).parents(".modal").fadeOut();
        showModal($(form).parents(".modal"), "Create Player");
    });

    // search for player
    $("#find-player #search").click(function() {
        var f = $("#find-player input[name=firstName]").val();
        var l = $("#find-player input[name=lastName]").val();
        var results = $("#find-player .results");

        if (l.length >= 3) {
            $(results).html("Searching...");

            $.post("/player/search", {
                firstName: f,
                lastName: l
            },
            function (data) {
                if (!data.error) {
                    $(results).html("");
                    if (data.length > 0) {
                        $(data).each(function (i, player) {
                            var html = $("<div><button type='button'>Select Player</button><span>" + player.Name + "</span></div>");
                            $(results).append(html);
                            $("button:last", results).data(player);
                        });

                        // link player
                        $("#find-player .results button").click(function () {
                            var player = $(this).data();                            
                            updatePlayer(player);
                            $("#find-player").parents(".modal").find(".close").trigger("click");
                            $("#player-instance").parents(".modal").fadeIn();
                        });
                    }

                    else
                        $(results).html("<div class='error'>No Players Found</div>");
                }

                else 
                    $(results).html("<div class='error'>" + data.error + "</div>");
            })
            .fail(function() {
                $(results).html("<div class='error'>Javascript error. Please refresh page and try again.</div>");
            })
        }

        else 
            $(results).html("<div class='error'>Please provide at least 3 letters of Last Name to search.</div>");
    });

    // create player
    $("#player-form.ajax button.confirm").click(function(e) {
        e.preventDefault();
        var errors = [];
        var form = $(this).parents(form);        
        var values = $(form).serializeObject();
        var errors = formErrors(form);
        
        if (errors.length == 0) {
            ajax("/player/saveajax", "POST", values, "#player-form", function (player) {
                updatePlayer(player);
                $("#player-form").parents(".modal").find(".close").trigger("click");
                $("#player-instance").parents(".modal").fadeIn();
            });
        }

        else {
            $(form).prepend("<div class='error'>" + errors.join("<br />") + "</div>");
        }
    });

    // edit instance
    $(".edit-instance").click(function () {
        var form = $("#player-instance");
        var id = $(this).attr("data-id");
        var player = $.grep(players, function (e) { return e.InstanceId == id; });
        if (player.length > 0) {
            player = player[0];
            updatePlayer(player);
            $("input[name=InstanceId]", form).val(player.InstanceId);
            $("input[name=Number]", form).val(player.Number);
            setPosition(player.Position);
            showModal($(form).parents(".modal"), "Edit Roster Entry");
        }

        else {
            $(".dynamic").prepend("<div class='error'>Error. Roster entry not found. Please refresh the page.</div>");
            return;
        }

    });

    //// edit player
    //$(".actions .edit-player").click(function () {
    //    var form = $("#player-form");
    //    var id = $(this).parents("tr").attr("data-id");
    //    var player = $.grep(players, function (e) { return e.PlayerInstanceId == id; });
    //    if (player.length > 0 && player[0].PlayerId != "") {
    //        player = player[0];
            
    //        $("input[name=PlayerId]", form).val(player.PlayerId);
    //        $("input[name=FirstName]", form).val(player.FirstName);
    //        $("input[name=LastName]", form).val(player.LastName);
    //        setDateOfBirth(player.BirthDate);
    //        $("input[name=HomeCity]", form).val(player.HomeCity);
    //        $("select[name=HomeRegion]", form).val(player.HomeRegion);
    //        setHeight(player.Height);
    //        $("input[name=Weight]", form).val(player.Weight);
    //        $("select[name=LeftHanded]", form).val(player.LeftHanded.toString());
    //        showModal($(form).parents(".modal"), "Edit Player");
    //        $(this).parents("ul").slideUp();
    //    }

    //    else {
    //        $(".dynamic").prepend("<div class='error'>Error. Player not found. Please refresh the page.</div>");
    //        return;
    //    }

    //});

    // remove player
    $("#remove-player-button").click(function () {
        updatePlayer(0);
    });

    // #region admin actions
    $(".edit-goal").click(function() {
        var id = $(this).attr("data-goal-id");
        var goal = $.grep(goals, function (e) { return e.GoalId == id; });
        if (goal.length > 0) {
            var form = $("#goal-form");
            goal = goal[0];

            // set team radio
            $(".team-select[data-team-id=" + goal.TeamId + "]", form).click();

            // set time
            $("input[name=t]", form).val(getTime(goal.Time)).change();

            $("input[name=GoalId]", form).val(goal.GoalId);
            $("input[name=Period]", form).val(goal.Period);
            $("select[name=Scorer]", form).val(goal.Scorer);
            $("select[name=PrimaryAssist]", form).val(goal.PrimaryAssist);
            $("select[name=SecondaryAssist]", form).val(goal.SecondaryAssist);
            $("input[name=SpecialType][value=" + goal.SpecialType + "]", form).prop("checked", true);

            showModal($(form).parents(".modal"), "Edit Goal");
        }

        else 
            $(".dynamic").prepend("<div class='error'>Error. Goal not found. Please refresh the page.</div>");

    });    

    $(".delete-goal").click(function() {
        if (confirm("Are you sure you want to delete this goal?")) {
            var goalId = $(this).attr("data-goal-id");
            var gameId = document.location.pathname.split("/")[2];
            document.location.href = "/game/deletegoal?goalId=" + goalId + "&gameId=" + gameId;
        }
    });

    $(".edit-penalty").click(function () {
        var id = $(this).attr("data-penalty-id");
        var penalty = $.grep(penalties, function (e) { return e.PenaltyId == id; });
        if (penalty.length > 0) {
            var form = $("#penalty-form");
            penalty = penalty[0];

            // set team radio
            $(".team-select[data-team-id=" + penalty.TeamId + "]", form).click();

            // set time
            $("input[name=t]", form).val(getTime(penalty.Time)).change();

            $("input[name=PenaltyId]", form).val(penalty.PenaltyId);
            $("input[name=Period]", form).val(penalty.Period);
            $("select[name=Player]", form).val(penalty.Player);
            $("select[name=PenaltyType]", form).val(penalty.PenaltyType);
            $("select[name=Offense]", form).val(penalty.Offense);

            showModal($(form).parents(".modal"), "Edit Penalty");
        }

        else
            $(".dynamic").prepend("<div class='error'>Error. Penalty not found. Please refresh the page.</div>");

    });

    $(".remove-instance").click(function () {
        if (confirm("Are you sure you want to remove this player from roster?")) {
            var instanceId = $(this).attr("data-id");
            var ret = document.location.pathname;
            document.location.href = "/player/" + instanceId + "/remove-instance" + "?ret=" + ret;
        }
    });

    $(".delete-penalty").click(function () {
        if (confirm("Are you sure you want to delete this penalty?")) {
            var penaltyId = $(this).attr("data-penalty-id");
            var gameId = document.location.pathname.split("/")[2];
            document.location.href = "/game/deletepenalty?penaltyId=" + penaltyId + "&gameId=" + gameId;
        }
    });

    // remove permission
    $(".remove-permission").click(function(e) {
        if (confirm("Are you sure you want remove this team manager?")) {
            
        }

        else 
            e.preventDefault();
    });

    // #endregion

    // #endregion

    // #region Triggers

    // roster position
    $("input.pos").change(function () {
        var pos = 0;

        $("input.pos:checked").each(function () {
            pos += parseInt($(this).val());
        });

        $("input[name=Position]").val(pos == 0 ? "null" : pos);
    });

    // player height
    $("select.height").change(function () {
        var h = 0;
        var feet = $("select.height:first").val();
        var inches = $("select.height:last").val();
        
        if (feet > 0) {
            h = parseInt(feet) * 12;
            if (inches > 0)
                h += parseInt(inches);
        }       

        $("input[name=Height]").val(h == 0 ? "null" : h);
    });

    // team change
    $("label.team-select").click(function () {
        var form = $(this).parents("form")
        $(".rest-of-form", form).slideDown();
        $(".team-select", form).removeClass("selected");
        $(this).addClass("selected");
        $("input[name=TeamId]", form).val($(this).attr("data-team-id"));
        var home = $(this).hasClass("home");
        $(".player-select", form).html(home ? homeOptions : awayOptions);
    });


    // time change
    $("input[name=t]").change(function () {
        var form = $(this).parents("form")
        var t = $(this).val();
        if (t >= 0 && t <= 3000) {
            var time = "";
            switch (t.length) {
                case 0: break;
                case 1: time = "0:00:0" + t; break;
                case 2: time = "0:00:" + t; break;
                case 3: time = "0:0" + t.substring(0, 1) + ":" + t.substring(1, 3); break;
                case 4: time = "0:" + t.substring(0, 2) + ":" + t.substring(2, 4); break;
            }
            $(this).siblings("input[name=Time]", form).val(time);
        }
    });

    // season name change
    $("select[name=SeasonStart], input[name=Year], input[name=YearRollover]").change(function() {
        var s = $("select[name=SeasonStart]").val();
        var y = $("input[name=Year]").val();
        var r = $("input[name=YearRollover]").prop("checked");
        var name = getSeasonName(s, y, r);
        $("#season-form .season-name").html("Season Info: " + name);
    });

    // #endregion

    // #region Misc
    $("select.null-default").prop("selectedIndex", -1);

    // prevent readonly selects from being changed
    $("select.readonly").on("mousedown", function(e) {
        e.preventDefault();
    });
    // #endregion

    $(".add-shootout").click(addShootout);
    $("#shootout-form .team-select").change(changeTeam);
    $("#shootout-form .save-shootout").click(saveShootout);
    $(".delete-shootout").click(deleteShootout);

});

// #region Functions
function changeTeam() {
    var home = $(":selected", this).hasClass("home");
    $("#shootout-form .player-select").html(home ? homeOptions : awayOptions);
}

function addShootout() {
    // get values
    var form = $("#shootout-form");
    var gameId = $("input[name=gameId]", form).val();
    var team = $(".team-select", form);
    var player = $(".player-select", form);
    var result = $(".result-select", form);
    var data = { GameId: gameId, TeamId: $(team).val(), PlayerId: $(player).val(), Scored: $(result).val() };

    if (data.TeamId != "" && data.PlayerId != "" && data.Scored != null) {
        // get table row html
        var count = $("table tr", form).length;
        var html = "<tr data='" + JSON.stringify(data) + "'><td class='dim'>" + (count - 1) + "</td>";
        html += "<td>" + $(":selected", team).text() + "</td>";
        html += "<td>" + $(":selected", player).text() + "</td>";
        html += "<td>" + $(":selected", result).text() + "</td>"
        html += "<td><img src='/img/icons/trash.svg' title='Delete' class='icon delete-shootout'/></td></tr>";

        // make sure only last row has delete option
        $("tr .delete-shootout", form).remove();

        // reset editing row
        var table = $("table", form);
        var row = $(".adder-row", table);
        $(table).append(html);
        $(table).append(row);
        var otherTeam = $("option:not(:selected)", team);
        $(team).val($(otherTeam).val()).change().attr("disabled", "disabled");
        $(result).val("");
        $(".delete-shootout").click(deleteShootout);
        updateShootoutScore();
    }
}

function deleteShootout() {
    $(this).parents("tr").remove();
    var count = $("#shootout-form table tr").length;
    var team = $("#shootout-form .team-select");
    var otherTeam = $("option:not(:selected)", team);
    $("#shootout-form .result-select").val("");

    // > 2 means at least one row of data (header and adder row don't count)
    if (count > 2) {
        $("#shootout-form tr:not(.adder-row)").last().find("td:last").append("<img src='/img/icons/trash.svg' title='Delete' class='icon delete-shootout'/>");
        $(team).val($(otherTeam).val()).change().attr("disabled", "disabled");
        $(".delete-shootout").click(deleteShootout);
    }

    else {
        $(team).val($(otherTeam).val()).change().removeAttr("disabled");
    }   

    updateShootoutScore();
}

function saveShootout() {
    var form = $("#shootout-form");
    // clear previous errors
    $(".error", form).remove();

    var shootouts = [];
    $("tr", form).each(function(i, e) {
        var data = $(this).attr("data");
        if (data != undefined) {
            var json = JSON.parse(data);
            json.ShotOrder = i;
            shootouts.push(json);
        }
    });

    if (shootouts.length == 0) {
        $(form).prepend("<div class='error'>Must have at least one shootout goal.</div>");
    }

    else if ($(".field.home .score", form).html() == $(".field.away .score", form).html()) {
        $(form).prepend("<div class='error'>Shootout score cannot be tied.</div>");
    }

    else {
        $.ajax({
            type: "POST",
            url: "/shootout/save",
            data: { shootouts: shootouts },
            success: function(data) {
                if (data.success) {
                    $(form).prepend("<div class='success'>Success. Reloading page.</div>");
                    location.reload();
                }

                else {
                    $(form).prepend("<div class='error'>Server error. Please try again.</div>");
                }
            },
            error: function() {
                $(form).prepend("<div class='error'>Error sending data. Please try again.</div>");
            }
        });
    }
}

function updateShootoutScore() {
    var away = $("#shootout-form .field.away");
    var home = $("#shootout-form .field.home");
    var aAbbr = $(away).attr("data-abbr");
    var hAbbr = $(home).attr("data-abbr");
    var aScore = $("#shootout-form tr:not(.adder-row):contains(Goal):contains(" + aAbbr + ")").length;
    var hScore = $("#shootout-form tr:not(.adder-row):contains(Goal):contains(" + hAbbr + ")").length;
    $(".score", away).html(aScore);
    $(".score", home).html(hScore);
}

function updatePlayer(player) {
    if (player != 0) {
        $("#player-instance input[name=PlayerId]").val(player.PlayerId);
        $("#player-name").html(player.Name);
        $("#find-player-button").hide();
        $("#create-player-button").hide();
        $("#remove-player-button").show();
    }

    else {
        $("#player-instance input[name=PlayerId]").val("");
        $("#player-name").html("");
        $("#find-player-button").show();
        $("#create-player-button").show();
        $("#remove-player-button").hide();
    }
}

function setPosition(pos) {
    if (pos == null) return;

    if (pos >= 32) {
        $(".pos[value=32]").prop("checked", true);
        pos -= 32;
    }

    if (pos >= 16) {
        $(".pos[value=16]").prop("checked", true);
        pos -= 16;
    }

    if (pos >= 8) {
        $(".pos[value=8]").prop("checked", true);
        pos -= 8;
    }

    if (pos >= 4) {
        $(".pos[value=4]").prop("checked", true);
        pos -= 4;
    }

    if (pos >= 2) {
        $(".pos[value=2]").prop("checked", true);
        pos -= 2;
    }

    if (pos == 1) {
        $(".pos[value=1]").prop("checked", true);
    }

    $("input.pos:first").trigger("change");
}

function setHeight(h) {
    if (h != "" && h >= 36) {
        var input = $("input[name=Height]");
        var inches = h % 12;
        var feet = (h - inches) / 12;
        $("select.height:first").val(feet);
        $("select.height:last").val(inches).trigger("change");
    }
}

function setDateOfBirth(d) {
    if (d != null) {
        var date = new Date(parseInt(d.substr(6)));
        if (!isNaN(Date.parse(date)))
            $("input[name=BirthDate]").val((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear());
    }
}

function showModal(modal, title) {
    $(".top h4", modal).html(title);
    $(modal).fadeIn();
    if ($(".overlay").length == 0) {
        var overlay = "<div class='overlay'></div>";
        $(overlay).hide().prependTo("body").fadeIn();
    }
    $("body").animate({ scrollTop: 0 }, "fast");
}

function resetForm(form) {
    var id = $(form).attr("id");
    $(".volatile", form).val("");
    document.getElementById(id).reset();

    if (id == "player-instance") 
        updatePlayer(0);

    if (id == "find-player") {
        $(".results", form).html();
    }

    if (id == "goal-form") {
        $(".team-select", form).removeClass("selected");
    }

    $(".error", form).remove();        
}
// #endregion

function getSeasonName(s, y, r) {
    var name = "";

    switch (s) {
        case "0": break;
        case "1": name = "Fall"; break;
        case "2": name = "Winter"; break;
        case "3": name = "Spring"; break;
        case "4": name = "Summer"; break;
    }

    name += " " + y;
    if (r)
        name += "/" + (parseInt(y) + 1).toString().substring(2, 4);

    return name;
}

// #region Form Validators
function formErrors(form) {
    var errors = [];
    var id = $(form).attr("id");
    var values = $(form).serializeObject();

    if (id == "player-instance") {
        if (values.PlayerId == "")
            errors.push("Roster entry must have a player.");
    }

    if (id == "player-form") {
        if (values.FirstName.trim() == "")
            errors.push("First Name is required.");

        if (values.LastName.trim() == "")
            errors.push("Last Name is required.");
        /*
        var date = Date.parse(values.BirthDate);
        var regex = /^$|^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(18|19|20)\d{2}$/;
        if (!regex.test(values.BirthDate) || date < new Date("1800-1-1") || date > new Date())
            errors.push("Date of Birth is invalid. Please use the format m/d/yyyy");

        if (values.Weight.trim() != "" && (values.Weight < 50 || values.Weight > 300))
            errors.push("Weight must be between 50 and 300 lbs.");
            */
    }

    if (id == "game-form") {
        if (values.Date == "" && values.HomeId == "" && values.AwayId == "")
            errors.push("Game must have a date OR at least one team present.");

        if (values.HomeId == values.AwayId && values.HomeId != "")
            errors.push("Home and away team are the same.");
    }

    if (id == "goal-form") {
        if (values.TeamId = "")
            errors.push("Must select a team.");

        if (values.Period <= 0 || values.Period > 10)
            errors.push("Period must be a number between 1 and 10.");

        if (values.t < 0 || values.t % 100 >= 60 || values.t > 3000)
            errors.push("Time is invalid.");

        if (values.Scorer == "")
            errors.push("Scorer is required.");

        if (values.Scorer == values.PrimaryAssist || values.Scorer == values.SecondaryAssist)
            errors.push("Same player detected twice.");

        if (values.PrimaryAssist == values.SecondaryAssist && values.PrimaryAssist != "")
            errors.push("Same player detected twice.");

        if (values.PrimaryAssist == "" && values.SecondaryAssist > 0)
            errors.push("Need primary assist before secondary assist.");
    }

    if (id == "penalty-form") {
        if (values.t < 0 || values.t % 100 >= 60 || values.t > 3000)
            errors.push("Time is invalid.");
    }
    /*
    $("input:required", this).each(function () {
        var field = $(this);
        if (field.val().trim() == "")
            errors.push(field.attr("name") + "is required.");
    });

    var password = $("input[name=password]", this);
    if (password.length > 0) {
        if ($(password).val().length < 8)
            errors.push("Password must be at least 8 characters long.");
    }

    var confirm = $("input[name=confirm]", this);
    if (confirm.length > 0) {
        if ($(password).val() != $(confirm).val())
            errors.push("Passwords do not match.");
    }

    var email = $("input[name=email]", this);
    if (email.length > 0) {
        var regex = new RegExp(/^[\+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
        if (!regex.test($(email).val()))
            errors.push("Invalid email address.");
    }

    var date = $("input[name*=Date]", this);
    if (date.length > 0) {
        var d = $(date).val().trim();
        if (d != "") {
            var regex = new RegExp(/(0?[1-9]|1[012])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}/);

            if (!regex.test(d))
                errors.push($(date).prev("label").html() + " is invalid.");

            var d2 = new Date(d);
            if (d2 > new Date("1800") || d2 < new Date().getFullYear() + 1)
                errors.push($(date).prev("label").html() + " is out of range.");
        }
    }

    var height = $("input[name=height]", this);
    if (height.length > 0) {
        var measurements = $(height).siblings("select");
        var feet = $(measurements[0]).val();
        if (feet != "") {
            var inches = parseInt(feet * 12);
            inches += parseInt($(measurements[1]).val());
            $(height).val(inches);
        }
    }
    */
    return errors;
}

// #endregion

// ajax call
function ajax(url, method, values, target, callback) {
    $(target).append("<span class='loading'>Please Wait</span>")
    $.ajax({
        url: url,
        method: method,
        data: values,
        error: function (result) {
            $(target).values("<div class='error'>Error - " + result.statusText + "</div>");
        },
        success: function (data) {
            if (data.error == null)
            {
                callback(data);
            }
            else
            {
                $(target).append("<div class='error'>" + data.error + "</div>");
            }
        }
    });
}

function getTime(time) {
    var t = time.Minutes.toString();
    t += (time.Seconds > 9 ? time.Seconds : "0" + time.Seconds);
    return t;
}

// #region Extensions

// turn form data to object
$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

Date.prototype.formatted = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
            (mm > 9 ? "" : "0") + mm,
            (dd > 9 ? "" : "0") + dd
    ].join("-");
};

function time(t) {
    var hh = (t.Hours > 9 ? "" : "0") + t.Hours;
    var mm = (t.Minutes > 9 ? "" : "0") + t.Minutes;
    return hh + ":" + mm;
}

// create POST requests dynamically
function post(path, parameters) {
    var form = $("<form></form>");

    form.attr("method", "post");
    form.attr("action", path);

    $.each(parameters, function (key, value) {
        var field = $("<input></input>");

        field.attr("type", "hidden");
        field.attr("name", key);
        field.attr("value", value);

        form.append(field);
    });

    $(document.body).append(form);
    form.submit();
}
// #endregion

