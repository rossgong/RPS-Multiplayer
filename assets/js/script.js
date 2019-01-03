var config = {
	apiKey: "AIzaSyDfSzcQGSx-DL5ODc0MjuMpn-4vOM9Orns",
	authDomain: "gongaware-test.firebaseapp.com",
	databaseURL: "https://gongaware-test.firebaseio.com",
	projectId: "gongaware-test",
	storageBucket: "gongaware-test.appspot.com",
	messagingSenderId: "759532035576"
};
firebase.initializeApp(config);

var baseRef = "/rps/";

var database = firebase.database();

var remotePlayer = null;
var localPlayer = null;

var localChoice = null;
var remoteChoice = null;

var hasLocalPlayer = false;
var initalLocalState = null;

var localRecord = { wins: 0, ties: 0, losses: 0 };

function setupRemotePlayer(isLocal, record) {
	if (remotePlayer === null) {
		console.log("Cannot setup if there isn't a player");
	} else {
		var remoteDiv = $("#remote-player");
		if (isLocal) {
			remoteDiv = $("#local-player");
		}
		remoteDiv.html("");

		if (isLocal) {
			remoteDiv.append("<h6>" + localPlayer + "</h6>");
		} else {
			remoteDiv.append("<h6>" + remotePlayer + "</h6>");
		}

		var recordDiv = $("<div>", { id: "recordDiv" });
		recordDiv.append("<p>Wins: " + localRecord.wins + "<p>")
		recordDiv.append("<p>Ties: " + localRecord.ties + "<p>")
		recordDiv.append("<p>Losses: " + localRecord.losses + "<p>")

		remoteDiv.append(recordDiv);
	}
}

function choiceListener(event) {
	localChoice = $(this).attr("data-value");
	$(".choice-button").prop("disabled", true);
	database.ref(baseRef + "choices/" + localPlayer).set(localChoice);

}

function setupLocalPlayer() {
	console.log("called");
	if (localPlayer === null) {
		console.log("Cannot setup if there isn't a player");
	} else {
		var localDiv = $("#local-player");
		localDiv.html("");

		localDiv.append("<h6>" + localPlayer + "</h6>");

		var buttonDiv = $("<div>", { id: "buttonDiv" });
		buttonDiv.append($("<button>", { class: "choice-button", "data-value": "rock" }).text("Rock"));
		buttonDiv.append($("<button>", { class: "choice-button", "data-value": "paper" }).text("Paper"));
		buttonDiv.append($("<button>", { class: "choice-button", "data-value": "scissors" }).text("Scissors"));

		localDiv.append(buttonDiv);

		var recordDiv = $("<div>", { id: "recordDiv" });
		recordDiv.append("<p>Wins: " + localRecord.wins + "<p>")
		recordDiv.append("<p>Ties: " + localRecord.ties + "<p>")
		recordDiv.append("<p>Losses: " + localRecord.losses + "<p>")

		localDiv.append(recordDiv);

		$(".choice-button").on("click", choiceListener);
	}
}

function resetLocalCard() {
	$("#local-player").html(initalLocalState);
	$("#nick-sub").on("click", localSubmit);
}

function localSubmit(event) {
	if ($("#user-input").val() != "") {
		localPlayer = $("#user-input").val();
		hasLocalPlayer = true;
		localRecord = { wins: 0, ties: 0, losses: 0 };

		database.ref(baseRef + "users/" + localPlayer).set(localRecord);
		database.ref(baseRef + "users/" + localPlayer).onDisconnect().remove();
		database.ref(baseRef + "choices/" + localPlayer).onDisconnect().remove();

		setupLocalPlayer();
	}

	return false;
}

function updateChoices() {
	if (localChoice == null) {
		$("#local-choice").text("Hasn't Chosen");
	} else if (hasLocalPlayer) {
		$("#local-choice").text(localChoice);
	} else {
		$("#local-choice").text("Choice made");
	}

	if (remoteChoice == null) {
		$("#remote-choice").text("Hasn't Chosen");
	} else if (localChoice == null) {
		$("#remote-choice").text("Choice made");
	} else {
		$("#remote-choice").text(remoteChoice);
	}
}

function judge() {
	$("#result-div");
	$("#result-div").append($("<img>", { src: "./assets/images/" + localChoice + ".jpg" }));
	$("#result-div").append($("<img>", { src: "./assets/images/" + remoteChoice + ".jpg" }));


	switch (localChoice) {
		case "rock":
			if (remoteChoice == "rock") {
				localRecord.ties++;
			} else if (remoteChoice == "paper") {
				localRecord.losses++;
			} else if (remoteChoice == "scissors") {
				localRecord.wins++;
			} else {
				console.log("Error in local rock")
			}
			break;
		case "paper":
			if (remoteChoice == "rock") {
				localRecord.wins++;
			} else if (remoteChoice == "paper") {
				localRecord.ties++;
			} else if (remoteChoice == "scissors") {
				localRecord.losses++;
			} else {
				console.log("Error in local paper")
			}
			break;
		case "scissors":
			if (remoteChoice == "rock") {
				localRecord.losses++;
			} else if (remoteChoice == "paper") {
				localRecord.wins++;
			} else if (remoteChoice == "scissors") {
				localRecord.ties++;
			} else {
				console.log("Error in local scissors")
			}
			break;
		default:
			console.log("Shouldn't reach this part of the judge function");
	}

	if (hasLocalPlayer) {
		setupLocalPlayer();
		database.ref(baseRef + "choices/" + localPlayer).remove();
		console.log(localRecord);
		database.ref(baseRef + "users/" + localPlayer).set(localRecord);
	}
}

$(document).ready(function () {
	initalLocalState = $("#local-player").html();
	resetLocalCard();

	database.ref(baseRef + "users/").on("value", function (snapshot) {
		if (snapshot.val() == null) {
			$("#remote-player").html("<h6>Waiting for another User...</h6>");
		} else {
			var users = Object.keys(snapshot.val());
			if (users.indexOf(localPlayer) === -1) {
				hasLocalPlayer = false;
				localPlayer = null;
			}

			if (users.length === 1) {
				if (!hasLocalPlayer) {
					remotePlayer = users[0];

					setupRemotePlayer(false, snapshot.val()[remotePlayer]);
					resetLocalCard();
				} else {
					$("#remote-player").html("<h6>Waiting for another User...</h6>")
				}
			} else if (users.length === 2) {
				if (localPlayer === null) {
					localPlayer = users[0];
					remotePlayer = users[1];

					setupRemotePlayer(false, snapshot.val()[remotePlayer]);
					setupRemotePlayer(true, snapshot.val()[local]);

				} else {
					remotePlayer = users[1 - users.indexOf(localPlayer)];

					setupRemotePlayer(false, snapshot.val()[remotePlayer]);
				}

			}
		}
	});

	database.ref(baseRef + "choices/").on("value", function (snapshot) {
		if (snapshot.val() === null) {
			localChoice = null;
			remoteChoice = null;
		} else {
			localChoice = snapshot.val()[localPlayer];
			remoteChoice = snapshot.val()[remotePlayer];
		}

		updateChoices();
		if (typeof remoteChoice === "string" && typeof localChoice === "string") {

			judge();
		}
	});
});