#!/bin/bash

ENV_FILE_PRODUCTION="/home/ubuntu/DjangoApps/Caju-Dashboard-v2/Caju-Dashboard-v2/.env"
ENV_FILE_LOCAL="/home/ubuntu/project_dir/Caju-Dashboard-v2/.env"

if [ -f "$ENV_FILE_PRODUCTION" ]; then
    source "$ENV_FILE_PRODUCTION"
elif [ -f "$ENV_FILE_LOCAL" ]; then
    source "$ENV_FILE_LOCAL"
else
    echo "No .env file found in either location."
    exit 1
fi

case "$DJANGO_ENV" in
    production)
		MAINTENANCE_FILE="/var/www/cajuboard.tnslabs.org/maintenance/maintenance_on.html"
        ;;
    local)
		MAINTENANCE_FILE="/var/www/testcajuboard.tnslabs.org/maintenance/maintenance_on.html"
        ;;
    *)
        echo "Invalid environment in .env file"
        exit 1
        ;;
esac


IMAGE_PATH="/maintenance_static/maintenance.png"
NGINX_SERVICE="nginx"
MAINTENANCE_CONTENT='
<!DOCTYPE html>
<html lang="en">
<title>This website is under maintenance ....</title>
<meta charset="UTF-8">
<meta name="description" content="Website under maintenance">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
	body {
		padding: 8%;
		font-family: verdana;
		text-align: center;
		margin-top: 1%;
		line-height: 30px;
		background-color:#000;
	}
	.txtblue {
		font-size: 16px;
		font-weight: 400;
		color: #0094ff;
	}
	.txtwhite {
		font-size: 16px;
		color: #fff;
	}
	.txtyellow {
		font-size: 16px;
		color: #ffd400;
	}
	.imgcenter {width:20%;
	}
	.timer {
		display: inline;
	}
</style>
</head>

<body class="body">
	<img src="'$IMAGE_PATH'" class="imgcenter" />
	<p class="txtblue">Our website is <a class="txtyellow">going through a maintenance</a> and will be available
		soon.<br />We request you to visit after <strong class="txtwhite">
			<p class="timer" id="days"></p>
			<p class="timer" id="hours"></p>
			<p class="timer" id="mins"></p>
			<p class="timer" id="secs"></p>
			<h2 id="end"></h2>
		</strong>.</p>
	<p class="txtwhite"><strong>Thank You!</strong> for visiting.</p>

	<script>
		// The data/time we want to countdown to
		var countDownDate = new Date("January 20, 2024 17:00:00").getTime();

		// Run myfunc every second
		var myfunc = setInterval(function () {

			var now = new Date().getTime();
			var timeleft = countDownDate - now;

			// Calculating the days, hours, minutes and seconds left
			var days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
			var hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);

			// Result is output to the specific element
			document.getElementById("days").innerHTML = days + "d "
			document.getElementById("hours").innerHTML = hours + "h "
			document.getElementById("mins").innerHTML = minutes + "m "
			document.getElementById("secs").innerHTML = seconds + "s "

			// Display the message when countdown is over
			if (timeleft < 0) {
				clearInterval(myfunc);
				document.getElementById("days").innerHTML = ""
				document.getElementById("hours").innerHTML = ""
				document.getElementById("mins").innerHTML = ""
				document.getElementById("secs").innerHTML = ""
				document.getElementById("end").innerHTML = "00h";
			}
		}, 1000);
	</script>

</body>

</html>'

function start_maintenance() {
    echo "Starting maintenance mode..."
    echo "$MAINTENANCE_CONTENT" > "$MAINTENANCE_FILE"
    systemctl reload "$NGINX_SERVICE"
    echo "Maintenance mode is active."
}

function stop_maintenance() {
    echo "Stopping maintenance mode..."
    if [ -f "$MAINTENANCE_FILE" ]; then
        rm "$MAINTENANCE_FILE"
        systemctl reload "$NGINX_SERVICE"
        echo "Maintenance mode is deactivated."
    else
        echo "Maintenance mode is already off."
    fi
}

function show_usage() {
    echo "Usage: $0 [start|stop]"
}

if [[ "$EUID" -ne 0 ]]; then
    echo "Please run as root"
    exit 1
fi

case "$1" in
    start)
        start_maintenance
        ;;
    stop)
        stop_maintenance
        ;;
    *)
        show_usage
        ;;
esac
